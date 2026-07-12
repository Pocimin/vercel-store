import { readFile } from "node:fs/promises";
import { db } from "../packages/db/src/index.js";
import { encryptSecret, hashSecret, previewSecret } from "../packages/auth/src/index.js";

const file = process.argv[2];
const secret = process.env.SCRIPT_SIGNING_SECRET;
if (!file || !secret) throw new Error("Usage: pnpm migrate:legacy-keys <database.json> with SCRIPT_SIGNING_SECRET set");

const data = JSON.parse(await readFile(file, "utf8")) as Record<string, {
  key?: string;
  password?: string;
  tag?: string;
}>;

let migrated = 0;
let skipped = 0;
for (const [discordId, legacy] of Object.entries(data)) {
  if (!/^\d+$/.test(discordId) || !legacy.key) continue;
  const user = await db.user.findUnique({ where: { discordId }, include: { licenses: { orderBy: { createdAt: "desc" }, take: 1 } } });
  const license = user?.licenses[0];
  if (!user || !license) {
    skipped++;
    continue;
  }
  const key = legacy.key.trim();
  const displayName = legacy.tag?.replace(/#\d+$/, "").trim() || null;
  await db.$transaction([
    db.license.update({
      where: { id: license.id },
      data: {
        keyHash: hashSecret(key.toUpperCase(), secret),
        keyPreview: previewSecret(key),
        keyCiphertext: encryptSecret(key, secret),
        providerUserCiphertext: legacy.password ? encryptSecret(legacy.password.trim(), secret) : null
      }
    }),
    db.user.update({ where: { id: user.id }, data: { displayName: displayName ?? user.displayName } })
  ]);
  migrated++;
}

console.log(`Migrated ${migrated} legacy licenses; skipped ${skipped} unmatched users.`);
await db.$disconnect();
