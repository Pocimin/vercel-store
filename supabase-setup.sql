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

-- Enable RLS (optional but recommended)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
