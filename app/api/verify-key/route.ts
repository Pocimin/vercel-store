import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { findUser, isUsableVonaliaApiKey, normalizeVonaliaCredential } from "@/lib/vonalia";
import { applyRateLimit } from "@/lib/rate-limit";

const SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: NextRequest) {
  // Rate limit: 5 verifications per hour per IP
  const rateLimitResponse = await applyRateLimit(request, 5, 60 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const token = await getToken({ req: request, secret: SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = token.sub as string;

    // Get user's license info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { licenseKey: true, licensePassword: true },
    });

    if (!user?.licenseKey) {
      return NextResponse.json(
        { error: "No license found" },
        { status: 400 }
      );
    }

    const vonaliaApiKey = process.env.VONALIA_API_KEY;
    if (!vonaliaApiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const normalizedApiKey = normalizeVonaliaCredential(vonaliaApiKey);
    if (!isUsableVonaliaApiKey(normalizedApiKey)) {
      return NextResponse.json(
        { error: "Server Vonalia API key is misconfigured" },
        { status: 500 }
      );
    }

    // Vonalia's Find endpoint looks users up by password only.
    const password = normalizeVonaliaCredential(user.licensePassword || user.licenseKey);
    if (!password) {
      return NextResponse.json(
        { error: "No license password found" },
        { status: 400 }
      );
    }
    const result = await findUser(normalizedApiKey, password);

    // Determine key status. Transient Vonalia/API failures are not a key status.
    let keyStatus = "unknown";
    if (result.Error) {
      const error = result.Error.toLowerCase();
      if (error.includes("not found") || error.includes("invalid")) {
        keyStatus = "invalid";
      } else {
        return NextResponse.json(
          {
            error: "Could not verify key with Vonalia. Please try again.",
            detail: result.Error,
          },
          { status: 502 }
        );
      }
    } else if (result.Info) {
      // Check if expired based on Whitelist timestamp
      const whitelist = result.Info.Whitelist;
      if (whitelist) {
        const whitelistTime = parseInt(whitelist);
        const now = Math.floor(Date.now() / 1000);
        if (whitelistTime !== 0 && whitelistTime < now) {
          keyStatus = "expired";
        } else {
          keyStatus = "active";
        }
      } else {
        keyStatus = "active";
      }
    }

    // Update user only after a definitive key result.
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastKeyVerified: new Date(),
        keyStatus: keyStatus,
        ...(password !== user.licensePassword
          ? { licensePassword: password }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      keyStatus,
      lastVerified: new Date().toISOString(),
      vonaliaData: result.Info || null,
    });

  } catch (error) {
    console.error("Key verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
