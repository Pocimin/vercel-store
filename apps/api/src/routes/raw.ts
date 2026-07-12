import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, normalize } from "node:path";
import type { FastifyInstance } from "fastify";

const scriptRoot = normalize(process.env.SCRIPT_ARTIFACT_ROOT ?? "storage/builds");

function resolveScriptPath(fileName: string) {
  const cleaned = fileName.replace(/\\/g, "/").split("/").pop();
  if (!cleaned || !/^[a-zA-Z0-9_. -]+\.lua$/.test(cleaned)) {
    return null;
  }

  return join(scriptRoot, cleaned);
}

export async function registerRawRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { file?: string } }>("/raw.php", async (request, reply) => {
    const filePath = request.query.file ? resolveScriptPath(request.query.file) : null;
    if (!filePath) {
      return reply.status(400).send("missing or invalid file");
    }

    try {
      await stat(filePath);
    } catch {
      return reply.status(404).send("script not found");
    }

    reply.header("content-type", "text/plain; charset=utf-8");
    return reply.send(createReadStream(filePath));
  });

  app.get<{ Params: { file: string } }>("/scripts/:file", async (request, reply) => {
    const filePath = resolveScriptPath(request.params.file);
    if (!filePath) {
      return reply.status(400).send("invalid file");
    }

    try {
      await stat(filePath);
    } catch {
      return reply.status(404).send("script not found");
    }

    reply.header("content-type", "text/plain; charset=utf-8");
    return reply.send(createReadStream(filePath));
  });
}
