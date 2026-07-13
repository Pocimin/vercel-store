import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerScriptRoutes } from "./routes/script.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerRawRoutes } from "./routes/raw.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerPurchaseRoutes } from "./routes/purchases.js";
import { registerBioRoutes } from "./routes/bio.js";

export async function buildHttpServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      redact: ["req.headers.authorization", "req.headers.cookie", "key", "hwid"]
    },
    trustProxy: true,
    bodyLimit: 1024 * 1024 * 4
  });

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false
  });

  await app.register(cors, {
    origin: [env.PUBLIC_WEB_URL, "https://nznt.store", "https://www.nznt.store"],
    credentials: true
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute"
  });

  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerPurchaseRoutes(app);
  await registerBioRoutes(app);
  await registerScriptRoutes(app);
  await registerAdminRoutes(app);
  await registerRawRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const err = error instanceof Error ? error : new Error("Unknown error");
    const maybeStatus = "statusCode" in err && typeof err.statusCode === "number" ? err.statusCode : undefined;
    const statusCode = maybeStatus && maybeStatus >= 400 ? maybeStatus : 500;
    return reply.status(statusCode).send({
      ok: false,
      error: {
        code: statusCode === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
        message: statusCode === 500 ? "Unexpected server error" : err.message
      }
    });
  });

  return app;
}
