import { env } from "../env.js";

const BASE_URL = "https://vonalia.com/api/v1";

export interface VonaliaUser {
  key?: string | null;
  password?: string | null;
  expiration?: string | number | null;
  active?: boolean | string | null;
  freeze?: boolean | string | null;
  ban?: boolean | string | null;
  ban_reason?: string | null;
}

function teamIds(plan?: string) {
  const typed = plan?.toLowerCase() === "weekly"
    ? env.VONALIA_WEEKLY_TEAM_ID
    : plan?.toLowerCase() === "lifetime"
      ? env.VONALIA_LIFETIME_TEAM_ID
      : env.VONALIA_MONTHLY_TEAM_ID;
  return [...new Set([
    typed,
    env.VONALIA_TEAM_ID,
    env.VONALIA_WEEKLY_TEAM_ID,
    env.VONALIA_MONTHLY_TEAM_ID,
    env.VONALIA_LIFETIME_TEAM_ID
  ].filter((value): value is string => Boolean(value)))];
}

async function request(method: string, path: string, body?: Record<string, unknown>) {
  if (!env.VONALIA_API_KEY) throw new Error("Vonalia API key is not configured");
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "api-key": env.VONALIA_API_KEY },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!response.ok) throw new Error(typeof data === "object" && data?.error ? data.error : `Vonalia HTTP ${response.status}`);
  return data;
}

export async function findVonaliaUser(identifier: string, plan?: string): Promise<VonaliaUser> {
  const ids = teamIds(plan);
  if (!ids.length) throw new Error("Vonalia team ID is not configured");
  for (const teamId of ids) {
    try {
      return await request("GET", `/teams/${teamId}/users/${encodeURIComponent(identifier)}`) as VonaliaUser;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.toLowerCase().includes("not found")) throw error;
    }
  }
  throw new Error("Vonalia user not found");
}

export async function createVonaliaUser(plan: string, expiresAt: Date, note: string) {
  const teamId = teamIds(plan)[0];
  if (!teamId) throw new Error("Vonalia team ID is not configured");
  const created = await request("POST", `/teams/${teamId}/users`, {});
  const userId = String(created?.user_id ?? created?.userId ?? created?.id ?? "");
  if (!userId) throw new Error("Vonalia did not return a user ID");
  await request("PATCH", `/teams/${teamId}/users/${encodeURIComponent(userId)}`, {
    type: plan,
    expiration: expiresAt.getTime(),
    note: note.replace(/[^A-Za-z0-9 .,:]/g, " ").slice(0, 100)
  });
  const user = await request("GET", `/teams/${teamId}/users/${encodeURIComponent(userId)}`) as VonaliaUser;
  const key = String(user.key ?? "");
  if (!key) throw new Error("Vonalia did not return a license key");
  return { key, userId };
}

export function vonaliaExpiresAt(user: VonaliaUser) {
  const rawExpiration = Number(user.expiration);
  if (!Number.isFinite(rawExpiration) || rawExpiration <= 0) return null;
  const expiration = rawExpiration < 1_000_000_000_000 ? rawExpiration * 1000 : rawExpiration;
  return new Date(expiration);
}

export function vonaliaStatus(user: VonaliaUser) {
  const truthy = (value: unknown) => value === true || String(value).toLowerCase() === "true" || value === 1 || value === "1";
  if (truthy(user.ban) || truthy(user.freeze) || user.active === false || String(user.active).toLowerCase() === "false") return "SUSPENDED" as const;
  const rawExpiration = Number(user.expiration);
  const expiration = rawExpiration > 0 && rawExpiration < 1_000_000_000_000 ? rawExpiration * 1000 : rawExpiration;
  if (expiration > 0 && expiration < Date.now()) return "EXPIRED" as const;
  return "ACTIVE" as const;
}
