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

    // Vonalia's Find endpoint looks users up by password only.
    const password = user.licensePassword || user.licenseKey;
    const result = await findUser(vonaliaApiKey, password);

    // Determine key status
    let keyStatus = "unknown";
    if (result.Error) {
      if (result.Error.includes("not found") || result.Error.includes("invalid")) {
        keyStatus = "invalid";
      } else {
        keyStatus = "error";
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

    // Update user with verification timestamp and status
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastKeyVerified: new Date(),
        keyStatus: keyStatus,
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
