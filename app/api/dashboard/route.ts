import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

const SECRET = process.env.NEXTAUTH_SECRET;

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = token.sub as string;

    // Get user with license info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        licenseKey: true,
        licenseType: true,
        licenseExpiresAt: true,
      },
    });

    // Check for pending payment
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        userId,
        status: "pending",
      },
      select: {
        id: true,
        plan: true,
        status: true,
        createdAt: true,
      },
    });

    const hasLicense = !!user?.licenseKey;

    return NextResponse.json({
      hasLicense,
      license: hasLicense ? {
        key: user?.licenseKey,
        plan: user?.licenseType,
        expiresAt: user?.licenseExpiresAt,
      } : undefined,
      pendingPayment: pendingPayment || undefined,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
