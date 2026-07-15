export const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

export type User = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  robloxUsername: string | null;
  role: "USER" | "SUPPORT" | "ADMIN" | "OWNER";
  twoFactorEnabled: boolean;
};

export type DashboardData = {
  user: User;
  licenses: Array<{ id: string; key: string | null; keyPreview: string; plan: string; status: string; expiresAt: string | null; createdAt?: string }>;
  payments: Array<{ id: string; plan: string; method: string; amount: number; currency: string; status: string; createdAt: string }>;
  monitoring: { configured: boolean; preview: string | null; code: string | null };
  sessions: Array<{
    id: string;
    status: string;
    game: string | null;
    executor: string | null;
    scriptFile: string | null;
    robloxUserId: string | null;
    robloxUsername: string | null;
    lastSeenAt: string;
    stats: Record<string, unknown> | null;
    currentTask: unknown;
    earnings: unknown;
    statsAt: string | null;
  }>;
};

export type MonitoringData = {
  activeSessions: number;
  queuedBuilds: number;
  recentEvents: Array<{
    id: string;
    type: string;
    createdAt: string;
    session?: {
      script?: { fileName: string } | null;
      user?: { username?: string | null; email?: string | null } | null;
      device?: { robloxUsername?: string | null; robloxUserId?: string | null } | null;
    };
  }>;
  scripts: Array<{
    id: string;
    fileName: string;
    game: string;
    channel: string;
    builds: Array<{ id: string; version: string; status: string; error?: string | null }>;
  }>;
  sessions: Array<{
    id: string;
    status: string;
    game: string | null;
    scriptFile: string | null;
    robloxUsername: string | null;
    lastSeenAt: string;
    stats: Record<string, unknown> | null;
  }>;
};

export type PaymentRow = {
  id: string;
  plan: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  user?: { email?: string | null; username?: string | null } | null;
  license?: { keyPreview: string } | null;
};

export function api(path: string, init: RequestInit = {}) {
  return fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "x-csrf-protection": "1",
      ...(init.headers ?? {}),
    },
  });
}

export async function json<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(body?.error?.message ?? "Request failed");
  return body.data;
}

export async function me() {
  return json<{ user: User }>(await api("/auth/me"));
}

export async function dashboard() {
  return json<DashboardData>(await api("/user/dashboard"));
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

export function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

export function formatMoney(amount?: number, currency = "IDR") {
  if (amount == null) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
