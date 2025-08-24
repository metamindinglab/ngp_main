-- Add GameAd.description
ALTER TABLE "GameAd" ADD COLUMN IF NOT EXISTS "description" TEXT;
