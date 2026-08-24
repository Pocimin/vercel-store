import type { FastifyInstance, FastifyReply } from "fastify";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { authenticator } from "otplib";
import { z } from "zod";
import { LicenseSource, LicenseStatus, Prisma, UserRole, db, type User } from "@nznt/db";
import { encryptSecret, hashPassword, hashSecret, previewSecret, signSession, verifyPassword } from "@nznt/auth";
import { env } from "../env.js";
import { clearDiscordOAuthStateCookie, clearSessionCookie, getCookie, requireAdminUser, requireUser, setDiscordOAuthStateCookie, setSessionCookie } from "../lib/session.js";
import { verifyTurnstile } from "../lib/turnstile.js";
import { requireBrowserRequest } from "../lib/csrf.js";
import { findVonaliaUser, vonaliaExpiresAt, vonaliaStatus } from "../lib/vonalia.js";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(8),
  licenseKey: z.string().min(8).max(128).optional(),
  robloxUsername: z.string().min(1).max(64).optional(),
  turnstileToken: z.string().optional()
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
  totp: z.string().optional(),
  turnstileToken: z.string().optional()
});

const redeemSchema = z.object({
  licenseKey: z.string().min(10).max(128),
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(8),
  robloxUsername: z.string().min(1).max(64).optional(),
  turnstileToken: z.string().optional()
});

const verifyKeySchema = z.object({
  licenseKey: z.string().min(8).max(128)
});

const authRateLimit = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

function parseBody<T>(schema: z.ZodType<T>, body: unknown, reply: FastifyReply): T | undefined {
  const result = schema.safeParse(body);
  if (!result.success) {
    reply.status(400).send({ ok: false, error: { code: "BAD_REQUEST", message: "Invalid request body" } });
    return undefined;
  }
  return result.data;
}

const TOTP_FAIL_LIMIT = 5;
const TOTP_LOCK_MS = 15 * 60 * 1000;
const totpFails = new Map<string, { fails: number; until: number }>();

function totpIsLocked(userId: string): boolean {
  const entry = totpFails.get(userId);
  if (!entry) return false;
  if (entry.until > 0) {
    if (entry.until <= Date.now()) {
      totpFails.delete(userId);
      return false;
    }
    return true;
  }
  return false;
}

function recordTotpFailure(userId: string): void {
  const entry = totpFails.get(userId);
  const fails = (entry?.fails ?? 0) + 1;
  totpFails.set(userId, { fails, until: fails >= TOTP_FAIL_LIMIT ? Date.now() + TOTP_LOCK_MS : 0 });
}

function clearTotpFailures(userId: string): void {
  totpFails.delete(userId);
}

type ClaimResolution =
  | { kind: "local"; licenseId: string; keyHash: string; keyPreview: string; plan: string }
  | { kind: "provider"; key: string; keyHash: string; keyPreview: string; plan: string; providerExpiresAt: Date | null };

class LicenseClaimError extends Error {
  constructor() {
    super("License already claimed");
  }
}

function isLicenseClaimConflict(error: unknown): boolean {
  if (error instanceof LicenseClaimError) return true;
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
  return !/(email|username)/i.test(target);
}

function isAccountConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
  return /(email|username)/i.test(target);
}

async function resolveLicenseForClaim(rawKey: string): Promise<ClaimResolution | "claimed" | "invalid"> {
  const key = rawKey.trim().toUpperCase();
  const keyHash = hashSecret(key, env.SCRIPT_SIGNING_SECRET);

  const license = await db.license.findUnique({ where: { keyHash } });
  if (license) {
    if (license.userId) return "claimed";
    if (license.status !== LicenseStatus.ACTIVE || (license.expiresAt && license.expiresAt <= new Date())) {
      return "invalid";
    }
    return { kind: "local", licenseId: license.id, keyHash, keyPreview: license.keyPreview, plan: license.plan };
  }

  try {
    const remote = await findVonaliaUser(key);
    if (vonaliaStatus(remote) !== "ACTIVE") return "invalid";
    const providerExpiresAt = vonaliaExpiresAt(remote);
    if (providerExpiresAt && providerExpiresAt.getTime() <= Date.now()) return "invalid";
    return { kind: "provider", key, keyHash, keyPreview: previewSecret(key), plan: "vonalia", providerExpiresAt };
  } catch {
    return "invalid";
  }
}

async function createUserWithLicense(
  input: { email: string; username: string; password: string; robloxUsername?: string | undefined },
  resolution: Exclude<ClaimResolution, string> | null
) {
  return db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username,
        displayName: input.username,
        passwordHash: await hashPassword(input.password),
        robloxUsername: input.robloxUsername ?? null
      }
    });

    if (resolution?.kind === "local") {
      const claimed = await tx.license.updateMany({
        where: { id: resolution.licenseId, userId: null },
        data: { userId: created.id }
      });
      if (claimed.count === 0) throw new LicenseClaimError();
    } else if (resolution?.kind === "provider") {
      await tx.license.create({
        data: {
          userId: created.id,
          keyHash: resolution.keyHash,
          keyPreview: resolution.keyPreview,
          keyCiphertext: encryptSecret(resolution.key, env.SCRIPT_SIGNING_SECRET),
          providerUserCiphertext: encryptSecret(resolution.key, env.SCRIPT_SIGNING_SECRET),
          plan: resolution.plan,
          source: LicenseSource.IMPORT,
          maxDevices: 1,
          expiresAt: resolution.providerExpiresAt
        }
      });
    }

    return created;
  });
}

export async function registerAuthRoutes(app: FastifyInstance) {
  const decoyPasswordHash = await hashPassword(randomBytes(24).toString("hex"));

  app.post("/auth/register", { ...authRateLimit, preHandler: requireBrowserRequest }, async (request, reply) => {
    const input = registerSchema.parse(request.body);
    if (!(await verifyTurnstile(input.turnstileToken, request.ip))) {
      return reply.status(403).send({ ok: false, error: { code: "CAPTCHA_REQUIRED", message: "Captcha verification failed" } });
    }

    const email = input.email.toLowerCase();
    const existing = await db.user.findFirst({
      where: { OR: [{ email }, { username: input.username }] },
      select: { id: true }
    });
    if (existing) {
      return reply.status(409).send({ ok: false, error: { code: "ACCOUNT_EXISTS", message: "An account with that email or username already exists." } });
    }

    let resolution: ClaimResolution | "invalid" | "claimed" | null = null;
    if (input.licenseKey) {
      resolution = await resolveLicenseForClaim(input.licenseKey);
      if (resolution === "claimed") {
        return reply.status(409).send({ ok: false, error: { code: "LICENSE_CLAIMED", message: "This license already belongs to an account. Sign in with the purchase account." } });
      }
      if (resolution === "invalid") {
        return reply.status(403).send({ ok: false, error: { code: "BAD_LICENSE", message: "License key is invalid, expired, or inactive" } });
      }
    }

    let user;
    try {
      user = await createUserWithLicense(input, resolution);
    } catch (error) {
      if (isAccountConflict(error)) {
        return reply.status(409).send({ ok: false, error: { code: "ACCOUNT_EXISTS", message: "An account with that email or username already exists." } });
      }
      if (isLicenseClaimConflict(error)) {
        return reply.status(409).send({ ok: false, error: { code: "LICENSE_CLAIMED", message: "This license already belongs to an account. Sign in with the purchase account." } });
      }
      throw error;
    }

    const token = await signSession({ userId: user.id, role: user.role }, env.SESSION_SECRET);
    setSessionCookie(reply, token);
    return reply.status(201).send({ ok: true, data: { user: sanitizeUser(user) } });
  });

  app.post("/auth/login", { ...authRateLimit, preHandler: requireBrowserRequest }, async (request, reply) => {
    const input = loginSchema.parse(request.body);
    if (!(await verifyTurnstile(input.turnstileToken, request.ip))) {
      return reply.status(403).send({ ok: false, error: { code: "CAPTCHA_REQUIRED", message: "Captcha verification failed" } });
    }
    const identifier = input.emailOrUsername.toLowerCase();
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: input.emailOrUsername }
        ]
      }
    });

    const passwordValid = await verifyPassword(input.password, user?.passwordHash ?? decoyPasswordHash);
    if (!user || !user.passwordHash || !passwordValid) {
      return reply.status(401).send({ ok: false, error: { code: "BAD_LOGIN", message: "Invalid login" } });
    }

    if (user.twoFactorEnabled) {
      if (!input.totp) {
        return reply.status(401).send({ ok: false, error: { code: "TOTP_REQUIRED", message: "Valid 2FA code required" } });
      }
      if (totpIsLocked(user.id)) {
        return reply.status(429).send({ ok: false, error: { code: "TOTP_LOCKED", message: "Too many failed 2FA attempts. Try again in 15 minutes." } });
      }
      if (!user.twoFactorSecret || !authenticator.check(input.totp, user.twoFactorSecret)) {
        recordTotpFailure(user.id);
        return reply.status(401).send({ ok: false, error: { code: "TOTP_REQUIRED", message: "Valid 2FA code required" } });
      }
      clearTotpFailures(user.id);
    }

    const token = await signSession({ userId: user.id, role: user.role }, env.SESSION_SECRET);
    setSessionCookie(reply, token);
    return { ok: true, data: { user: sanitizeUser(user) } };
  });

  app.post("/auth/redeem", { ...authRateLimit, preHandler: requireBrowserRequest }, async (request, reply) => {
    const input = redeemSchema.parse(request.body);
    if (!(await verifyTurnstile(input.turnstileToken, request.ip))) {
      return reply.status(403).send({ ok: false, error: { code: "CAPTCHA_REQUIRED", message: "Captcha verification failed" } });
    }

    const resolution = await resolveLicenseForClaim(input.licenseKey);
    if (resolution === "claimed") {
      return reply.status(409).send({ ok: false, error: { code: "LICENSE_CLAIMED", message: "This license already belongs to an account. Sign in with the purchase account." } });
    }
    if (resolution === "invalid") {
      return reply.status(400).send({ ok: false, error: { code: "BAD_LICENSE", message: "License key is invalid, expired, or inactive" } });
    }

    let user;
    try {
      user = await createUserWithLicense(input, resolution);
    } catch (error) {
      if (isAccountConflict(error)) {
        return reply.status(409).send({ ok: false, error: { code: "ACCOUNT_EXISTS", message: "An account with that email or username already exists." } });
      }
      if (isLicenseClaimConflict(error)) {
        return reply.status(409).send({ ok: false, error: { code: "LICENSE_CLAIMED", message: "This license already belongs to an account. Sign in with the purchase account." } });
      }
      throw error;
    }

    const token = await signSession({ userId: user.id, role: user.role }, env.SESSION_SECRET);
    setSessionCookie(reply, token);
    return reply.status(201).send({ ok: true, data: { user: sanitizeUser(user) } });
  });

  app.post("/auth/verify-key", { ...authRateLimit, preHandler: requireBrowserRequest }, async (request, reply) => {
    const input = parseBody(verifyKeySchema, request.body, reply);
    if (!input) return;

    const resolution = await resolveLicenseForClaim(input.licenseKey);
    if (resolution === "claimed") {
      return reply.status(409).send({ ok: false, error: { code: "LICENSE_CLAIMED", message: "This license already belongs to an account. Sign in with the purchase account." } });
    }
    if (resolution === "invalid") {
      return reply.status(403).send({ ok: false, error: { code: "BAD_LICENSE", message: "License key is invalid, expired, or inactive" } });
    }

    return { ok: true, data: { valid: true, keyPreview: resolution.keyPreview, plan: resolution.plan } };
  });

  app.post("/auth/logout", { preHandler: requireBrowserRequest }, async (_request, reply) => {
    clearSessionCookie(reply);
    return { ok: true, data: { loggedOut: true } };
  });

  app.get("/auth/discord/start", async (_request, reply) => {
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_REDIRECT_URI) {
      return reply.status(503).send("Discord login is not configured");
    }

    const state = randomBytes(32).toString("base64url");
    setDiscordOAuthStateCookie(reply, state);
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: env.DISCORD_REDIRECT_URI,
      response_type: "code",
      scope: "identify email",
      state
    });

    return reply.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
  });

  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>("/auth/discord/callback", async (request, reply) => {
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.DISCORD_REDIRECT_URI) {
      return reply.status(503).send("Discord login is not configured");
    }

    const expectedState = getCookie(request, "nznt_discord_oauth_state");
    const receivedState = request.query.state;
    const stateMatches = Boolean(expectedState && receivedState && expectedState.length === receivedState.length && timingSafeEqual(Buffer.from(expectedState), Buffer.from(receivedState)));
    if (!stateMatches) {
      clearDiscordOAuthStateCookie(reply);
      return reply.redirect(`${env.PUBLIC_WEB_URL}?discord=state_failed`);
    }

    if (!request.query.code) {
      clearDiscordOAuthStateCookie(reply);
      return reply.redirect(`${env.PUBLIC_WEB_URL}?discord=missing_code`);
    }

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: request.query.code,
        redirect_uri: env.DISCORD_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      clearDiscordOAuthStateCookie(reply);
      return reply.redirect(`${env.PUBLIC_WEB_URL}?discord=token_failed`);
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    if (!tokenData.access_token) {
      clearDiscordOAuthStateCookie(reply);
      return reply.redirect(`${env.PUBLIC_WEB_URL}?discord=no_token`);
    }

    const discordResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!discordResponse.ok) {
      clearDiscordOAuthStateCookie(reply);
      return reply.redirect(`${env.PUBLIC_WEB_URL}?discord=user_failed`);
    }

    const discord = await discordResponse.json() as {
      id: string;
      username?: string;
      global_name?: string | null;
      email?: string | null;
      verified?: boolean;
    };

    const email = discord.email?.toLowerCase() ?? null;
    const byDiscord = await db.user.findUnique({ where: { discordId: discord.id } });

    let existing: User | null = byDiscord;
    if (!existing && email) {
      const byEmail = await db.user.findUnique({ where: { email } });
      if (byEmail) {
        if (discord.verified !== true) {
          clearDiscordOAuthStateCookie(reply);
          return reply.status(403).send({ ok: false, error: { code: "EMAIL_NOT_VERIFIED", message: "Your Discord email must be verified before signing in" } });
        }
        if (byEmail.discordId && byEmail.discordId !== discord.id) {
          clearDiscordOAuthStateCookie(reply);
          return reply.status(409).send({ ok: false, error: { code: "ACCOUNT_LINK_CONFLICT", message: "This email belongs to an account linked to a different Discord user" } });
        }
        existing = byEmail;
      }
    }

    const user = existing
      ? await db.user.update({
          where: { id: existing.id },
          data: {
            discordId: discord.id,
            email: existing.email ?? email,
            displayName: discord.global_name ?? discord.username ?? existing.displayName,
            username: existing.username ?? discord.username ?? `discord_${discord.id}`
          }
        })
      : await db.user.create({
          data: {
            discordId: discord.id,
            email,
            displayName: discord.global_name ?? discord.username ?? null,
            username: discord.username ?? `discord_${discord.id}`
          }
        });

    const token = await signSession({ userId: user.id, role: user.role }, env.SESSION_SECRET);
    clearDiscordOAuthStateCookie(reply);
    setSessionCookie(reply, token);
    return reply.redirect(`${env.PUBLIC_WEB_URL}/dashboard?discord=ok`);
  });

  app.get("/auth/me", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    return { ok: true, data: { user: sanitizeUser(user) } };
  });

  app.post("/auth/admin/2fa/setup", { preHandler: requireBrowserRequest }, async (request, reply) => {
    const user = await requireAdminUser(request, reply);
    if (!user) return;

    const secret = authenticator.generateSecret();
    await db.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret, twoFactorEnabled: false }
    });

    const label = encodeURIComponent(`nznt:${user.email ?? user.username ?? user.id}`);
    const issuer = encodeURIComponent("nznt");
    return {
      ok: true,
      data: {
        secret,
        otpauthUrl: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`
      }
    };
  });

  app.post<{ Body: { code?: string } }>("/auth/admin/2fa/enable", { preHandler: requireBrowserRequest }, async (request, reply) => {
    const user = await requireAdminUser(request, reply);
    if (!user) return;
    if (!user.twoFactorSecret || !request.body?.code || !authenticator.check(request.body.code, user.twoFactorSecret)) {
      return reply.status(400).send({ ok: false, error: { code: "BAD_TOTP", message: "Invalid 2FA code" } });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    });

    return { ok: true, data: { user: sanitizeUser(updated) } };
  });
}

function sanitizeUser(user: {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  discordId: string | null;
  robloxUsername: string | null;
  role: UserRole;
  twoFactorEnabled: boolean;
}) {
  const legacy = user.username?.startsWith("legacy_");
  return {
    id: user.id,
    email: user.email,
    username: legacy ? null : user.username,
    displayName: user.displayName ?? (legacy ? "Discord user" : null),
    discordId: user.discordId,
    robloxUsername: user.robloxUsername,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled
  };
}
