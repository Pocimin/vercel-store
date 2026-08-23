import type { FastifyInstance } from "fastify";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { z } from "zod";
import { LicenseSource, PaymentStatus, Prisma, SessionStatus, db } from "@nznt/db";
import { decryptSecret, encryptSecret, hashSecret, previewSecret } from "@nznt/auth";
import { env } from "../env.js";
import { sendPaymentAnnounce, updatePaymentReview, type PaymentAnnounceInput } from "../lib/discord.js";
import { sendLicenseKeyEmail } from "../lib/email.js";
import { requireAdminUser, requireUser, getCurrentUser } from "../lib/session.js";
import { requireBrowserRequest } from "../lib/csrf.js";
import { createVonaliaUser, findVonaliaUser, vonaliaStatus } from "../lib/vonalia.js";
import { checkShopeeQris, createShopeeQris } from "../lib/autogopay.js";
import { verifyTurnstile } from "../lib/turnstile.js";

const purchaseSchema = z.object({
  plan: z.string().trim().min(1).max(64),
  method: z.string().trim().min(1).max(32),
  turnstileToken: z.string().optional(),
  email: z.string().email().optional(),
  proofFileName: z.string().min(1).max(160).optional(),
  proofBase64: z.string().min(1).optional()
});

const PLAN_PRICES = {
  weekly: { amount: 10_000, currency: "IDR" },
  monthly: { amount: 30_000, currency: "IDR" },
  joki: { amount: 100_000, currency: "IDR" }
} as const;

type PlanId = keyof typeof PLAN_PRICES;

const PROOF_MAX_BYTES = 3 * 1024 * 1024;
const QRIS_POLL_WINDOW_MS = 15 * 60 * 1000;

function resolvePlan(rawPlan: string): PlanId | null {
  const plan = rawPlan.toLowerCase();
  if (/joki|penjoki/.test(plan)) return "joki";
  if (/monthly|bulanan/.test(plan)) return "monthly";
  if (/weekly|mingguan/.test(plan)) return "weekly";
  return null;
}

function decodeProofImage(base64: string): Buffer | null {
  const raw = base64.replace(/^data:[^;,]+(?:;charset=[^;,]*)?;base64,/, "").trim();
  if (!raw || raw.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return null;
  return Buffer.from(raw, "base64");
}

function isSupportedProofImage(content: Buffer): boolean {
  if (content.length >= 8 && content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
  if (content.length >= 3 && content.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return true;
  if (
    content.length >= 12 &&
    content.subarray(0, 4).toString("latin1") === "RIFF" &&
    content.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return true;
  }
  return false;
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

function planDurationDays(plan: string) {
  return plan.toLowerCase() === "weekly"
    ? 7
    : plan.toLowerCase() === "lifetime"
      ? 36500
      : 30;
}

type PaymentForAnnounce = {
  id: string;
  plan: string;
  method: string;
  amount: number;
  currency: string;
  createdAt: Date;
  proofUrl: string | null;
  discordMessageId: string | null;
  processedAt: Date | null;
  buyerEmail?: string | null;
  user?: { email?: string | null; username?: string | null; displayName?: string | null } | null;
};

function announceFromPayment(payment: PaymentForAnnounce): PaymentAnnounceInput {
  return {
    id: payment.id,
    plan: payment.plan,
    method: payment.method,
    amount: payment.amount,
    currency: payment.currency,
    createdAt: payment.createdAt,
    proofUrl: payment.proofUrl,
    discordMessageId: payment.discordMessageId,
    processedAt: payment.processedAt,
    user: payment.user
      ? { email: payment.user.email ?? payment.buyerEmail ?? null, username: payment.user.username ?? null, displayName: payment.user.displayName ?? null }
      : payment.buyerEmail
        ? { email: payment.buyerEmail, username: null, displayName: null }
        : null
  };
}

type IssueLicenseOptions = {
  createdById: string | null;
  actorId: string | null;
  actorType: string;
  action: string;
};

async function issueLicenseForPayment(
  tx: Prisma.TransactionClient,
  payment: Prisma.PaymentGetPayload<{ include: { user: true } }>,
  options: IssueLicenseOptions
) {
  const expiresAt = new Date(Date.now() + planDurationDays(payment.plan) * 24 * 60 * 60 * 1000);
  let plainKey: string;
  let providerUserId: string;
  try {
    const created = await createVonaliaUser(payment.plan, expiresAt, payment.user?.email ?? payment.user?.username ?? payment.userId ?? payment.id);
    plainKey = created.key;
    providerUserId = created.userId;
  } catch (error) {
    throw new Error(`Vonalia license creation failed: ${error instanceof Error ? error.message : "unknown error"}`);
  }
  const keyHash = hashSecret(plainKey.trim().toUpperCase(), env.SCRIPT_SIGNING_SECRET);

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
      createdById: options.createdById
    }
  });

  const updatedPayment = await tx.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PAID,
      licenseId: license.id,
      processedAt: new Date(),
      ...(options.createdById ? { processedById: options.createdById } : {})
    }
  });

  await tx.auditLog.create({
    data: {
      actorType: options.actorType,
      actorId: options.actorId,
      action: options.action,
      targetType: "payment",
      targetId: payment.id,
      payload: { licenseId: license.id }
    }
  });

  return { license, payment: updatedPayment, plainKey, expiresAt };
}

export async function resolveQrisPayment(paymentId: string, providerPaidAt?: string | null) {
  const outcome = await db.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: { in: [PaymentStatus.PENDING, PaymentStatus.EXPIRED] } },
      data: {
        status: PaymentStatus.PAID,
        autoPaidAt: new Date(),
        ...(providerPaidAt ? { providerPaidAt } : {})
      }
    });
    if (claimed.count === 0) return null;
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { user: true } });
    if (!payment) return null;
    const issued = await issueLicenseForPayment(tx, payment, {
      createdById: null,
      actorId: null,
      actorType: "system",
      action: "payment.auto_verified"
    });
    return { ...issued, payment };
  });
  if (!outcome) return null;

  await sendLicenseKeyEmail(outcome.payment.buyerEmail ?? outcome.payment.user?.email, outcome.plainKey, outcome.payment.plan, outcome.expiresAt);
  await sendPaymentAnnounce({
    ...announceFromPayment(outcome.payment),
    auto: true,
    keyPreview: outcome.license.keyPreview,
    processedAt: outcome.payment.processedAt
  });
  return outcome;
}

export async function registerPurchaseRoutes(app: FastifyInstance) {
  app.post("/purchase", { preHandler: requireBrowserRequest }, async (request, reply) => {
    const user = await getCurrentUser(request);
    const input = purchaseSchema.parse(request.body);
    const guestEmail = input.email?.trim().toLowerCase() ?? null;

    if (!user && !guestEmail) {
      return reply.status(401).send({ ok: false, error: { code: "UNAUTHORIZED", message: "Sign in or provide an email for guest checkout" } });
    }

    if (!(await verifyTurnstile(input.turnstileToken, request.ip))) {
      return reply.status(400).send({ ok: false, error: { code: "CAPTCHA_FAILED", message: "Captcha verification failed" } });
    }

    const plan = resolvePlan(input.plan);
    if (!plan) {
      return reply.status(400).send({ ok: false, error: { code: "INVALID_PLAN", message: "Unknown plan" } });
    }
    const price = PLAN_PRICES[plan];
    const isQris = input.method.toLowerCase() === "qris";

    if (user) {
      const pendingPayment = await db.payment.findFirst({
        where: { userId: user.id, status: PaymentStatus.PENDING },
        orderBy: { createdAt: "desc" },
        select: { id: true, method: true }
      });
      if (pendingPayment) {
        return reply.status(409).send({
          ok: false,
          error: { code: "PAYMENT_ALREADY_SUBMITTED", message: "You already have a payment awaiting processing" },
          data: { paymentId: pendingPayment.id, mode: pendingPayment.method === "qris" ? "qris" : "manual" }
        });
      }
    }

    if (isQris) {
      const payment = await db.payment.create({
        data: {
          userId: user?.id ?? null,
          buyerEmail: guestEmail,
          plan,
          method: "qris",
          provider: "shopeepay",
          amount: price.amount,
          currency: price.currency,
          status: PaymentStatus.PENDING
        }
      });

      let created;
      try {
        created = await createShopeeQris(price.amount);
      } catch (error) {
        const message = error instanceof Error ? error.message : "QR creation failed";
        await db.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.EXPIRED } });
        console.warn(`[qris] create failed for payment ${payment.id}: ${message}`);
        return reply.status(502).send({ ok: false, error: { code: "QRIS_CREATE_FAILED", message } });
      }

      const parsedExpiry = created.expiryTime ? Date.parse(created.expiryTime) : NaN;
      const expiresAt = new Date(Number.isFinite(parsedExpiry) ? parsedExpiry : payment.createdAt.getTime() + QRIS_POLL_WINDOW_MS);
      await db.payment.update({
        where: { id: payment.id },
        data: {
          orderSn: created.orderSn,
          qrUrl: created.qrUrl ?? null,
          qrString: created.qrString
        }
      });

      return reply.status(201).send({
        ok: true,
        data: {
          paymentId: payment.id,
          qrUrl: created.qrUrl ?? null,
          orderSn: created.orderSn,
          amount: created.amount,
          expiresAt: expiresAt.toISOString(),
          mode: "qris"
        }
      });
    }

    if (!input.proofBase64) {
      return reply.status(400).send({ ok: false, error: { code: "INVALID_PROOF", message: "Payment proof is required" } });
    }
    const proofContent = decodeProofImage(input.proofBase64);
    if (!proofContent || !isSupportedProofImage(proofContent)) {
      return reply.status(400).send({ ok: false, error: { code: "INVALID_PROOF", message: "Proof must be a PNG, JPEG, or WebP image" } });
    }
    if (proofContent.byteLength > PROOF_MAX_BYTES) {
      return reply.status(413).send({ ok: false, error: { code: "PROOF_TOO_LARGE", message: "Proof image is too large" } });
    }

    const uploadDir = join("storage/uploads", user?.id ?? "guest");
    await mkdir(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${(input.proofFileName ?? "proof.png").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = join(uploadDir, safeName);
    await writeFile(filePath, proofContent);

    const payment = await db.payment.create({
      data: {
        userId: user?.id ?? null,
        buyerEmail: guestEmail,
        plan,
        method: input.method.toLowerCase() === "qris" ? "qris" : input.method.toLowerCase(),
        amount: price.amount,
        currency: price.currency,
        proofUrl: filePath,
        status: PaymentStatus.PENDING
      }
    });

    const message = await sendPaymentAnnounce(announceFromPayment({
      ...payment,
      user: user ? { email: user.email, username: user.username, displayName: user.displayName } : null
    }));
    if (message) {
      await db.payment.update({ where: { id: payment.id }, data: { discordMessageId: message.id } });
    }

    return reply.status(201).send({ ok: true, data: { paymentId: payment.id, mode: "manual" } });
  });

  app.get<{ Params: { id: string } }>("/payment/status/:id", async (request, reply) => {
    let payment = await db.payment.findUnique({ where: { id: request.params.id } });
    if (!payment) {
      return reply.status(404).send({ ok: false, error: { code: "PAYMENT_NOT_FOUND", message: "Payment not found" } });
    }

    if (payment.method === "qris" && payment.orderSn && (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.EXPIRED)) {
      const paidAt = Date.now();
      const localExpired = paidAt >= payment.createdAt.getTime() + QRIS_POLL_WINDOW_MS;
      if (localExpired && payment.status === PaymentStatus.PENDING) {
        try {
          await db.payment.updateMany({
            where: { id: payment.id, status: PaymentStatus.PENDING },
            data: { status: PaymentStatus.EXPIRED }
          });
          payment.status = PaymentStatus.EXPIRED;
        } catch (error) {
          console.warn(`[qris] failed to mark expired payment ${payment.id}`, error);
        }
      } else if (!localExpired && payment.status === PaymentStatus.PENDING) {
        try {
          const providerStatus = await checkShopeeQris(payment.orderSn);
          if (providerStatus.paid) {
            const resolved = await resolveQrisPayment(payment.id, providerStatus.paidAt);
            if (resolved) payment = resolved.payment;
          }
        } catch (error) {
          console.warn(`[qris] provider status check failed for ${payment.id}`, error);
        }
      }
      payment = await db.payment.findUnique({ where: { id: payment.id } }) ?? payment;
    }

    return {
      ok: true,
      data: {
        status: payment.status,
        qrUrl: payment.qrUrl,
        orderSn: payment.orderSn
      }
    };
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

    let result;
    try {
      result = await db.$transaction(async (tx) => issueLicenseForPayment(tx, payment, {
        createdById: admin.id,
        actorId: admin.id,
        actorType: "admin",
        action: "payment.approve"
      }));
    } catch (error) {
      return reply.status(502).send({ ok: false, error: { code: "VONALIA_CREATE_FAILED", message: error instanceof Error ? error.message : "Vonalia license creation failed" } });
    }

    await sendLicenseKeyEmail(payment.buyerEmail ?? payment.user?.email, result.plainKey, payment.plan, result.expiresAt);
    await updatePaymentReview(payment, "APPROVED", admin.displayName ?? admin.username ?? admin.email ?? "admin");

    return { ok: true, data: { license: result.license, payment: result.payment, plainKey: result.plainKey } };
  });

  app.post<{ Params: { id: string } }>("/admin/payments/:id/reject", { preHandler: requireBrowserRequest }, async (request, reply) => {
    const admin = await requireAdminUser(request, reply);
    if (!admin) return;
    const payment = await db.payment.findUnique({ where: { id: request.params.id } });
    if (!payment || payment.status !== PaymentStatus.PENDING) {
      return reply.status(404).send({ ok: false, error: { code: "PAYMENT_NOT_PENDING", message: "Pending payment not found" } });
    }
    const updatedPayment = await db.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.REJECTED,
          processedById: admin.id,
          processedAt: new Date()
        }
      });
      if (updated.count === 0) return null;
      await tx.auditLog.create({
        data: { actorType: "admin", actorId: admin.id, action: "payment.reject", targetType: "payment", targetId: payment.id }
      });
      return tx.payment.findUnique({ where: { id: payment.id } });
    });
    if (!updatedPayment) {
      return reply.status(404).send({ ok: false, error: { code: "PAYMENT_NOT_PENDING", message: "Pending payment not found" } });
    }
    await updatePaymentReview(payment, "REJECTED", admin.displayName ?? admin.username ?? admin.email ?? "admin");
    return { ok: true, data: { payment: updatedPayment } };
  });
}
