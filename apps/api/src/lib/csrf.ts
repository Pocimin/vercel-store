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
  const contentType = (request.headers["content-type"] ?? "").split(";", 1)[0]?.trim().toLowerCase();
  const fetchSite = request.headers["sec-fetch-site"];
  const origins = origin?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  const originAllowed = origins.length > 0 && new Set(origins).size === 1 && origins[0] !== undefined && allowedOrigins().has(origins[0]);
  const fetchSiteAllowed = !fetchSite || fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "cors";
  const csrfHeaderValid = csrfHeader === "1";
  const contentTypeValid = contentType === "application/json";

  // Require both an exact same-site origin and a non-simple JSON request. This
  // blocks cross-site form submissions even if a sibling origin is compromised.
  if (!originAllowed || !fetchSiteAllowed || !csrfHeaderValid || !contentTypeValid) {
    return reply.status(403).send({
      ok: false,
      error: { code: "CSRF_REJECTED", message: "Browser request verification failed" }
    });
  }
}
