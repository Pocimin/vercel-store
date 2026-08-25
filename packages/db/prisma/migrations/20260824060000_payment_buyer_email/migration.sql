-- Add buyerEmail to Payment (guest checkout)
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "buyerEmail" TEXT;
