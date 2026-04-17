import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Admin API key for authentication
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "your-admin-secret-key";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${ADMIN_API_KEY}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { paymentId, adminUsername, reason } = await request.json();

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

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "declined",
        processedAt: new Date(),
        processedBy: adminUsername || "admin",
        declineReason: reason || "No reason provided",
      },
    });

    // Update Discord message if possible
    if (payment.discordMessageId && DISCORD_WEBHOOK_URL) {
      try {
        await fetch(`${DISCORD_WEBHOOK_URL}/messages/${payment.discordMessageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `❌ **DECLINED** by ${adminUsername || "admin"}${reason ? `\nReason: ${reason}` : ""}`,
            components: [],
          }),
        });
      } catch (e) {
        console.error("Failed to update Discord message:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment declined",
      userId: payment.userId,
    });
  } catch (error) {
    console.error("Decline payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
