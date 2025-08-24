ALTER TABLE "Asset"
  ADD COLUMN IF NOT EXISTS "robloxSubtype" TEXT,
  ADD COLUMN IF NOT EXISTS "robloxAssetTypeId" INTEGER;

CREATE INDEX IF NOT EXISTS "Asset_canonicalType_idx" ON "Asset"(("canonicalType")) WHERE "canonicalType" IS NOT NULL;


