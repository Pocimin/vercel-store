import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { findUser, normalizeVonaliaCredential } from "@/lib/vonalia";

const SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: NextRequest) {
  // Rate limit: 5 key redemptions per hour per IP
  const rateLimitResponse = await applyRateLimit(request, 5, 60 * 60 * 1000)
  if (rateLimitResponse) return rateLimitResponse

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

    const normalizedKey = normalizeVonaliaCredential(key);
    if (!/^((KEY|USER)_[A-Za-z0-9_-]+)$/.test(normalizedKey)) {
      return NextResponse.json(
        { error: "Invalid key format" },
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

    const vonaliaApiKey = process.env.VONALIA_API_KEY;
    if (!vonaliaApiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const result = await findUser(vonaliaApiKey, normalizedKey);
    if (result.Error || !result.Info) {
      return NextResponse.json(
        { error: "Invalid key or password" },
        { status: 404 }
      );
    }

    const info = result.Info;
    const licenseType = (info.Type || info.type || "unknown").toLowerCase();
    const expirationSeconds = Number(info.Whitelist || 0);
    const licenseExpiresAt =
      Number.isFinite(expirationSeconds) && expirationSeconds > 0
        ? new Date(expirationSeconds * 1000)
        : null;

    // Update user with license info
    await prisma.user.update({
      where: { id: userId },
      data: {
        licenseKey: info.Key || info.key || normalizedKey,
        licensePassword: info.Password || info.password || normalizedKey,
        licenseType: licenseType,
        licenseExpiresAt,
        keyStatus: "active",
        lastKeyVerified: new Date(),
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
