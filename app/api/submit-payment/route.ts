import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: NextRequest) {
  // Rate limit: 3 payment submissions per hour per IP
  const rateLimitResponse = await applyRateLimit(request, 3, 60 * 60 * 1000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Check authentication
    const token = await getToken({ req: request, secret: SECRET });
    if (!token?.sub) {
      return NextResponse.json(
        { error: "You must be logged in to make a payment" },
        { status: 401 }
      );
    }

    if (!DISCORD_WEBHOOK_URL) {
      return NextResponse.json(
        { error: "Payment system is not configured" },
        { status: 500 }
      );
    }

    const userId = token.sub as string;
    const formData = await request.formData();
    const discord = formData.get("discord") as string;
    const plan = formData.get("plan") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const proofFile = formData.get("proof") as File | null;

    if (!plan || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate plan and payment method
    const validPlans = ["weekly", "monthly"];
    const validPaymentMethods = ["qris", "paypal", "robux"];
    
    if (!validPlans.includes(plan) || !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid plan or payment method" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (proofFile && proofFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    if (proofFile && !proofFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Check if user already has a pending payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId,
        status: "pending",
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "You already have a pending payment. Please wait for it to be processed." },
        { status: 400 }
      );
    }

    const planPrices: Record<string, string> = {
      weekly: "Rp 10,000 (~$1)",
      monthly: "Rp 30,000 (~$3)",
    };

    const planDurations: Record<string, string> = {
      weekly: "7 days",
      monthly: "30 days",
    };

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        plan,
        paymentMethod,
        status: "pending",
        discordUsername: discord || null,
      },
    });

    // Create Discord webhook payload with buttons (using components v2 format)
    const embed = {
      title: "New Payment Submission",
      color: 0x00d4ff,
      fields: [
        {
          name: "User",
          value: `<@${user.username}> (${user.email})`,
          inline: false,
        },
        {
          name: "Discord",
          value: discord ? `\`${discord}\`` : "Not provided",
          inline: true,
        },
        {
          name: "Plan",
          value: `**${plan.charAt(0).toUpperCase() + plan.slice(1)}**\n${planDurations[plan]}`,
          inline: true,
        },
        {
          name: "Price",
          value: planPrices[plan] || "Unknown",
          inline: true,
        },
        {
          name: "Payment Method",
          value: paymentMethod.toUpperCase(),
          inline: true,
        },
        {
          name: "Payment ID",
          value: `\`${payment.id}\``,
          inline: true,
        },
        {
          name: "Status",
          value: "⏳ Pending Review",
          inline: true,
        },
        {
          name: "Submitted At",
          value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
          inline: true,
        },
      ],
      thumbnail: {
        url: "https://www.roblox.com/headshot-thumbnail/image?userId=1&width=420&height=420&format=png",
      },
      footer: {
        text: `nznt's hub - Payment ID: ${payment.id}`,
      },
      timestamp: new Date().toISOString(),
    };

    // Prepare payload with buttons - use Discord's interaction URL format
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    // Add image if proof file exists
    let discordResponse;
    if (proofFile && proofFile.size > 0) {
      const discordFormData = new FormData();
      
      const payload = {
        content: `<@&1256664627115331668> **New Payment Request** from \`${user.username}\``,
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "✅ Approve Payment",
                url: `${baseUrl}/admin/payments?action=approve&id=${payment.id}`,
              },
              {
                type: 2,
                style: 5,
                label: "❌ Decline Payment",
                url: `${baseUrl}/admin/payments?action=decline&id=${payment.id}`,
              },
            ],
          },
        ],
      };
      
      discordFormData.append("payload_json", JSON.stringify(payload));
      
      const bytes = await proofFile.arrayBuffer();
      const blob = new Blob([bytes], { type: proofFile.type });
      discordFormData.append("files[0]", blob, `proof_${Date.now()}.${proofFile.name.split('.').pop()}`);

      discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        body: discordFormData,
      });
    } else {
      const payload = {
        content: `<@&1256664627115331668> **New Payment Request** from \`${user.username}\``,
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "✅ Approve Payment",
                url: `${baseUrl}/admin/payments?action=approve&id=${payment.id}`,
              },
              {
                type: 2,
                style: 5,
                label: "❌ Decline Payment",
                url: `${baseUrl}/admin/payments?action=decline&id=${payment.id}`,
              },
            ],
          },
        ],
      };

      discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord webhook error:", discordResponse.status, errorText);
      // Don't fail the request, just log it
    } else {
      // Store the Discord message ID for later updates
      const discordData = await discordResponse.json();
      if (discordData.id) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { discordMessageId: discordData.id },
        });
      }
    }

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (error) {
    console.error("Payment submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
