import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var nzntPrisma: PrismaClient | undefined;
}

export const db = globalThis.nzntPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.nzntPrisma = db;
}

export * from "@prisma/client";
