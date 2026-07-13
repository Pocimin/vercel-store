import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../env.js";

function allowedOrigins() {
  return new Set([
    env.PUBLIC_WEB_URL.replace(/\/$/, ""),
    "https://nznt.store",
    "https://www.nznt.store"
  ]);
}

export function requireBrowserRequest(request: FastifyRequest, reply: FastifyReply): void {
  const origin = request.headers.origin;
  if (!origin || !allowedOrigins().has(origin) || request.headers["x-csrf-protection"] !== "1") {
    reply.status(403).send({
      ok: false,
      error: { code: "CSRF_REJECTED", message: "Browser request verification failed" }
    });
    return;
  }
}
