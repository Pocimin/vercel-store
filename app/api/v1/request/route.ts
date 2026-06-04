import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { normalizeVonaliaCredential } from "@/lib/vonalia";

const VONALIA_BASE_URL = process.env.VONALIA_BASE_URL || "https://vonalia.com/api/v1";
const VONALIA_API_KEY = process.env.VONALIA_API_KEY;
const PROXY_SECRET = process.env.VONALIA_PROXY_SECRET || process.env.NZNT_API_SECRET || VONALIA_API_KEY;
const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

function getBearerToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return (
    request.headers.get("x-nznt-proxy-secret") ||
    request.headers.get("x-api-key") ||
    ""
  ).trim();
}

function resolveVonaliaEndpoint(input: { Endpoint?: string; Url?: string }): string | null {
  if (input.Endpoint) {
    if (!input.Endpoint.startsWith("/")) return null;
    if (!input.Endpoint.startsWith("/teams/")) return null;
    return input.Endpoint;
  }

  if (!input.Url) return null;

  try {
    const base = new URL(VONALIA_BASE_URL);
    const url = new URL(input.Url);
    if (url.origin !== base.origin) return null;
    if (!url.pathname.startsWith("/api/v1/teams/")) return null;
    return `${url.pathname.replace(/^\/api\/v1/, "")}${url.search}`;
  } catch {
    return null;
  }
}

async function parseUpstreamResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, 120, 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  if (!VONALIA_API_KEY || !PROXY_SECRET) {
    return NextResponse.json(
      { error: "Vonalia proxy is not configured" },
      { status: 500 }
    );
  }

  const suppliedSecret = normalizeVonaliaCredential(getBearerToken(request));
  if (suppliedSecret !== normalizeVonaliaCredential(PROXY_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const method = String(payload.Method || "POST").toUpperCase();
    const endpoint = resolveVonaliaEndpoint(payload);

    if (!ALLOWED_METHODS.has(method)) {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint must target Vonalia /teams routes" },
        { status: 400 }
      );
    }

    const upstreamResponse = await fetch(`${VONALIA_BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "api-key": normalizeVonaliaCredential(VONALIA_API_KEY),
      },
      body: payload.Body === undefined ? undefined : JSON.stringify(payload.Body),
    });

    const data = await parseUpstreamResponse(upstreamResponse);
    const contentType = upstreamResponse.headers.get("content-type") || "";

    if (data === null) {
      return new NextResponse(null, { status: upstreamResponse.status });
    }

    if (contentType.includes("application/json") || typeof data === "object") {
      return NextResponse.json(data, { status: upstreamResponse.status });
    }

    return new NextResponse(String(data), {
      status: upstreamResponse.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy request failed" },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
