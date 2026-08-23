import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { env } from "../env.js";

export type PaymentAnnounceInput = {
  id: string;
  plan: string;
  method: string;
  amount: number;
  currency: string;
  createdAt: Date;
  proofUrl?: string | null;
  discordMessageId?: string | null;
  auto?: boolean;
  keyPreview?: string | null;
  processedAt?: Date | null;
  user?: { email?: string | null; username?: string | null; displayName?: string | null } | null;
};

export async function notifyDiscord(content: string) {
  if (!env.DISCORD_ADMIN_WEBHOOK_URL) return;
  await fetch(env.DISCORD_ADMIN_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content })
  }).catch((error) => {
    console.warn("[discord] webhook notification failed", error);
  });
}

function paymentChannelId() {
  return env.DISCORD_PAYMENT_CHANNEL_ID;
}

function paymentEmbed(payment: PaymentAnnounceInput, proofName?: string) {
  const user = payment.user;
  const userLabel = user?.displayName ?? user?.username ?? user?.email ?? "Unknown user";
  const userDetail = user?.email && user.email !== userLabel ? `\n${user.email}` : "";
  const plan = payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1);
  const amount = new Intl.NumberFormat("id-ID", { style: "currency", currency: payment.currency, maximumFractionDigits: 0 }).format(payment.amount);
  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "User", value: `${userLabel}${userDetail}`, inline: false },
    { name: "Plan", value: plan, inline: true },
    { name: "Price", value: amount, inline: true },
    { name: "Payment Method", value: payment.method.toUpperCase(), inline: true },
    { name: "Payment ID", value: `\`${payment.id}\``, inline: true }
  ];
  if (payment.auto) {
    fields.push(
      { name: "Status", value: "✅ Auto-Verified (ShopeePay QRIS)", inline: true },
      { name: "License", value: payment.keyPreview ? `\`${payment.keyPreview}\`` : "Sent by email", inline: true }
    );
  } else {
    fields.push({ name: "Status", value: "⏳ Pending Review", inline: true });
  }
  fields.push(
    { name: "Submitted At", value: `<t:${Math.floor(payment.createdAt.getTime() / 1000)}:F>`, inline: false },
    { name: "Processed At", value: payment.processedAt ? `<t:${Math.floor(payment.processedAt.getTime() / 1000)}:F>` : "—", inline: false }
  );
  return {
    title: payment.auto ? "💸 Payment Auto-Verified (ShopeePay QRIS)" : "💸 New Payment Submission",
    color: payment.auto ? 0x2ecc71 : 0x00bcd4,
    fields,
    image: proofName ? { url: `attachment://${proofName}` } : undefined,
    footer: { text: `nznt's hub - Payment ID: ${payment.id}` },
    timestamp: (payment.processedAt ?? payment.createdAt).toISOString()
  };
}

function paymentButtons(paymentId: string) {
  return [
    {
      type: 1,
      components: [
        { type: 2, style: 3, custom_id: `pay_approve_${paymentId}`, label: "Approve", emoji: { name: "✅" } },
        { type: 2, style: 4, custom_id: `pay_deny_${paymentId}`, label: "Reject", emoji: { name: "❌" } }
      ]
    }
  ];
}

async function botRequest(path: string, init: RequestInit) {
  if (!env.DISCORD_BOT_TOKEN) return null;
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      ...(init.headers ?? {})
    }
  }).catch((error) => {
    console.warn("[discord] bot request failed", error);
    return null;
  });
  if (!response || !response.ok) {
    if (response) console.warn("[discord] bot request failed", response.status, await response.text());
    return null;
  }
  return response;
}

export async function sendPaymentAnnounce(payment: PaymentAnnounceInput) {
  const channelId = paymentChannelId();
  if (!channelId || !env.DISCORD_BOT_TOKEN) return null;

  const proofName = !payment.auto && payment.proofUrl ? basename(payment.proofUrl) : undefined;
  const payload = {
    content: payment.auto
      ? "💸 Payment auto-verified (ShopeePay QRIS)"
      : env.DISCORD_ADMIN_ROLE_ID
        ? `<@&${env.DISCORD_ADMIN_ROLE_ID}> New payment request`
        : "New payment request",
    allowed_mentions: env.DISCORD_ADMIN_ROLE_ID ? { roles: [env.DISCORD_ADMIN_ROLE_ID] } : { parse: [] },
    embeds: [paymentEmbed(payment, !payment.auto ? proofName : undefined)],
    components: payment.auto ? [] : paymentButtons(payment.id)
  };

  let response: Response | null;
  if (!payment.auto && payment.proofUrl && proofName) {
    const form = new FormData();
    form.append("payload_json", JSON.stringify(payload));
    form.append("files[0]", new Blob([await readFile(payment.proofUrl)]), proofName);
    response = await botRequest(`/channels/${channelId}/messages`, { method: "POST", body: form });
  } else {
    response = await botRequest(`/channels/${channelId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  if (!response) return null;
  const message = await response.json() as { id: string; channel_id: string };
  return { id: message.id, channelId: message.channel_id };
}

export async function updatePaymentReview(payment: { id: string; discordMessageId?: string | null }, status: "APPROVED" | "REJECTED", processedBy: string) {
  const channelId = paymentChannelId();
  if (!channelId || !env.DISCORD_BOT_TOKEN || !payment.discordMessageId) return;
  const approved = status === "APPROVED";
  const message = `${approved ? "✅ **APPROVED**" : "❌ **REJECTED**"} by ${processedBy}`;
  await botRequest(`/channels/${channelId}/messages/${payment.discordMessageId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: message, components: [], allowed_mentions: { parse: [] } })
  });
}
