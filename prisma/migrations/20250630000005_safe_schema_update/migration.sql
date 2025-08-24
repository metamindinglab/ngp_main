-- CreateTable
CREATE TABLE IF NOT EXISTS "_GameToAds" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GameToAds_AB_unique" UNIQUE ("A", "B")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_GameToAds_B_index" ON "_GameToAds"("B");

-- AddForeignKey (only if they don't exist)
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

-- Migrate data from old table if it exists
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

-- Update GameAdContainer table
ALTER TABLE "GameAdContainer" DROP COLUMN IF EXISTS "description";
ALTER TABLE "GameAdContainer" DROP COLUMN IF EXISTS "type";
ALTER TABLE "GameAdContainer" DROP COLUMN IF EXISTS "locationX";
ALTER TABLE "GameAdContainer" DROP COLUMN IF EXISTS "locationY";
ALTER TABLE "GameAdContainer" DROP COLUMN IF EXISTS "locationZ";
ALTER TABLE "GameAdContainer" DROP COLUMN IF EXISTS "status";

-- Update GameAd table
ALTER TABLE "GameAd" DROP COLUMN IF EXISTS "status";
ALTER TABLE "GameAd" DROP COLUMN IF EXISTS "schedule";
ALTER TABLE "GameAd" DROP COLUMN IF EXISTS "targeting";
ALTER TABLE "GameAd" DROP COLUMN IF EXISTS "metrics"; 