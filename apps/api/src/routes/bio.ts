import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../env.js";

const accessHashes = new Set([
  "9d0130de0b82226f1409a06c5342318a7e837c2192dd76005c3abf1c72bbf3af",
  "d6bb0bd35f45988960d69248493816952d3189fcefbb9ffd5cf901893ea6c32a",
  "9e5fa0203fc3827e849d70542015ff8c0fcde6b7a915def73d3d0dc8789e4ea1",
  "d975429b02ddc91d0ce9d2b658a22d0ba0a86157c675b1e4d4071f823907db94",
]);

const destinations = {
  whatsapp: "https://wa.me/6287765970055",
  instagram: "https://www.instagram.com/reinardomar/",
} as const;

const unlockSchema = z.object({
  target: z.enum(["whatsapp", "instagram"]),
  answer: z.string().min(1).max(160),
});

function answerHash(answer: string) {
  return createHash("sha256").update(answer.trim().toLowerCase().replace(/\s+/g, " "), "utf8").digest();
}

function hasAccess(answer: string) {
  const supplied = answerHash(answer);
  for (const expected of accessHashes) {
    const expectedBuffer = Buffer.from(expected, "hex");
    if (expectedBuffer.length === supplied.length && timingSafeEqual(supplied, expectedBuffer)) return true;
  }
  return false;
}

export async function registerBioRoutes(app: FastifyInstance) {
  app.post("/bio/unlock", {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } }
  }, async (request) => {
    const input = unlockSchema.parse(request.body);
    return {
      ok: true,
      data: { url: hasAccess(input.answer) ? destinations[input.target] : `${env.PUBLIC_WEB_URL}/bio` },
    };
  });
}
