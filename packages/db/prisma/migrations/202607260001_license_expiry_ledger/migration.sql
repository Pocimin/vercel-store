ALTER TABLE "License"
  ADD COLUMN "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "intendedExpiresAt" TIMESTAMP(3),
  ADD COLUMN "providerExpiresAt" TIMESTAMP(3),
  ADD COLUMN "lastProviderCheckAt" TIMESTAMP(3);

UPDATE "License"
SET
  "issuedAt" = "createdAt",
  "intendedExpiresAt" = "expiresAt"
WHERE "intendedExpiresAt" IS NULL;

CREATE INDEX "License_intendedExpiresAt_idx" ON "License"("intendedExpiresAt");
