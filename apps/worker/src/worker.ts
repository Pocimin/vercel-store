import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { basename, join, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { decryptSecret, encryptSecret, hashSecret, previewSecret } from "@nznt/auth";
import { LicenseSource, LicenseStatus, ScriptBuildStatus, db } from "@nznt/db";

const scriptArtifactRoot = process.env.SCRIPT_ARTIFACT_ROOT ?? "storage/builds";
const prometheusRoot = process.env.PROMETHEUS_ROOT ?? "../Prometheus-master";
const prometheusPreset = process.env.PROMETHEUS_PRESET ?? "Medium";
const discordAuditChannelId = process.env.DISCORD_LICENSE_AUDIT_CHANNEL_ID ?? "1256664627962712093";
const legacyDatabasePath = process.env.LEGACY_DISCORD_DATABASE_PATH ?? "/app/legacy/database.json";
const reconcileEveryMs = 6 * 60 * 60 * 1000;
const vonaliaDelayMs = 300;
let nextLicenseReconcileAt = 0;
let reconcilingLicenses = false;

type LegacyLicense = {
  key?: string;
  password?: string;
  type?: string;
  tag?: string;
  expiresAt?: number | null;
};

type AuditEntitlement = {
  active: boolean;
  plan?: string;
  expiresAt?: Date | null;
  messageId: string;
};

const sleep = (ms: number) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function normalizedTag(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/#\d{4}$/, "");
}

function auditExpiry(value: string, now = Date.now()) {
  if (/^never$/i.test(value.trim())) return null;
  const seconds = Number(value.match(/<t:(\d+):/)?.[1]);
  const expiresAt = Number.isFinite(seconds) ? new Date(seconds * 1000) : null;
  // ponytail: legacy bot emitted a few malformed far-future timestamps; the legacy DB holds their usable date.
  return expiresAt && expiresAt.getTime() > now - 365 * 24 * 60 * 60 * 1000 && expiresAt.getTime() < now + 10 * 365 * 24 * 60 * 60 * 1000
    ? expiresAt
    : undefined;
}

function expiresAtFromLegacy(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return new Date(number < 1_000_000_000_000 ? number * 1000 : number);
}

async function discordAuditEntitlements() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN is not configured");

  const events: Array<{ createdAt: string; id: string; content: string }> = [];
  let before = "";
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (before) query.set("before", before);
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(`https://discord.com/api/v10/channels/${discordAuditChannelId}/messages?${query}`, {
        headers: { Authorization: `Bot ${token}` }
      });
      if (response.status !== 429 || attempt === 2) break;
      const limited = await response.json() as { retry_after?: number };
      await sleep(Math.max(1_000, Math.ceil((limited.retry_after ?? 1) * 1_000)));
    }
    if (!response) throw new Error("Discord audit channel request failed");
    if (!response.ok) throw new Error(`Discord audit channel HTTP ${response.status}`);
    const batch = await response.json() as Array<{ id: string; timestamp: string; content?: string }>;
    events.push(...batch.map((message) => ({ id: message.id, createdAt: message.timestamp, content: message.content ?? "" })));
    before = batch.at(-1)?.id ?? "";
    if (batch.length === 100) await sleep(250);
    else break;
  } while (before);

  const entitlements = new Map<string, AuditEntitlement>();
  for (const event of events.reverse()) {
    const assigned = event.content.match(/\*\*(.+?)\*\*\s+assigned\s+\*\*(.+?)\*\*\s*\|\s*Expires:\s*(Never|<t:\d+:R>)/i);
    if (assigned?.[1] && assigned[2] && assigned[3]) {
      const entitlement: AuditEntitlement = {
        active: true,
        plan: assigned[2].trim().toLowerCase(),
        messageId: event.id
      };
      const expiresAt = auditExpiry(assigned[3]);
      if (expiresAt !== undefined) entitlement.expiresAt = expiresAt;
      entitlements.set(normalizedTag(assigned[1]), entitlement);
      continue;
    }
    const expired = event.content.match(/\*\*(.+?)\*\*\s+[—-]\s+\*\*(.+?)\*\*\s+expired\./i);
    if (expired?.[1]) {
      entitlements.set(normalizedTag(expired[1]), { active: false, messageId: event.id });
    }
  }
  return entitlements;
}

async function vonaliaRequest(method: string, path: string, body?: Record<string, unknown>) {
  const apiKey = process.env.VONALIA_API_KEY;
  if (!apiKey) throw new Error("VONALIA_API_KEY is not configured");
  await sleep(vonaliaDelayMs);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://vonalia.com/api/v1${path}`, {
      method,
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const text = await response.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
    if (response.status === 429 && attempt < 2) {
      await sleep(Math.max(1_000, Number(response.headers.get("retry-after") ?? 1) * 1_000));
      continue;
    }
    if (!response.ok) throw new Error(typeof data === "object" && data?.error ? data.error : `Vonalia HTTP ${response.status}`);
    return data as Record<string, unknown>;
  }
  throw new Error("Vonalia rate limit retry exhausted");
}

function vonaliaExpiry(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return new Date(number < 1_000_000_000_000 ? number * 1_000 : number);
}

function vonaliaActive(user: Record<string, unknown>) {
  const falseValue = (value: unknown) => value === false || String(value).toLowerCase() === "false" || value === "1";
  if (falseValue(user.ban) || falseValue(user.freeze) || falseValue(user.Blacklist) || falseValue(user.Frozen) || falseValue(user.active)) return false;
  const expiresAt = vonaliaExpiry(user.expiration ?? user.Whitelist);
  return !expiresAt || expiresAt.getTime() > Date.now();
}

function providerNote(discordId: string | null | undefined, displayName: string | null | undefined) {
  return `nznt Discord ${displayName || "customer"}, ${discordId || "unknown"}`.replace(/[^A-Za-z0-9 .,:]/g, " ").slice(0, 100);
}

async function createVonaliaReplacement(plan: string, expiresAt: Date | null, note: string) {
  const teamId = process.env.VONALIA_TEAM_ID;
  if (!teamId) throw new Error("VONALIA_TEAM_ID is not configured");
  const created = await vonaliaRequest("POST", `/teams/${teamId}/users`, {});
  const userId = String(created.user_id ?? created.userId ?? created.id ?? "");
  if (!userId) throw new Error("Vonalia did not return a user ID");
  const expiration = expiresAt?.getTime() ?? 8_000_000_000_000;
  await vonaliaRequest("PATCH", `/teams/${teamId}/users/${encodeURIComponent(userId)}`, { type: plan, expiration, note });
  const user = await vonaliaRequest("GET", `/teams/${teamId}/users/${encodeURIComponent(userId)}`);
  const key = String(user.key ?? user.Key ?? "");
  if (!key) throw new Error("Vonalia did not return a key");
  return { key, userId };
}

function missingVonaliaUser(error: unknown) {
  const message = String(error instanceof Error ? error.message : error).toLowerCase();
  return message.includes("not found") || message.includes("404") || message.includes("invalid user");
}

async function restoreDiscordLicenses() {
  const signingSecret = process.env.SCRIPT_SIGNING_SECRET;
  if (!signingSecret) throw new Error("SCRIPT_SIGNING_SECRET is not configured");
  const [audit, content] = await Promise.all([discordAuditEntitlements(), readFile(legacyDatabasePath, "utf8")]);
  const legacy = JSON.parse(content) as Record<string, LegacyLicense>;
  let restored = 0;

  for (const [discordId, record] of Object.entries(legacy)) {
    const entitlement = audit.get(normalizedTag(record.tag));
    if (!entitlement?.active || !record.key) continue;
    const expiresAt = entitlement.expiresAt ?? expiresAtFromLegacy(record.expiresAt);
    if (expiresAt && expiresAt.getTime() <= Date.now()) continue;
    const plan = entitlement.plan || String(record.type || "monthly").toLowerCase();
    const user = await db.user.upsert({
      where: { discordId },
      update: record.tag ? { displayName: record.tag } : {},
      create: { discordId, username: `discord_${discordId}`, displayName: record.tag || `Discord ${discordId}` }
    });
    const keyHash = hashSecret(record.key.trim().toUpperCase(), signingSecret);
    const existing = await db.license.findUnique({ where: { keyHash } })
      ?? await db.license.findFirst({ where: { userId: user.id, source: LicenseSource.DISCORD }, orderBy: { updatedAt: "desc" } });
    const data = {
      userId: user.id,
      keyHash,
      keyPreview: previewSecret(record.key),
      keyCiphertext: encryptSecret(record.key, signingSecret),
      providerUserCiphertext: record.password ? encryptSecret(record.password, signingSecret) : null,
      plan,
      source: LicenseSource.DISCORD,
      status: LicenseStatus.ACTIVE,
      expiresAt
    };
    if (existing) await db.license.update({ where: { id: existing.id }, data });
    else await db.license.create({ data });
    await db.auditLog.create({ data: { actorType: "worker", action: "license.discord_restore", targetType: "license", targetId: existing?.id ?? keyHash, payload: { discordId, auditMessageId: entitlement.messageId, plan, expiresAt } } });
    restored += 1;
  }
  console.log(`[worker] restored ${restored} Discord licenses from audit history`);
}

async function validateVonaliaLicenses() {
  const signingSecret = process.env.SCRIPT_SIGNING_SECRET;
  const teamId = process.env.VONALIA_TEAM_ID;
  if (!signingSecret || !teamId) throw new Error("Vonalia reconciliation is not configured");
  const licenses = await db.license.findMany({ include: { user: true }, orderBy: { updatedAt: "asc" } });
  let expired = 0;
  let repaired = 0;

  for (const license of licenses) {
    if (license.expiresAt && license.expiresAt.getTime() <= Date.now()) {
      if (license.status !== LicenseStatus.EXPIRED) await db.license.update({ where: { id: license.id }, data: { status: LicenseStatus.EXPIRED } });
      expired += 1;
      continue;
    }
    if (license.status !== LicenseStatus.ACTIVE || !license.keyCiphertext) continue;

    const key = decryptSecret(license.keyCiphertext, signingSecret);
    const providerUserId = license.providerUserCiphertext
      ? decryptSecret(license.providerUserCiphertext, signingSecret)
      : key;
    let remote: Record<string, unknown> | null = null;
    try {
      remote = await vonaliaRequest("GET", `/teams/${teamId}/users/${encodeURIComponent(providerUserId)}`);
    } catch (error) {
      if (!missingVonaliaUser(error)) {
        console.error(`[worker] Vonalia check failed for ${license.id}: ${error instanceof Error ? error.message : error}`);
        continue;
      }
    }

    const remoteKey = String(remote?.key ?? remote?.Key ?? "");
    const remoteExpiresAt = vonaliaExpiry(remote?.expiration ?? remote?.Whitelist);
    const expiryMismatch = Boolean(license.expiresAt && remoteExpiresAt && Math.abs(remoteExpiresAt.getTime() - license.expiresAt.getTime()) > 60_000);
    if (remote && vonaliaActive(remote) && remoteKey && remoteKey === key && !expiryMismatch) continue;
    if (remote && vonaliaActive(remote) && remoteKey && !expiryMismatch) {
      await db.license.update({
        where: { id: license.id },
        data: { keyHash: hashSecret(remoteKey.trim().toUpperCase(), signingSecret), keyPreview: previewSecret(remoteKey), keyCiphertext: encryptSecret(remoteKey, signingSecret), status: LicenseStatus.ACTIVE }
      });
      repaired += 1;
      continue;
    }

    const replacement = await createVonaliaReplacement(license.plan, license.expiresAt, providerNote(license.user?.discordId, license.user?.displayName ?? license.user?.username));
    await db.license.update({
      where: { id: license.id },
      data: {
        keyHash: hashSecret(replacement.key.trim().toUpperCase(), signingSecret),
        keyPreview: previewSecret(replacement.key),
        keyCiphertext: encryptSecret(replacement.key, signingSecret),
        providerUserCiphertext: encryptSecret(replacement.userId, signingSecret),
        status: LicenseStatus.ACTIVE
      }
    });
    await db.auditLog.create({ data: { actorType: "worker", action: "license.vonalia_replace", targetType: "license", targetId: license.id, payload: { plan: license.plan, expiresAt: license.expiresAt } } });
    repaired += 1;
  }
  console.log(`[worker] Vonalia reconciliation complete: ${expired} expired, ${repaired} repaired`);
}

async function reconcileLicenses() {
  if (reconcilingLicenses || Date.now() < nextLicenseReconcileAt) return;
  reconcilingLicenses = true;
  nextLicenseReconcileAt = Date.now() + reconcileEveryMs;
  try {
    await restoreDiscordLicenses();
    await validateVonaliaLicenses();
  } catch (error) {
    nextLicenseReconcileAt = Date.now() + 5 * 60 * 1000;
    console.error(`[worker] license reconciliation failed: ${error instanceof Error ? error.message : error}`);
  } finally {
    reconcilingLicenses = false;
  }
}

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
      }
    });
  });
}

async function checksumFile(path: string) {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex");
}

async function processBuild() {
  const build = await db.scriptBuild.findFirst({
    where: { status: ScriptBuildStatus.QUEUED },
    orderBy: { createdAt: "asc" },
    include: { script: true }
  });

  if (!build) return false;

  console.log(`[worker] building ${build.script.fileName}@${build.version}`);

  await db.scriptBuild.update({
    where: { id: build.id },
    data: { status: ScriptBuildStatus.BUILDING, error: null }
  });

  try {
    await mkdir(scriptArtifactRoot, { recursive: true });
    const rawRoot = resolve(process.env.SCRIPT_RAW_ROOT ?? "storage/raw");
    const sourcePath = resolve(build.sourcePath);
    if (!sourcePath.startsWith(`${rawRoot}${sep}`)) throw new Error("Build source is outside the raw script directory");
    const outputPath = resolve(scriptArtifactRoot, basename(build.script.fileName));
    const artifactRoot = resolve(scriptArtifactRoot);
    if (!outputPath.startsWith(`${artifactRoot}${sep}`)) throw new Error("Build output is outside the artifact directory");
    const cliPath = resolve(prometheusRoot, "cli.lua");

    await run("lua", [
      cliPath,
      "--preset",
      prometheusPreset,
      "--LuaU",
      "--out",
      outputPath,
      sourcePath
    ], resolve(prometheusRoot));

    const checksum = await checksumFile(outputPath);

    await db.$transaction([
      db.scriptBuild.update({
        where: { id: build.id },
        data: {
          status: ScriptBuildStatus.PUBLISHED,
          obfuscatedPath: outputPath,
          checksum,
          error: null,
          publishedAt: new Date()
        }
      }),
      db.script.update({
        where: { id: build.scriptId },
        data: { activeBuildId: build.id }
      })
    ]);

    console.log(`[worker] published ${build.script.fileName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.scriptBuild.update({
      where: { id: build.id },
      data: {
        status: ScriptBuildStatus.FAILED,
        error: message.slice(0, 2000)
      }
    });
    console.error(`[worker] build failed ${build.script.fileName}: ${message}`);
  }

  return true;
}

async function tick() {
  while (await processBuild()) {
    // Drain immediately so uploads publish without waiting for the next interval.
  }
}

console.log("[worker] started");

setInterval(() => {
  tick().catch((error) => {
    console.error("[worker] tick failed", error);
  });
  reconcileLicenses();
}, 10_000);

await tick();
await reconcileLicenses();
