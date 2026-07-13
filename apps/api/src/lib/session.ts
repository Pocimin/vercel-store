import type { FastifyReply, FastifyRequest } from "fastify";
import { AccountStatus, UserRole, db, type User } from "@nznt/db";
import { verifySession } from "@nznt/auth";
import { env } from "../env.js";

export function getCookie(request: FastifyRequest, name: string): string | undefined {
  const cookie = request.headers.cookie;
  if (!cookie) return undefined;
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

function addSetCookie(reply: FastifyReply, value: string) {
  const current = typeof (reply as FastifyReply & { getHeader?: (name: string) => unknown }).getHeader === "function"
    ? (reply as FastifyReply & { getHeader: (name: string) => unknown }).getHeader("set-cookie")
    : undefined;
  const values = Array.isArray(current) ? current.map(String) : current ? [String(current)] : [];
  reply.header("set-cookie", [...values, value]);
}

function cookie(name: string, value: string, options: string) {
  return `${name}=${encodeURIComponent(value)}; ${options}`;
}

export function setSessionCookie(reply: FastifyReply, token: string) {
  addSetCookie(reply, cookie("nznt_session", token, `Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${env.NODE_ENV === "production" ? "; Secure" : ""}`));
}

export function clearSessionCookie(reply: FastifyReply) {
  addSetCookie(reply, "nznt_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

export function setDiscordOAuthStateCookie(reply: FastifyReply, state: string) {
  addSetCookie(reply, cookie("nznt_discord_oauth_state", state, `Path=/; HttpOnly; SameSite=Lax; Max-Age=600${env.NODE_ENV === "production" ? "; Secure" : ""}`));
}

export function clearDiscordOAuthStateCookie(reply: FastifyReply) {
  addSetCookie(reply, "nznt_discord_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

export async function getCurrentUser(request: FastifyRequest): Promise<User | null> {
  const token = getCookie(request, "nznt_session");
  if (!token) return null;
  const claims = await verifySession(token, env.SESSION_SECRET);
  if (!claims) return null;

  const user = await db.user.findUnique({ where: { id: claims.userId } });
  if (!user || user.status !== AccountStatus.ACTIVE) return null;
  return user;
}

export async function requireUser(request: FastifyRequest, reply: FastifyReply): Promise<User | null> {
  const user = await getCurrentUser(request);
  if (user) return user;
  reply.status(401).send({ ok: false, error: { code: "UNAUTHORIZED", message: "Login required" } });
  return null;
}

export async function requireAdminUser(request: FastifyRequest, reply: FastifyReply): Promise<User | null> {
  const user = await requireUser(request, reply);
  if (!user) return null;
  if (user.role === UserRole.ADMIN || user.role === UserRole.OWNER || user.role === UserRole.SUPPORT) return user;
  reply.status(403).send({ ok: false, error: { code: "FORBIDDEN", message: "Admin access required" } });
  return null;
}
