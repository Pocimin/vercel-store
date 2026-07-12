import type { FastifyInstance } from "fastify";
import { AccountStatus, LicenseStatus, SessionStatus, db } from "@nznt/db";
import { hashSecret, previewSecret } from "@nznt/auth";
import {
  scriptEventSchema,
  scriptHandshakeSchema,
  scriptHeartbeatSchema,
  monitoringHandshakeSchema
} from "@nznt/script-protocol";
import { env } from "../env.js";

export async function registerScriptRoutes(app: FastifyInstance) {
  const staleSessionTimer = setInterval(() => {
    void db.scriptSession.updateMany({
      where: { status: SessionStatus.ACTIVE, lastSeenAt: { lt: new Date(Date.now() - 60_000) } },
      data: { status: SessionStatus.STOPPED, stoppedAt: new Date() }
    });
  }, 30_000);
  staleSessionTimer.unref();
  app.addHook("onClose", async () => clearInterval(staleSessionTimer));

  app.post("/monitoring/handshake", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } }
  }, async (request, reply) => {
    const input = monitoringHandshakeSchema.parse(request.body);
    const user = await db.user.findUnique({
      where: { monitoringCodeHash: hashSecret(input.monitoringCode, env.SCRIPT_SIGNING_SECRET) }
    });
    if (!user || user.status !== AccountStatus.ACTIVE) {
      return reply.status(403).send({ ok: false, error: { code: "MONITORING_DENIED", message: "Monitoring code is invalid" } });
    }

    const hwidHash = hashSecret(input.hwid, env.SCRIPT_SIGNING_SECRET);
    const ipHash = request.ip ? hashSecret(request.ip, env.SCRIPT_SIGNING_SECRET) : null;
    const script = await db.script.upsert({
      where: { fileName: input.scriptFile },
      update: {},
      create: { fileName: input.scriptFile, game: input.game ?? "unknown", type: "roblox" }
    });
    const existingDevice = await db.device.findFirst({ where: { userId: user.id, hwidHash } });
    const device = existingDevice
      ? await db.device.update({
          where: { id: existingDevice.id },
          data: { ipHash, executor: input.executor ?? null, robloxUserId: input.robloxUserId ?? null, robloxUsername: input.robloxUsername ?? null, lastSeenAt: new Date() }
        })
      : await db.device.create({
          data: { userId: user.id, hwidHash, ipHash, executor: input.executor ?? null, robloxUserId: input.robloxUserId ?? null, robloxUsername: input.robloxUsername ?? null }
        });
    const session = await db.scriptSession.create({
      data: { userId: user.id, deviceId: device.id, scriptId: script.id, game: input.game ?? null, executor: input.executor ?? null, scriptVersion: input.scriptVersion ?? null, ipHash, hwidHash }
    });
    return reply.send({ ok: true, data: { allowed: true, sessionId: session.id, heartbeatIntervalSeconds: 30, config: {} } });
  });

  app.post("/script/handshake", {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute"
      }
    }
  }, async (request, reply) => {
    const input = scriptHandshakeSchema.parse(request.body);
    const keyHash = hashSecret(input.key, env.SCRIPT_SIGNING_SECRET);
    const hwidHash = hashSecret(input.hwid, env.SCRIPT_SIGNING_SECRET);
    const ipHash = request.ip ? hashSecret(request.ip, env.SCRIPT_SIGNING_SECRET) : null;

    const license = await db.license.findUnique({
      where: { keyHash },
      include: { user: true }
    });

    if (!license || license.status !== LicenseStatus.ACTIVE) {
      return reply.status(403).send({
        ok: false,
        error: {
          code: "LICENSE_DENIED",
          message: "License is invalid or inactive"
        }
      });
    }

    if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
      await db.license.update({
        where: { id: license.id },
        data: { status: LicenseStatus.EXPIRED }
      });

      return reply.status(403).send({
        ok: false,
        error: {
          code: "LICENSE_EXPIRED",
          message: "License is expired"
        }
      });
    }

    const existingDevices = await db.device.count({
      where: {
        licenseId: license.id,
        NOT: { hwidHash }
      }
    });

    if (existingDevices >= license.maxDevices) {
      return reply.status(403).send({
        ok: false,
        error: {
          code: "DEVICE_LIMIT",
          message: "Device limit reached"
        }
      });
    }

    const script = await db.script.upsert({
      where: { fileName: input.scriptFile },
      update: {},
      create: {
        fileName: input.scriptFile,
        game: input.game ?? "unknown",
        type: "roblox"
      }
    });

    const device = await db.device.upsert({
      where: {
        licenseId_hwidHash: {
          licenseId: license.id,
          hwidHash
        }
      },
      update: {
        ipHash,
        executor: input.executor ?? null,
        robloxUserId: input.robloxUserId ?? null,
        robloxUsername: input.robloxUsername ?? null,
        lastSeenAt: new Date()
      },
      create: {
        userId: license.userId,
        licenseId: license.id,
        hwidHash,
        ipHash,
        executor: input.executor ?? null,
        robloxUserId: input.robloxUserId ?? null,
        robloxUsername: input.robloxUsername ?? null
      }
    });

    const session = await db.scriptSession.create({
      data: {
        userId: license.userId,
        licenseId: license.id,
        deviceId: device.id,
        scriptId: script.id,
        game: input.game ?? null,
        executor: input.executor ?? null,
        scriptVersion: input.scriptVersion ?? null,
        ipHash,
        hwidHash
      }
    });

    await db.auditLog.create({
      data: {
        actorType: "script",
        actorId: license.userId,
        action: "script.handshake",
        targetType: "script_session",
        targetId: session.id,
        ipHash,
        payload: {
          scriptFile: input.scriptFile,
          key: previewSecret(input.key),
          executor: input.executor,
          robloxUsername: input.robloxUsername
        }
      }
    });

    return reply.send({
      ok: true,
      data: {
        allowed: true,
        sessionId: session.id,
        heartbeatIntervalSeconds: 30,
        config: {}
      }
    });
  });

  app.post("/script/heartbeat", async (request, reply) => {
    const input = scriptHeartbeatSchema.parse(request.body);

    const session = await db.$transaction(async (tx) => {
      const current = await tx.scriptSession.findUniqueOrThrow({ where: { id: input.sessionId } });
      const updated = await tx.scriptSession.update({
        where: { id: input.sessionId },
        data: {
          lastSeenAt: new Date(),
          ...(current.status === SessionStatus.STOPPED ? { status: SessionStatus.ACTIVE, stoppedAt: null } : {})
        }
      });
      await tx.scriptEvent.create({
        data: {
          sessionId: updated.id,
          type: "heartbeat",
          payload: JSON.parse(JSON.stringify({
            stats: input.stats ?? {},
            currentTask: input.currentTask ?? null,
            earnings: input.earnings ?? null
          }))
        }
      });
      return updated;
    });

    const commands = session.status === SessionStatus.KICK_REQUESTED
      ? [{ type: "kick", reason: session.kickReason ?? "Access suspended" }]
      : [];

    return reply.send({
      ok: true,
      data: { commands }
    });
  });

  app.post("/script/event", async (request, reply) => {
    const input = scriptEventSchema.parse(request.body);
    await db.scriptEvent.create({
      data: {
        sessionId: input.sessionId,
        type: input.type,
        payload: input.payload ? JSON.parse(JSON.stringify(input.payload)) : undefined
      }
    });

    return reply.send({ ok: true, data: { recorded: true } });
  });
}

