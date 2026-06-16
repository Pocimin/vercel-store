-- Run this in Supabase SQL Editor to create tables manually

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "robloxUsername" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "licenseKey" TEXT,
    "licensePassword" TEXT,
    "licenseType" TEXT,
    "licenseExpiresAt" TIMESTAMPTZ
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "robloxUsername" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "licenseKey" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "licensePassword" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "licenseType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "licenseExpiresAt" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastKeyVerified" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "keyStatus" TEXT;

-- Create Payment table
CREATE TABLE IF NOT EXISTS "Payment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "User"(id),
    plan TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    "proofUrl" TEXT,
    "discordMessageId" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "processedAt" TIMESTAMPTZ,
    "processedBy" TEXT,
    "declineReason" TEXT
);

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "proofUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "discordUsername" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "discordMessageId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMPTZ;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "processedBy" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "declineReason" TEXT;

-- Enable RLS (optional but recommended)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
