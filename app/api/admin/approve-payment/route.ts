import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { createUser, getWhitelistTimestamp } from "@/lib/vonalia";

const VONALIA_API_KEY = process.env.VONALIA_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication via JWT
    const token = await getToken({ req: request, secret: SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { paymentId, adminUsername } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: `Payment is already ${payment.status}` },
        { status: 400 }
      );
    }

    if (!VONALIA_API_KEY) {
      return NextResponse.json(
        { error: "Vonalia API key not configured" },
        { status: 500 }
      );
    }

    // Create license key via Vonalia API
    const duration = payment.plan === "weekly" ? 7 * 86400 : 
                     payment.plan === "monthly" ? 30 * 86400 : 0;
    
    const whitelistTimestamp = getWhitelistTimestamp(
      payment.plan === "lifetime" ? "Lifetime" : 
      payment.plan === "weekly" ? "Weekly" : "Monthly"
    );

    const keyData = await createUser(
      VONALIA_API_KEY,
      payment.plan === "lifetime" ? "Lifetime" : payment.plan === "weekly" ? "Weekly" : "Monthly",
      whitelistTimestamp
    );

    if (keyData.Error || !keyData.Info?.Info?.Password) {
      console.log("Vonalia create key error:", JSON.stringify(keyData, null, 2));
      return NextResponse.json(
        { error: `Failed to create license key: ${keyData.Error || "Missing password in response"}` },
        { status: 500 }
      );
    }

    const licenseKey = keyData.Info.Info.Key || "";
    const licensePassword = keyData.Info.Info.Password;

    // Calculate expiration
    const expiresAt = payment.plan === "lifetime" 
      ? null 
      : new Date(Date.now() + duration * 1000);

    // Update user with license info
    await prisma.user.update({
      where: { id: payment.userId },
      data: {
        licenseKey,
        licensePassword,
        licenseType: payment.plan,
        licenseExpiresAt: expiresAt,
        robloxUsername: payment.user.robloxUsername || undefined,
      },
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "approved",
        processedAt: new Date(),
        processedBy: adminUsername || "admin",
      },
    });

    // Update Discord message if possible
    if (payment.discordMessageId && DISCORD_WEBHOOK_URL) {
      try {
        await fetch(`${DISCORD_WEBHOOK_URL}/messages/${payment.discordMessageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `✅ **APPROVED** by ${adminUsername || "admin"}`,
            components: [],
          }),
        });
      } catch (e) {
        console.error("Failed to update Discord message:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment approved and license key created",
      licenseKey,
      userId: payment.userId,
    });
  } catch (error) {
    console.error("Approve payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
