import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

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
