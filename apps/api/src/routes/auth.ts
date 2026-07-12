import type { FastifyInstance } from "fastify";
import { authenticator } from "otplib";
import { z } from "zod";
import { LicenseStatus, UserRole, db } from "@nznt/db";
import { hashPassword, hashSecret, signSession, verifyPassword } from "@nznt/auth";
import { env } from "../env.js";
import { clearSessionCookie, requireAdminUser, requireUser, setSessionCookie } from "../lib/session.js";
import { verifyTurnstile } from "../lib/turnstile.js";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(8),
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
  robloxUsername: z.string().min(1).max(64).optional()
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);
    if (!(await verifyTurnstile(input.turnstileToken, request.ip))) {
      return reply.status(400).send({ ok: false, error: { code: "CAPTCHA_FAILED", message: "Captcha verification failed" } });
    }
    const passwordHash = await hashPassword(input.password);

    const user = await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username,
        displayName: input.username,
        passwordHash,
        robloxUsername: input.robloxUsername ?? null
      }
    });

    const token = await signSession({ userId: user.id, role: user.role }, env.SESSION_SECRET);
    setSessionCookie(reply, token);
    return reply.status(201).send({ ok: true, data: { user: sanitizeUser(user) } });
  });

  app.post("/auth/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);
    if (!(await verifyTurnstile(input.turnstileToken, request.ip))) {
      return reply.status(400).send({ ok: false, error: { code: "CAPTCHA_FAILED", message: "Captcha verification failed" } });
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

    if (!user || !user.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
      return reply.status(401).send({ ok: false, error: { code: "BAD_LOGIN", message: "Invalid login" } });
    }

    if (user.twoFactorEnabled) {
      if (!input.totp || !user.twoFactorSecret || !authenticator.check(input.totp, user.twoFactorSecret)) {
        return reply.status(401).send({ ok: false, error: { code: "TOTP_REQUIRED", message: "Valid 2FA code required" } });
      }
    }

    const token = await signSession({ userId: user.id, role: user.role }, env.SESSION_SECRET);
    setSessionCookie(reply, token);
    return { ok: true, data: { user: sanitizeUser(user) } };
  });

  app.post("/auth/redeem", async (request, reply) => {
    const input = redeemSchema.parse(request.body);
    const keyHash = hashSecret(input.licenseKey.trim().toUpperCase(), env.SCRIPT_SIGNING_SECRET);
    const license = await db.license.findUnique({ where: { keyHash } });

    if (!license || license.status !== LicenseStatus.ACTIVE || (license.expiresAt && license.expiresAt <= new Date())) {
      return reply.status(400).send({ ok: false, error: { code: "BAD_LICENSE", message: "License key is invalid, expired, or inactive" } });
    }
    if (license.userId) {
      return reply.status(409).send({ ok: false, error: { code: "LICENSE_CLAIMED", message: "This license already belongs to an account. Sign in with the purchase account." } });
    }

    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          username: input.username,
          displayName: input.username,
          passwordHash: await hashPassword(input.password),
          robloxUsername: input.robloxUsername ?? null
        }
      });
      await tx.license.update({ where: { id: license.id }, data: { userId: created.id } });
      return created;
    });

    const token = await signSession({ userId: user.id, role: user.role }, env.SESSION_SECRET);
    setSessionCookie(reply, token);
    return reply.status(201).send({ ok: true, data: { user: sanitizeUser(user) } });
  });

  app.post("/auth/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    return { ok: true, data: { loggedOut: true } };
  });

  app.get("/auth/discord/start", async (_request, reply) => {
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_REDIRECT_URI) {
      return reply.status(503).send("Discord login is not configured");
    }

    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: env.DISCORD_REDIRECT_URI,
      response_type: "code",
      scope: "identify email"
    });

    return reply.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
  });

  app.get<{ Querystring: { code?: string } }>("/auth/discord/callback", async (request, reply) => {
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.DISCORD_REDIRECT_URI) {
      return reply.status(503).send("Discord login is not configured");
    }

    if (!request.query.code) {
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
      return reply.redirect(`${env.PUBLIC_WEB_URL}?discord=token_failed`);
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    if (!tokenData.access_token) {
      return reply.redirect(`${env.PUBLIC_WEB_URL}?discord=no_token`);
    }

    const discordResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!discordResponse.ok) {
      return reply.redirect(`${env.PUBLIC_WEB_URL}?discord=user_failed`);
    }

    const discord = await discordResponse.json() as {
      id: string;
      username?: string;
      global_name?: string | null;
      email?: string | null;
    };

    const email = discord.email?.toLowerCase() ?? null;
    const byDiscord = await db.user.findUnique({ where: { discordId: discord.id } });
    const byEmail = !byDiscord && email ? await db.user.findUnique({ where: { email } }) : null;
    const existing = byDiscord ?? (byEmail?.discordId ? null : byEmail);

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
    setSessionCookie(reply, token);
    return reply.redirect(`${env.PUBLIC_WEB_URL}/dashboard?discord=ok`);
  });

  app.get("/auth/me", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    return { ok: true, data: { user: sanitizeUser(user) } };
  });

  app.post("/auth/admin/2fa/setup", async (request, reply) => {
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

  app.post<{ Body: { code?: string } }>("/auth/admin/2fa/enable", async (request, reply) => {
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
