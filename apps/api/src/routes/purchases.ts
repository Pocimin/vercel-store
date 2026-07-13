import type { FastifyInstance } from "fastify";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { z } from "zod";
import { LicenseSource, PaymentStatus, SessionStatus, db } from "@nznt/db";
import { decryptSecret, encryptSecret, hashSecret, previewSecret } from "@nznt/auth";
import { env } from "../env.js";
import { notifyDiscord } from "../lib/discord.js";
import { sendEmail } from "../lib/email.js";
import { requireAdminUser, requireUser } from "../lib/session.js";
import { requireBrowserRequest } from "../lib/csrf.js";
import { createVonaliaUser, findVonaliaUser, vonaliaStatus } from "../lib/vonalia.js";

const purchaseSchema = z.object({
  plan: z.string().trim().min(1).max(64),
  method: z.string().trim().min(1).max(32),
  amount: z.coerce.number().int().positive(),
  currency: z.string().min(3).max(8).default("IDR"),
  proofFileName: z.string().min(1).max(160).optional(),
  proofBase64: z.string().min(1).max(4_000_000).optional()
});

function decodeProof(value: string) {
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  const encoded = match?.[2];
  if (!encoded || encoded.length % 4 === 1) throw new Error("Proof must be a PNG, JPEG, or WebP image");
  const content = Buffer.from(encoded, "base64");
  if (content.length > 3 * 1024 * 1024) throw new Error("Proof image is too large");
  const isPng = content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = content.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  const isWebp = content.subarray(0, 4).toString("ascii") === "RIFF" && content.subarray(8, 12).toString("ascii") === "WEBP";
  if (!(isPng || isJpeg || isWebp)) throw new Error("Proof content is not a supported image");
  return content;
}

function publicDashboardUser(user: Awaited<ReturnType<typeof requireUser>>) {
  if (!user) return null;
  const legacy = user.username?.startsWith("legacy_");
  return {
    id: user.id,
    email: user.email,
    username: legacy ? null : user.username,
    displayName: user.displayName ?? (legacy ? "Discord user" : null),
    robloxUsername: user.robloxUsername,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled
  };
}

function monitoringCode(ciphertext: string | null) {
  if (!ciphertext) return null;
  try {
    return decryptSecret(ciphertext, env.SCRIPT_SIGNING_SECRET);
  } catch {
    return null;
  }
}

function licenseSecret(ciphertext: string | null) {
  if (!ciphertext) return null;
  try {
    return decryptSecret(ciphertext, env.SCRIPT_SIGNING_SECRET);
  } catch {
    return null;
  }
}

export async function registerPurchaseRoutes(app: FastifyInstance) {
  app.post("/purchase", { preHandler: requireBrowserRequest }, async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const input = purchaseSchema.parse(request.body);
    let proofUrl: string | null = null;
    if (input.proofBase64) {
      const uploadDir = join("storage/uploads", user.id);
      await mkdir(uploadDir, { recursive: true });
      const safeName = `${Date.now()}-${randomBytes(12).toString("hex")}.img`;
      const filePath = join(uploadDir, safeName);
      let content: Buffer;
      try {
        content = decodeProof(input.proofBase64);
      } catch (error) {
        return reply.status(400).send({ ok: false, error: { code: "INVALID_PROOF", message: error instanceof Error ? error.message : "Invalid proof" } });
      }
      await writeFile(filePath, content);
      proofUrl = filePath;
    }

    const payment = await db.payment.create({
      data: {
        userId: user.id,
        plan: input.plan,
        method: input.method,
        amount: input.amount,
        currency: input.currency,
        proofUrl,
        status: PaymentStatus.PENDING
      }
    });

    await notifyDiscord(`New pending payment: ${input.plan} ${input.amount} ${input.currency} from ${user.email ?? user.username ?? user.id}`);

    return reply.status(201).send({ ok: true, data: { payment } });
  });

  app.get("/user/dashboard", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;

    const activeSince = new Date(Date.now() - 60_000);
    const [licenses, payments, sessions, devices] = await Promise.all([
      db.license.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
      db.scriptSession.findMany({
        where: { userId: user.id, status: SessionStatus.ACTIVE, lastSeenAt: { gte: activeSince } },
        orderBy: { lastSeenAt: "desc" },
        take: 20,
        include: {
          script: true,
          device: true,
          events: {
            where: { type: "heartbeat" },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }),
      db.device.findMany({ where: { userId: user.id }, orderBy: { lastSeenAt: "desc" }, take: 20 })
    ]);

    return {
      ok: true,
      data: {
        user: publicDashboardUser(user),
        licenses: licenses.map((license) => ({
          id: license.id,
          key: licenseSecret(license.keyCiphertext),
          keyPreview: license.keyPreview,
          plan: license.plan,
          status: license.status,
          expiresAt: license.expiresAt,
          createdAt: license.createdAt
        })),
        payments,
        sessions: sessions.map((session) => {
          const event = session.events[0];
          const payload = event?.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
            ? event.payload as Record<string, unknown>
            : null;
          return {
            id: session.id,
            status: session.status,
            game: session.game,
            executor: session.executor,
            scriptVersion: session.scriptVersion,
            startedAt: session.startedAt,
            lastSeenAt: session.lastSeenAt,
            scriptFile: session.script?.fileName ?? null,
            robloxUserId: session.device?.robloxUserId ?? null,
            robloxUsername: session.device?.robloxUsername ?? null,
            hwidHash: session.hwidHash,
            stats: payload?.stats ?? null,
            currentTask: payload?.currentTask ?? null,
            earnings: payload?.earnings ?? null,
            statsAt: event?.createdAt ?? null
          };
        }),
        devices: devices.map((device) => ({
          id: device.id,
          robloxUserId: device.robloxUserId,
          robloxUsername: device.robloxUsername,
          executor: device.executor,
          firstSeenAt: device.firstSeenAt,
          lastSeenAt: device.lastSeenAt,
          trustScore: device.trustScore
        })),
        monitoring: {
          configured: Boolean(user.monitoringCodeHash),
          preview: user.monitoringCodePreview,
          code: monitoringCode(user.monitoringCodeCiphertext)
        }
      }
    };
  });

  app.post("/user/monitoring-code", { preHandler: requireBrowserRequest }, async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.monitoringCodeCiphertext) {
      const code = monitoringCode(user.monitoringCodeCiphertext);
      if (code) return { ok: true, data: { code, preview: user.monitoringCodePreview } };
    }
    const code = `mon_${randomBytes(24).toString("base64url")}`;
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        monitoringCodeHash: hashSecret(code, env.SCRIPT_SIGNING_SECRET),
        monitoringCodePreview: previewSecret(code),
        monitoringCodeCiphertext: encryptSecret(code, env.SCRIPT_SIGNING_SECRET)
      }
    });
    await db.auditLog.create({
      data: { actorType: "user", actorId: user.id, action: "monitoring.code.create", targetType: "user", targetId: user.id }
    });
    return { ok: true, data: { code, preview: updated.monitoringCodePreview } };
  });

  app.post("/user/license/verify", { preHandler: requireBrowserRequest }, async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const license = await db.license.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (!license) return reply.status(404).send({ ok: false, error: { code: "NO_LICENSE", message: "No license found" } });
    const identifier = licenseSecret(license.providerUserCiphertext) ?? licenseSecret(license.keyCiphertext);
    if (!identifier) return reply.status(409).send({ ok: false, error: { code: "LEGACY_KEY_NOT_MIGRATED", message: "This legacy key still needs secure migration" } });
    try {
      const remote = await findVonaliaUser(identifier, license.plan);
      const status = vonaliaStatus(remote);
      await db.license.update({ where: { id: license.id }, data: { status } });
      return { ok: true, data: { status } };
    } catch (error) {
      return reply.status(502).send({ ok: false, error: { code: "VONALIA_ERROR", message: error instanceof Error ? error.message : "Vonalia validation failed" } });
    }
  });

  app.get("/admin/payments", async (request, reply) => {
    const admin = await requireAdminUser(request, reply);
    if (!admin) return;
    const payments = await db.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: true, license: true }
    });
    return { ok: true, data: { payments } };
  });

  app.post<{ Params: { id: string } }>("/admin/payments/:id/approve", { preHandler: requireBrowserRequest }, async (request, reply) => {
    const admin = await requireAdminUser(request, reply);
    if (!admin) return;

    const payment = await db.payment.findUnique({
      where: { id: request.params.id },
      include: { user: true }
    });

    if (!payment || payment.status !== PaymentStatus.PENDING) {
      return reply.status(404).send({ ok: false, error: { code: "PAYMENT_NOT_PENDING", message: "Pending payment not found" } });
    }

    const durationDays = payment.plan.toLowerCase() === "weekly" ? 7 : payment.plan.toLowerCase() === "lifetime" ? 36500 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    let plainKey: string;
    let providerUserId: string;
    try {
      const created = await createVonaliaUser(payment.plan, expiresAt, payment.user?.email ?? payment.user?.username ?? payment.userId ?? payment.id);
      plainKey = created.key;
      providerUserId = created.userId;
    } catch (error) {
      return reply.status(502).send({ ok: false, error: { code: "VONALIA_CREATE_FAILED", message: error instanceof Error ? error.message : "Vonalia license creation failed" } });
    }
    const keyHash = hashSecret(plainKey.trim().toUpperCase(), env.SCRIPT_SIGNING_SECRET);

    const result = await db.$transaction(async (tx) => {
      const license = await tx.license.create({
        data: {
          userId: payment.userId,
          keyHash,
          keyPreview: previewSecret(plainKey),
          keyCiphertext: encryptSecret(plainKey, env.SCRIPT_SIGNING_SECRET),
          providerUserCiphertext: encryptSecret(providerUserId, env.SCRIPT_SIGNING_SECRET),
          plan: payment.plan,
          source: LicenseSource.WEBSITE,
          maxDevices: 1,
          expiresAt,
          createdById: admin.id
        }
      });

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.APPROVED,
          licenseId: license.id,
          processedById: admin.id,
          processedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          actorType: "admin",
          actorId: admin.id,
          action: "payment.approve",
          targetType: "payment",
          targetId: payment.id,
          payload: { licenseId: license.id }
        }
      });

      return { license, payment: updatedPayment };
    });

    await sendEmail(
      payment.user?.email,
      "Your nznt license is ready",
      `Thanks for your purchase.\n\nPlan: ${payment.plan}\nLicense key: ${plainKey}\nExpires: ${expiresAt.toISOString()}\n\nPut this key in getgenv().NZNT_LICENSE_KEY or nznt_license_key.txt.`
    );
    await notifyDiscord(`Payment approved for ${payment.user?.email ?? payment.user?.username ?? payment.userId}. License ${result.license.keyPreview}`);

    return { ok: true, data: { ...result, plainKey } };
  });

  app.post<{ Params: { id: string } }>("/admin/payments/:id/reject", { preHandler: requireBrowserRequest }, async (request, reply) => {
    const admin = await requireAdminUser(request, reply);
    if (!admin) return;
    const payment = await db.payment.update({
      where: { id: request.params.id },
      data: {
        status: PaymentStatus.REJECTED,
        processedById: admin.id,
        processedAt: new Date()
      }
    });
    return { ok: true, data: { payment } };
  });
}
