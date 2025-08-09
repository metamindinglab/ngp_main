-- Fix GameAd many-to-many relationship issue
-- This migration allows GameAds to be displayed in multiple games via playlists

-- Step 1: Make GameAd.gameId nullable to remove single-game constraint
ALTER TABLE "GameAd" ALTER COLUMN "gameId" DROP NOT NULL;

-- Step 2: Ensure all existing GameAds have their many-to-many relationships
-- Insert missing relationships based on current gameId values
INSERT INTO "_GameToAds" ("A", "B") 
SELECT DISTINCT g."gameId", g."id" 
FROM "GameAd" g 
WHERE g."gameId" IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM "_GameToAds" gta 
    WHERE gta."A" = g."gameId" AND gta."B" = g."id"
  );

-- Step 3: Add specific relationship for ad_1742883681966 to work with container_001's game
-- Container_001 belongs to game_b2e6f7b7, so ad_1742883681966 should be available there
INSERT INTO "_GameToAds" ("A", "B") 
SELECT 'game_b2e6f7b7', 'ad_1742883681966'
WHERE NOT EXISTS (
  SELECT 1 FROM "_GameToAds" 
  WHERE "A" = 'game_b2e6f7b7' AND "B" = 'ad_1742883681966'
);

-- Step 4: Add index for better performance on many-to-many queries
CREATE INDEX IF NOT EXISTS "_GameToAds_A_idx" ON "_GameToAds"("A");
CREATE INDEX IF NOT EXISTS "_GameToAds_B_idx" ON "_GameToAds"("B");

-- Verification queries (for manual testing after migration)
-- SELECT COUNT(*) FROM "_GameToAds"; -- Should show increased relationships
-- SELECT * FROM "_GameToAds" WHERE "B" = 'ad_1742883681966'; -- Should show multiple games
