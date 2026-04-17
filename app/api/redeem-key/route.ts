import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { findUser } from "@/lib/vonalia";

const VONALIA_API_KEY = process.env.VONALIA_API_KEY;
const SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }
    
    const userId = token.sub as string;

    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    if (!VONALIA_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Check if user already has a license
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.licenseKey) {
      return NextResponse.json(
        { error: "You already have a license linked to your account" },
        { status: 400 }
      );
    }

    // Validate key with Vonalia
    const result = await findUser(VONALIA_API_KEY, key);

    if (result.Error) {
      return NextResponse.json(
        { error: "Invalid key" },
        { status: 400 }
      );
    }

    if (!result.Info) {
      return NextResponse.json(
        { error: "Invalid key" },
        { status: 400 }
      );
    }

    // Check if key is blacklisted
    if (result.Info.Blacklist === "true") {
      return NextResponse.json(
        { error: "This key has been blacklisted" },
        { status: 403 }
      );
    }

    // Determine license type from Vonalia response
    const licenseType = result.Info.Type?.toLowerCase() || "unknown";
    
    // Calculate expiration
    const whitelistTimestamp = parseInt(result.Info.Whitelist || "0");
    const licenseExpiresAt = whitelistTimestamp > 0 
      ? new Date(whitelistTimestamp * 1000) 
      : null;

    // Update user with license info
    await prisma.user.update({
      where: { id: userId },
      data: {
        licenseKey: key,
        licensePassword: key, // Store key as password for validation
        licenseType: licenseType,
        licenseExpiresAt: licenseExpiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Key redeemed successfully!",
      licenseType: result.Info.Type,
      expiresAt: licenseExpiresAt,
    });
  } catch (error) {
    console.error("Redeem key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
