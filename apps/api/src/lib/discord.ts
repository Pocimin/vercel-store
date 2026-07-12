import { env } from "../env.js";

export async function notifyDiscord(content: string) {
  if (!env.DISCORD_ADMIN_WEBHOOK_URL) return;
  await fetch(env.DISCORD_ADMIN_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content })
  }).catch((error) => {
    console.warn("[discord] notification failed", error);
  });
}
