import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_ACCESS_HASHES = [
  "9d0130de0b82226f1409a06c5342318a7e837c2192dd76005c3abf1c72bbf3af",
  "d6bb0bd35f45988960d69248493816952d3189fcefbb9ffd5cf901893ea6c32a",
  "9e5fa0203fc3827e849d70542015ff8c0fcde6b7a915def73d3d0dc8789e4ea1",
  "d975429b02ddc91d0ce9d2b658a22d0ba0a86157c675b1e4d4071f823907db94",
];

const FALLBACK_LINKS: Record<string, string> = {
  whatsapp: "https://wa.me/6287765970055",
  instagram: "https://www.instagram.com/reinardomar/",
};

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(normalizeAnswer(value), "utf8").digest("hex");
}

function timingSafeEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getAccessHashes() {
  const configured = String(process.env.NZNT_ACCESS_HASH || "")
    .split(",")
    .map((hash) => hash.trim())
    .filter(Boolean);

  return configured.length ? configured : DEFAULT_ACCESS_HASHES;
}

function getDestination(target: string) {
  if (target === "whatsapp") return process.env.NZNT_WHATSAPP_URL || FALLBACK_LINKS.whatsapp;
  if (target === "instagram") return process.env.NZNT_INSTAGRAM_URL || FALLBACK_LINKS.instagram;
  return "";
}

function redirect(request: NextRequest, location: string) {
  const url = location.startsWith("http")
    ? location
    : new URL(location, request.url);

  return NextResponse.redirect(url, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const target = String(form?.get("target") || "");
  const answer = String(form?.get("answer") || "");
  const destination = getDestination(target);
  const suppliedHash = sha256(answer);

  const valid = Boolean(destination) && getAccessHashes().some((expectedHash) =>
    timingSafeEquals(suppliedHash, expectedHash)
  );

  return redirect(request, valid ? destination : "/bio");
}

export async function GET() {
  return new NextResponse("Method not allowed", {
    status: 405,
    headers: {
      Allow: "POST",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
