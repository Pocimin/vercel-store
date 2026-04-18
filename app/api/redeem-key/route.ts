import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

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

    // Store the key directly (like Discord bot does)
    // Try to determine type from key format
    let licenseType = "unknown";
    if (key.toLowerCase().includes("weekly")) licenseType = "weekly";
    else if (key.toLowerCase().includes("monthly")) licenseType = "monthly";
    else if (key.toLowerCase().includes("lifetime")) licenseType = "lifetime";

    // Update user with license info
    await prisma.user.update({
      where: { id: userId },
      data: {
        licenseKey: key,
        licensePassword: key,
        licenseType: licenseType,
        licenseExpiresAt: null, // Local keys don't have expiration tracking
      },
    });

    return NextResponse.json({
      success: true,
      message: "Key redeemed successfully!",
      licenseType: licenseType.toUpperCase(),
    });
  } catch (error) {
    console.error("Redeem key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
