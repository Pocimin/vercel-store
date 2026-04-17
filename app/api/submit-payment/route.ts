import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1494551497709715456/8tvju5XyGi_67EkC3Dg8uKqMyZGyPi_Du1AZ6jb5gWYuT9r18hgUL3r0jIKoMswf82Sl";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const robloxUsername = formData.get("robloxUsername") as string;
    const plan = formData.get("plan") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const proofFile = formData.get("proof") as File | null;

    if (!robloxUsername || !plan || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const planPrices: Record<string, string> = {
      weekly: "Rp 10,000 (~$1)",
      monthly: "Rp 30,000 (~$3)",
      lifetime: "Rp 50,000 (~$4)",
    };

    const planDurations: Record<string, string> = {
      weekly: "7 days",
      monthly: "30 days",
      lifetime: "Forever",
    };

    // Standard Discord embed - works reliably with webhooks
    const embed = {
      title: "New Payment Submission",
      color: 0x00d4ff, // Cyan
      fields: [
        {
          name: "Roblox Username",
          value: `\`${robloxUsername}\``,
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
          name: "Status",
          value: "Pending Review",
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
        text: "nznt's hub - DDS Script | Use /approve or /decline to process",
      },
      timestamp: new Date().toISOString(),
    };

    // Add image if proof file exists
    if (proofFile && proofFile.size > 0) {
      const discordFormData = new FormData();
      
      const payload = {
        content: `**New Payment from \`${robloxUsername}\`** - ${plan.toUpperCase()} (${paymentMethod.toUpperCase()})`,
        embeds: [embed],
      };
      
      discordFormData.append("payload_json", JSON.stringify(payload));
      
      const bytes = await proofFile.arrayBuffer();
      const blob = new Blob([bytes], { type: proofFile.type });
      discordFormData.append("files[0]", blob, `proof_${robloxUsername}_${Date.now()}.${proofFile.name.split('.').pop()}`);

      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        body: discordFormData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[v0] Discord webhook error:", response.status, errorText);
        return NextResponse.json(
          { error: "Failed to send to Discord" },
          { status: 500 }
        );
      }
    } else {
      // No file, just send JSON
      const payload = {
        content: `**New Payment from \`${robloxUsername}\`** - ${plan.toUpperCase()} (${paymentMethod.toUpperCase()})`,
        embeds: [embed],
      };

      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[v0] Discord webhook error:", response.status, errorText);
        return NextResponse.json(
          { error: "Failed to send to Discord" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Payment submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
