import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../env.js";

const REQUEST_TIMEOUT_MS = 10_000;

export class AutogopayError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status = 502, data?: unknown) {
    super(message);
    this.name = "AutogopayError";
    this.status = status;
    this.data = data;
  }
}

export interface CreateShopeeQrisResult {
  amount: number;
  orderSn: string;
  nmid: string;
  qrString: string;
  qrUrl: string | null;
  transactionTime: string | null;
  expiryTime: string | null;
}

export interface ShopeeQrisStatus {
  status: "pending" | "success";
  orderStatus: number | null;
  paid: boolean;
  amount: number | null;
  paidAt: string | null;
}

function baseUrl() {
  return env.AUTOGOPAY_BASE_URL.replace(/\/+$/, "");
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "TimeoutError";
}

async function autogopayRequest(method: "GET" | "POST", path: string, body?: Record<string, unknown>) {
  if (!env.AUTOGOPAY_API_KEY) throw new AutogopayError("AUTOGOPAY_API_KEY is not configured", 503);

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.AUTOGOPAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    if (isAbortError(error)) throw new AutogopayError("AutoGoPay request timed out", 504);
    throw new AutogopayError(`AutoGoPay connection failed: ${error instanceof Error ? error.message : "unknown error"}`, 502);
  }

  const text = await response.text();
  let data: Record<string, unknown> | null = null;
  if (text) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed as Record<string, unknown>;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.message ? String(data.message) : `AutoGoPay HTTP ${response.status}`;
    throw new AutogopayError(message, response.status, data);
  }
  return data;
}

function slottedData(response: Record<string, unknown> | null): Record<string, unknown> {
  const inner = response?.data;
  return inner && typeof inner === "object" && !Array.isArray(inner) ? inner as Record<string, unknown> : response ?? {};
}

export async function createShopeeQris(amount: number): Promise<CreateShopeeQrisResult> {
  if (!Number.isInteger(amount) || amount < 1 || amount > 10_000_000) {
    throw new AutogopayError("Amount must be an integer IDR between 1 and 10,000,000", 400);
  }
  const response = await autogopayRequest("POST", "/shopeepay/qris/create", { amount });
  const data = slottedData(response);
  const orderSn = typeof data.order_sn === "string" ? data.order_sn : null;
  const qrString = typeof data.qr_string === "string" ? data.qr_string : null;
  const qrUrl = typeof data.qr_url === "string" ? data.qr_url : null;
  if (!orderSn || !qrString) {
    throw new AutogopayError("AutoGoPay did not return order details", 502, response);
  }
  const rawAmount = Number(data.amount);
  return {
    amount: Number.isFinite(rawAmount) ? rawAmount : amount,
    orderSn,
    nmid: typeof data.nmid === "string" ? data.nmid : "",
    qrString,
    qrUrl,
    transactionTime: typeof data.transaction_time === "string" ? data.transaction_time : null,
    expiryTime: typeof data.expiry_time === "string" ? data.expiry_time : null
  };
}

export async function checkShopeeQris(orderSn: string): Promise<ShopeeQrisStatus> {
  if (!orderSn) throw new AutogopayError("order_sn is required", 400);
  const response = await autogopayRequest("GET", `/shopeepay/qris/status?order_sn=${encodeURIComponent(orderSn)}&router_id=1`);
  const data = slottedData(response);
  const rawStatus = typeof data.status === "string" ? data.status.toLowerCase() : "";
  const orderStatus = data.order_status != null ? Number(data.order_status) : null;
  const paid = data.paid === true || orderStatus === 2 || rawStatus === "success";
  const rawAmount = data.amount != null ? Number(data.amount) : NaN;
  return {
    status: paid ? "success" : "pending",
    orderStatus,
    paid,
    amount: Number.isFinite(rawAmount) ? rawAmount : null,
    paidAt: typeof data.paid_at === "string" ? data.paid_at : null
  };
}

export function verifyAutogopaySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!env.AUTOGOPAY_API_KEY) return false;
  const signature = signatureHeader?.trim();
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", env.AUTOGOPAY_API_KEY).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature, "hex");
  return expectedBuf.length === receivedBuf.length && timingSafeEqual(expectedBuf, receivedBuf);
}
