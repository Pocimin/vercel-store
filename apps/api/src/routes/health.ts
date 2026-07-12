import type { FastifyInstance } from "fastify";
import { db } from "@nznt/db";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "ok",
    service: "nznt-api",
    time: new Date().toISOString()
  }));

  app.get("/health/ready", async (_request, reply) => {
    await db.$queryRaw`SELECT 1`;
    return reply.send({
      status: "ok",
      service: "nznt-api",
      time: new Date().toISOString()
    });
  });
}
