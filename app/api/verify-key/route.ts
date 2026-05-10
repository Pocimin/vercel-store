import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { findUser } from "@/lib/vonalia";
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

    // Vonalia's Find endpoint looks users up by password only. Some older
    // records may have the key saved where the password should be, so try both.
    const passwordCandidates = [
      user.licensePassword,
      user.licenseKey,
    ].filter((value, index, values): value is string => {
      return !!value && values.indexOf(value) === index;
    });

    let result: Awaited<ReturnType<typeof findUser>> | null = null;
    let successfulPassword: string | null = null;
    const errors: string[] = [];

    for (const password of passwordCandidates) {
      result = await findUser(vonaliaApiKey, password);
      if (!result.Error) {
        successfulPassword = password;
        break;
      }
      errors.push(result.Error);
    }

    // Determine key status. Transient Vonalia/API failures are not a key status.
    let keyStatus = "unknown";
    if (!result || result.Error) {
      const combinedError = errors.join("; ") || result?.Error || "Unknown error";
      const error = combinedError.toLowerCase();
      if (error.includes("not found") || error.includes("invalid")) {
        keyStatus = "invalid";
      } else {
        return NextResponse.json(
          {
            error: "Could not verify key with Vonalia. Please try again.",
            detail: combinedError,
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
        ...(successfulPassword && successfulPassword !== user.licensePassword
          ? { licensePassword: successfulPassword }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      keyStatus,
      lastVerified: new Date().toISOString(),
      vonaliaData: result?.Info || null,
    });

  } catch (error) {
    console.error("Key verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
