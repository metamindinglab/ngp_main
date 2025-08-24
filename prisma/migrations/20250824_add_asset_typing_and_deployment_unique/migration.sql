-- Add columns to Asset for Roblox/canonical typing and capabilities
ALTER TABLE "Asset"
  ADD COLUMN IF NOT EXISTS "robloxType" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalType" TEXT,
  ADD COLUMN IF NOT EXISTS "capabilities" JSONB,
  ADD COLUMN IF NOT EXISTS "source" TEXT;

-- Ensure unique deployment per (scheduleId, gameId)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'GameDeployment_schedule_game_unique'
  ) THEN
    CREATE UNIQUE INDEX "GameDeployment_schedule_game_unique"
      ON "GameDeployment" ("scheduleId", "gameId");
  END IF;
END $$;


