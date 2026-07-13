import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../env.js";

function allowedOrigins() {
  return new Set([
    env.PUBLIC_WEB_URL.replace(/\/$/, ""),
    "https://nznt.store",
    "https://www.nznt.store"
  ]);
}

export async function requireBrowserRequest(request: FastifyRequest, reply: FastifyReply): Promise<unknown> {
  if (request.headers.authorization?.startsWith("Bearer ")) return;
  const origin = request.headers.origin;
  const csrfHeader = request.headers["x-csrf-protection"];
  const fetchSite = request.headers["sec-fetch-site"];
  const origins = origin?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  const originAllowed = origins.length > 0 && new Set(origins).size === 1 && origins[0] !== undefined && allowedOrigins().has(origins[0]);
  const fetchSiteAllowed = !fetchSite || fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "cors";
  const csrfHeaderValid = csrfHeader === undefined || csrfHeader === "1";

  // Some reverse proxies remove custom request headers. The exact Origin is the
  // primary CSRF check; Fetch Metadata adds a second browser-side signal.
  if (!originAllowed || !fetchSiteAllowed || !csrfHeaderValid) {
    return reply.status(403).send({
      ok: false,
      error: { code: "CSRF_REJECTED", message: "Browser request verification failed" }
    });
  }
}
