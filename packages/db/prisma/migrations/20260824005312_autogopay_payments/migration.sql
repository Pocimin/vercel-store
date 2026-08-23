-- AlterEnum: add PAID and EXPIRED to existing "PaymentStatus" enum
-- (ALTER TYPE ... ADD VALUE cannot be scheduled by Prisma for enum extension, so run via DO)

DO $$ BEGIN
  ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PAID';
END $$;

DO $$ BEGIN
  ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
END $$;

-- AlterTable: AutoGoPay QRIS fields on Payment

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "orderSn" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "qrUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "qrString" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "autoPaidAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "providerPaidAt" TEXT;

-- CreateIndex

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_orderSn_key" ON "Payment"("orderSn");
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "buyerEmail" TEXT;
