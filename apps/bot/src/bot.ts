import { Client, GatewayIntentBits } from "discord.js";
import { db, PaymentStatus, UserRole } from "@nznt/db";
import { encryptSecret, hashSecret, previewSecret } from "@nznt/auth";

const token = process.env.DISCORD_BOT_TOKEN;
const signingSecret = process.env.SCRIPT_SIGNING_SECRET ?? "";
const approvalRoles: UserRole[] = [UserRole.SUPPORT, UserRole.ADMIN, UserRole.OWNER];

async function createVonaliaLicense(plan: string, expiresAt: Date) {
  const apiKey = process.env.VONALIA_API_KEY;
  const teamId = plan.toLowerCase() === "weekly"
    ? process.env.VONALIA_WEEKLY_TEAM_ID ?? process.env.VONALIA_TEAM_ID
    : plan.toLowerCase() === "lifetime"
      ? process.env.VONALIA_LIFETIME_TEAM_ID ?? process.env.VONALIA_TEAM_ID
      : process.env.VONALIA_MONTHLY_TEAM_ID ?? process.env.VONALIA_TEAM_ID;
  if (!apiKey || !teamId) throw new Error("Vonalia API key/team ID is not configured");
  const call = async (method: string, path: string, body?: Record<string, unknown>) => {
    const response = await fetch(`https://vonalia.com/api/v1${path}`, {
      method,
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data: any = await response.json();
    if (!response.ok) throw new Error(data?.error ?? `Vonalia HTTP ${response.status}`);
    return data;
  };
  const created = await call("POST", `/teams/${teamId}/users`, {});
  const userId = String(created.user_id ?? created.userId ?? created.id ?? "");
  if (!userId) throw new Error("Vonalia did not return a user ID");
  await call("PATCH", `/teams/${teamId}/users/${encodeURIComponent(userId)}`, { type: plan, expiration: expiresAt.getTime() });
  const user = await call("GET", `/teams/${teamId}/users/${encodeURIComponent(userId)}`);
  if (!user.key) throw new Error("Vonalia did not return a license key");
  return { key: String(user.key), userId };
}

if (!token) {
  console.log("[bot] DISCORD_BOT_TOKEN is empty; bot process is idle");
  setInterval(() => {}, 2_147_483_647);
} else {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once("ready", () => {
    console.log(`[bot] logged in as ${client.user?.tag ?? "unknown"}`);
  });

  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith("!approve ")) return;

    const author = await db.user.findUnique({
      where: { discordId: message.author.id }
    });

    if (!author || !approvalRoles.includes(author.role)) {
      await message.reply("You are not linked as an admin.");
      return;
    }

    const paymentId = message.content.split(/\s+/)[1];
    if (!paymentId || !signingSecret) {
      await message.reply("Usage: `!approve <paymentId>`");
      return;
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    });

    if (!payment || payment.status !== PaymentStatus.PENDING) {
      await message.reply("Pending payment not found.");
      return;
    }

    const durationDays = payment.plan.toLowerCase() === "weekly" ? 7 : payment.plan.toLowerCase() === "lifetime" ? 36500 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    let plainKey: string;
    let providerUserId: string;
    try {
      const created = await createVonaliaLicense(payment.plan, expiresAt);
      plainKey = created.key;
      providerUserId = created.userId;
    } catch (error) {
      await message.reply(`Vonalia failed: ${error instanceof Error ? error.message : "unknown error"}`);
      return;
    }
    const license = await db.license.create({
      data: {
        userId: payment.userId,
        keyHash: hashSecret(plainKey.trim().toUpperCase(), signingSecret),
        keyPreview: previewSecret(plainKey),
        keyCiphertext: encryptSecret(plainKey, signingSecret),
        providerUserCiphertext: encryptSecret(providerUserId, signingSecret),
        plan: payment.plan,
        source: "DISCORD",
        maxDevices: 1,
        expiresAt,
        createdById: author.id
      }
    });

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.APPROVED,
        licenseId: license.id,
        processedById: author.id,
        processedAt: new Date()
      }
    });

    await message.reply(`Approved. License: \`${plainKey}\``);
  });

  await client.login(token);
}
