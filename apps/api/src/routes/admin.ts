import type { FastifyInstance, FastifyRequest } from "fastify";
import { ScriptBuildStatus, SessionStatus, UserRole, db } from "@nznt/db";
import { assertServiceToken } from "@nznt/auth";
import { env } from "../env.js";
import { getCurrentUser } from "../lib/session.js";
import { requireBrowserRequest } from "../lib/csrf.js";

function requireServiceToken(request: FastifyRequest) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  return assertServiceToken(token, env.INTERNAL_SERVICE_TOKEN);
}

const adminRoles: UserRole[] = [UserRole.SUPPORT, UserRole.ADMIN, UserRole.OWNER];

export async function registerAdminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    if (!request.url.startsWith("/admin")) return;
    if (requireServiceToken(request)) return;
    const user = await getCurrentUser(request);
    if (user && adminRoles.includes(user.role)) return;

    return reply.status(401).send({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Admin token required"
      }
    });
  });

  app.get("/admin/sessions", async () => {
    const activeSince = new Date(Date.now() - 60_000);
    const sessions = await db.scriptSession.findMany({
      where: { status: SessionStatus.ACTIVE, lastSeenAt: { gte: activeSince } },
      orderBy: { lastSeenAt: "desc" },
      take: 100,
      include: {
        script: { select: { fileName: true } },
        events: { where: { type: "heartbeat" }, orderBy: { createdAt: "desc" }, take: 1, select: { payload: true } }
      }
    });

    return {
      ok: true,
      data: sessions.map((session) => {
        const payload = session.events[0]?.payload;
        const stats = payload && typeof payload === "object" && !Array.isArray(payload)
          ? payload as Record<string, unknown>
          : null;
        return {
          id: session.id,
          status: session.status,
          userId: session.userId,
          scriptFile: session.script?.fileName ?? null,
          startedAt: session.startedAt,
          lastSeenAt: session.lastSeenAt,
          earnings: stats?.earnings ?? null
        };
      })
    };
  });

  app.get("/admin/monitoring", async () => {
    const activeSince = new Date(Date.now() - 60_000);
    const [activeSessions, recentEvents, scripts, queuedBuilds, sessions] = await Promise.all([
      db.scriptSession.count({ where: { status: SessionStatus.ACTIVE, lastSeenAt: { gte: activeSince } } }),
      db.scriptEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { session: { include: { script: true, user: true, device: true } } }
      }),
      db.script.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: { builds: { orderBy: { createdAt: "desc" }, take: 3 } }
      }),
      db.scriptBuild.count({ where: { status: ScriptBuildStatus.QUEUED } }),
      db.scriptSession.findMany({
        where: { status: SessionStatus.ACTIVE, lastSeenAt: { gte: activeSince } },
        orderBy: { lastSeenAt: "desc" },
        take: 100,
        include: {
          user: true,
          script: true,
          device: true,
          events: { where: { type: "heartbeat" }, orderBy: { createdAt: "desc" }, take: 1 }
        }
      })
    ]);

    return {
      ok: true,
      data: {
        activeSessions,
        queuedBuilds,
        recentEvents,
        scripts,
        sessions: sessions.map((session) => ({
          id: session.id,
          status: session.status,
          game: session.game,
          scriptFile: session.script?.fileName ?? null,
          robloxUsername: session.device?.robloxUsername ?? null,
          lastSeenAt: session.lastSeenAt,
          stats: session.events[0]?.payload ?? null
        }))
      }
    };
  });

  app.get("/admin/scripts", async () => {
    const scripts = await db.script.findMany({
      orderBy: { updatedAt: "desc" },
      include: { builds: { orderBy: { createdAt: "desc" }, take: 10 } }
    });

    return { ok: true, data: scripts };
  });

  app.post<{ Params: { id: string }; Body: { reason?: string } }>("/admin/sessions/:id/kick", { preHandler: requireBrowserRequest }, async (request) => {
    const session = await db.scriptSession.update({
      where: { id: request.params.id },
      data: {
        status: SessionStatus.KICK_REQUESTED,
        kickReason: request.body?.reason ?? "Kicked by admin",
        kickedAt: new Date()
      }
    });

    await db.auditLog.create({
      data: {
        actorType: "admin_service",
        action: "script_session.kick_requested",
        targetType: "script_session",
        targetId: session.id,
        payload: { reason: session.kickReason }
      }
    });

    return { ok: true, data: session };
  });
}
