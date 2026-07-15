import { readFile } from "node:fs/promises";
import { db } from "../packages/db/src/index.js";
import { encryptSecret, hashSecret, previewSecret } from "../packages/auth/src/index.js";

const file = process.argv[2];
const secret = process.env.SCRIPT_SIGNING_SECRET;
if (!file || !secret) throw new Error("Usage: pnpm migrate:legacy-keys <database.json> with SCRIPT_SIGNING_SECRET set");
const createUsers = process.argv.includes("--create-users");

const data = JSON.parse(await readFile(file, "utf8")) as Record<string, {
  key?: string;
  password?: string;
  tag?: string;
  type?: string;
  expiresAt?: number | null;
}>;

let migrated = 0;
let skipped = 0;
for (const [discordId, legacy] of Object.entries(data)) {
  if (!/^\d+$/.test(discordId) || !legacy.key) continue;
  let user = await db.user.findUnique({ where: { discordId }, include: { licenses: { orderBy: { createdAt: "desc" }, take: 1 } } });
  const displayName = legacy.tag?.replace(/#\d+$/, "").trim() || null;
  if (!user && createUsers) {
    user = await db.user.create({
      data: { discordId, displayName },
      include: { licenses: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
  }
  if (!user) {
    skipped++;
    continue;
  }
  const key = legacy.key.trim();
  const keyHash = hashSecret(key.toUpperCase(), secret);
  const existingLicense = user.licenses[0] ?? await db.license.findUnique({ where: { keyHash } });
  const expiresAt = typeof legacy.expiresAt === "number" ? new Date(legacy.expiresAt) : null;
  const status = expiresAt && expiresAt <= new Date() ? "EXPIRED" : "ACTIVE";
  await db.$transaction([
    existingLicense
      ? db.license.update({
          where: { id: existingLicense.id },
          data: {
            userId: user.id,
            keyHash,
            keyPreview: previewSecret(key),
            keyCiphertext: encryptSecret(key, secret),
            providerUserCiphertext: legacy.password ? encryptSecret(legacy.password.trim(), secret) : null,
            plan: legacy.type?.trim() || "legacy",
            status,
            expiresAt,
            source: "IMPORT"
          }
        })
      : db.license.create({
          data: {
            userId: user.id,
            keyHash,
            keyPreview: previewSecret(key),
            keyCiphertext: encryptSecret(key, secret),
            providerUserCiphertext: legacy.password ? encryptSecret(legacy.password.trim(), secret) : null,
            plan: legacy.type?.trim() || "legacy",
            status,
            expiresAt,
            source: "IMPORT"
          }
        }),
    db.user.update({ where: { id: user.id }, data: { displayName: displayName ?? user.displayName } })
  ]);
  migrated++;
}

console.log(`Migrated ${migrated} legacy licenses; skipped ${skipped} unmatched users.`);
await db.$disconnect();
