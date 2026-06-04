const VONALIA_BASE_URL = process.env.VONALIA_BASE_URL || "https://vonalia.com/api/v1";

type LicenseType = "Free" | "Weekly" | "Monthly" | "Lifetime" | string;

export function normalizeVonaliaCredential(value: string): string {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function isUsableVonaliaApiKey(value: string | undefined): boolean {
  const normalized = normalizeVonaliaCredential(value || "");
  const lowered = normalized.toLowerCase();

  return (
    normalized.startsWith("API_") &&
    normalized.length > "API_".length &&
    !lowered.includes("your_") &&
    !lowered.includes("placeholder")
  );
}

export function sanitizeVonaliaNote(value: string | null | undefined): string {
  const cleaned = String(value || "")
    .replace(/[^A-Za-z0-9 .,:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (cleaned || "web user").slice(0, 100);
}

interface StableVonaliaUser {
  password?: string | null;
  key?: string | null;
  hwid?: string | null;
  expiration?: string | number | null;
  ip?: string | null;
  type?: string | null;
  note?: string | null;
  roblox_id?: string | number | null;
  active?: boolean | string | null;
  freeze?: boolean | string | null;
  ban?: boolean | string | null;
  ban_reason?: string | null;
}

export interface VonaliaInfo extends StableVonaliaUser {
  Info?: {
    Key?: string;
    Password?: string;
  };
  Key?: string;
  Password?: string;
  Hardware?: string;
  Type?: string;
  IP?: string;
  Roblox?: string;
  Used?: string;
  Changed?: string;
  Frozen?: string;
  Whitelist?: string;
  Blacklist?: string;
  Reason?: string;
  Note?: string;
}

interface VonaliaResponse {
  Info?: VonaliaInfo;
  Error?: string;
  teamId?: string;
  userId?: string;
}

interface CreateUserResponse extends VonaliaResponse {}

type VonaliaUpdate = Partial<{
  hwid: string | null;
  expiration: string | number | null;
  ip: string | null;
  type: string | null;
  note: string | null;
  roblox_id: string | number | null;
  active: boolean | string | null;
  freeze: boolean | string | null;
  ban: boolean | string | null;
  ban_reason: string | null;
  Hardware: string | null;
  Whitelist: string | number | null;
  IP: string | null;
  Type: string | null;
  Roblox: string | number | null;
  Frozen: boolean | string | null;
  Blacklist: boolean | string | null;
  Reason: string | null;
  Note: string | null;
}>;

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

function getTeamIds(type?: LicenseType): string[] {
  const normalizedType = String(type || "").toLowerCase();
  const typedTeamId =
    normalizedType === "free"
      ? process.env.VONALIA_FREE_TEAM_ID
      : normalizedType === "weekly"
        ? process.env.VONALIA_WEEKLY_TEAM_ID || process.env.VONALIA_PREMIUM_TEAM_ID
        : normalizedType === "monthly"
          ? process.env.VONALIA_MONTHLY_TEAM_ID || process.env.VONALIA_PREMIUM_TEAM_ID
          : normalizedType === "lifetime"
            ? process.env.VONALIA_LIFETIME_TEAM_ID || process.env.VONALIA_PREMIUM_TEAM_ID
            : undefined;

  return unique([
    typedTeamId,
    process.env.VONALIA_TEAM_ID,
    process.env.VONALIA_PREMIUM_TEAM_ID,
    process.env.VONALIA_FREE_TEAM_ID,
    process.env.VONALIA_WEEKLY_TEAM_ID,
    process.env.VONALIA_MONTHLY_TEAM_ID,
    process.env.VONALIA_LIFETIME_TEAM_ID,
  ]);
}

function requireTeamIds(type?: LicenseType): string[] {
  const teamIds = getTeamIds(type);
  if (teamIds.length === 0) {
    throw new Error("Vonalia team ID is not configured");
  }
  return teamIds;
}

function toExpirationMs(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return String(numeric < 1_000_000_000_000 ? Math.floor(numeric * 1000) : Math.floor(numeric));
}

function expirationMsToSeconds(value: string | number | null | undefined): string | undefined {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return String(Math.floor(numeric / 1000));
}

function boolAlias(value: boolean | string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

function normalizeInfo(user: StableVonaliaUser): VonaliaInfo {
  return {
    ...user,
    Key: user.key || undefined,
    Password: user.password || undefined,
    Hardware: user.hwid || undefined,
    Type: user.type || undefined,
    IP: user.ip || undefined,
    Roblox: user.roblox_id === null || user.roblox_id === undefined ? undefined : String(user.roblox_id),
    Frozen: boolAlias(user.freeze),
    Whitelist: expirationMsToSeconds(user.expiration),
    Blacklist: boolAlias(user.ban),
    Reason: user.ban_reason || undefined,
    Note: user.note || undefined,
  };
}

function normalizeUpdate(updates: VonaliaUpdate): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if ("hwid" in updates) body.hwid = updates.hwid;
  if ("Hardware" in updates) body.hwid = updates.Hardware === "" ? null : updates.Hardware;

  if ("expiration" in updates) body.expiration = toExpirationMs(updates.expiration);
  if ("Whitelist" in updates) body.expiration = toExpirationMs(updates.Whitelist);

  if ("ip" in updates) body.ip = updates.ip;
  if ("IP" in updates) body.ip = updates.IP;
  if ("type" in updates) body.type = updates.type;
  if ("Type" in updates) body.type = updates.Type;
  if ("note" in updates) body.note = sanitizeVonaliaNote(updates.note);
  if ("Note" in updates) body.note = sanitizeVonaliaNote(updates.Note);
  if ("roblox_id" in updates) body.roblox_id = updates.roblox_id;
  if ("Roblox" in updates) body.roblox_id = updates.Roblox;
  if ("active" in updates) body.active = updates.active;
  if ("freeze" in updates) body.freeze = updates.freeze;
  if ("Frozen" in updates) body.freeze = updates.Frozen;
  if ("ban" in updates) body.ban = updates.ban;
  if ("Blacklist" in updates) body.ban = updates.Blacklist;
  if ("ban_reason" in updates) body.ban_reason = updates.ban_reason;
  if ("Reason" in updates) body.ban_reason = updates.Reason;

  return body;
}

async function parseVonaliaResponse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function vonaliaRequest(
  apiKey: string,
  method: string,
  endpoint: string,
  body?: Record<string, unknown>
): Promise<any> {
  const response = await fetch(`${VONALIA_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "api-key": normalizeVonaliaCredential(apiKey),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await parseVonaliaResponse(response);

  if (!response.ok) {
    const error =
      typeof data === "object" && data?.error
        ? data.error
        : `Vonalia HTTP Error: ${response.status}`;
    throw new Error(error);
  }

  return data;
}

export async function createUser(
  apiKey: string,
  type: LicenseType,
  whitelistTimestamp: number,
  note?: string
): Promise<CreateUserResponse> {
  try {
    const teamId = requireTeamIds(type)[0];
    const expiration = toExpirationMs(whitelistTimestamp);
    const created = await vonaliaRequest(apiKey, "POST", `/teams/${teamId}/users`, {});

    const userId = created?.user_id || created?.userId || created?.id;
    if (!userId) {
      return { Error: "Vonalia did not return a user_id" };
    }

    const updates: Record<string, unknown> = {
      type,
      expiration,
      ...(note ? { note: sanitizeVonaliaNote(note) } : {}),
    };
    await vonaliaRequest(
      apiKey,
      "PATCH",
      `/teams/${teamId}/users/${encodeURIComponent(userId)}`,
      updates
    );

    const user = await vonaliaRequest(
      apiKey,
      "GET",
      `/teams/${teamId}/users/${encodeURIComponent(userId)}`
    );

    return {
      Info: normalizeInfo(user),
      teamId,
      userId,
    };
  } catch (error) {
    return { Error: error instanceof Error ? error.message : "Vonalia API error" };
  }
}

export async function findUser(
  apiKey: string,
  password: string,
  preferredType?: LicenseType
): Promise<VonaliaResponse> {
  const normalizedPassword = normalizeVonaliaCredential(password);
  if (!normalizedPassword) return { Error: "No Vonalia user ID provided" };

  for (const teamId of requireTeamIds(preferredType)) {
    try {
      const user = await vonaliaRequest(
        apiKey,
        "GET",
        `/teams/${teamId}/users/${encodeURIComponent(normalizedPassword)}`
      );
      return { Info: normalizeInfo(user), teamId, userId: normalizedPassword };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vonalia API error";
      if (!message.toLowerCase().includes("not found")) {
        return { Error: message };
      }
    }
  }

  return { Error: "User not found" };
}

export async function editUser(
  apiKey: string,
  password: string,
  userKey: string,
  updates: VonaliaUpdate,
  preferredType?: LicenseType
): Promise<VonaliaResponse> {
  const identifier = normalizeVonaliaCredential(password || userKey);
  if (!identifier) return { Error: "No Vonalia user ID provided" };

  const found = await findUser(apiKey, identifier, preferredType);
  if (found.Error || !found.teamId) return found;

  try {
    await vonaliaRequest(
      apiKey,
      "PATCH",
      `/teams/${found.teamId}/users/${encodeURIComponent(identifier)}`,
      normalizeUpdate(updates)
    );
    return { Info: found.Info, teamId: found.teamId, userId: identifier };
  } catch (error) {
    return { Error: error instanceof Error ? error.message : "Vonalia API error" };
  }
}

export async function deleteUser(
  apiKey: string,
  password: string,
  preferredType?: LicenseType
): Promise<VonaliaResponse> {
  const identifier = normalizeVonaliaCredential(password);
  if (!identifier) return { Error: "No Vonalia user ID provided" };

  const found = await findUser(apiKey, identifier, preferredType);
  if (found.Error || !found.teamId) return found;

  try {
    await vonaliaRequest(
      apiKey,
      "DELETE",
      `/teams/${found.teamId}/users/${encodeURIComponent(identifier)}`
    );
    return { teamId: found.teamId, userId: identifier };
  } catch (error) {
    return { Error: error instanceof Error ? error.message : "Vonalia API error" };
  }
}

export function getWhitelistTimestamp(plan: "Weekly" | "Monthly" | "Lifetime"): number {
  const now = Date.now();
  switch (plan) {
    case "Weekly":
      return now + 7 * 24 * 60 * 60 * 1000;
    case "Monthly":
      return now + 30 * 24 * 60 * 60 * 1000;
    case "Lifetime":
      return 8_000_000_000_000;
    default:
      return now;
  }
}

export function formatExpiration(timestamp: string | undefined): string {
  if (!timestamp) return "Unknown";
  const ts = parseInt(timestamp);
  if (isNaN(ts)) return "Unknown";

  const now = Math.floor(Date.now() / 1000);
  if (ts - now > 50 * 365 * 24 * 60 * 60) {
    return "Never (Lifetime)";
  }

  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
