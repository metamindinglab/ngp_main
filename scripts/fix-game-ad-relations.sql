-- Begin transaction
BEGIN;

-- First ensure the _GameToAds table exists with correct structure
CREATE TABLE IF NOT EXISTS "_GameToAds" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GameToAds_AB_unique" UNIQUE ("A", "B")
);

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '_GameToAds_B_index') THEN
        CREATE INDEX "_GameToAds_B_index" ON "_GameToAds"("B");
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = '_GameToAds_A_fkey'
    ) THEN
        ALTER TABLE "_GameToAds" 
        ADD CONSTRAINT "_GameToAds_A_fkey" 
        FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = '_GameToAds_B_fkey'
    ) THEN
        ALTER TABLE "_GameToAds" 
        ADD CONSTRAINT "_GameToAds_B_fkey" 
        FOREIGN KEY ("B") REFERENCES "GameAd"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Migrate data from old relation table if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'GameAdToGame'
    ) THEN
        -- Migrate data from old relation table to new one
        INSERT INTO "_GameToAds" ("A", "B")
        SELECT DISTINCT "gameId", "gameAdId"
        FROM "GameAdToGame"
        ON CONFLICT DO NOTHING;
        
        -- Drop the old table
        DROP TABLE "GameAdToGame";
    END IF;
END $$;

-- Update migration history to mark our changes as applied
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES 
    ('manual_fix', 'manual_fix', NOW(), '20250630000004_safe_game_ad_relations', NULL, NULL, NOW(), 1)
ON CONFLICT DO NOTHING;

-- Commit transaction
COMMIT; 