function defaultApiUrl() {
  if (typeof window !== "undefined" && ["nznt.store", "www.nznt.store"].includes(window.location.hostname)) {
    return "https://api.nznt.store";
  }
  return "http://localhost:4000";
}

export const apiUrl = import.meta.env.VITE_API_URL || defaultApiUrl();
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
  proofUrl?: string | null;
  user?: { email?: string | null; username?: string | null } | null;
  license?: { keyPreview: string } | null;
};

export class ApiError extends Error {
  readonly code: string;
  constructor(message: string, code = "REQUEST_FAILED") {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

function parseApiError(body: unknown): ApiError {
  const err = (body as { error?: unknown } | null)?.error;
  if (typeof err === "string") return new ApiError(err, err);
  if (err && typeof err === "object") {
    const shape = err as { code?: unknown; message?: unknown };
    const code = typeof shape.code === "string" ? shape.code : "";
    const message = typeof shape.message === "string" ? shape.message : "";
    return new ApiError(message || code || "Request failed", code || "REQUEST_FAILED");
  }
  return new ApiError("Request failed");
}

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
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON body falls through to the generic error below
  }
  const envelope = body as { ok?: unknown; data?: unknown } | null;
  if (!response.ok || !envelope?.ok) throw parseApiError(body);
  return envelope.data as T;
}

const AUTH_ERROR_LABELS: Record<string, string> = {
  CAPTCHA_REQUIRED: "Captcha wajib diselesaikan · Captcha verification required",
  BAD_LICENSE: "License key salah / tidak aktif · License key is invalid or inactive",
  LICENSE_CLAIMED: "License key sudah terpakai · License key already claimed by an account",
};

export function authErrorMessage(error: unknown, fallback = "Authentication failed"): string {
  const known = error instanceof ApiError ? AUTH_ERROR_LABELS[error.code] : undefined;
  if (known) return known;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
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
