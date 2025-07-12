-- Step 1: Create new enum types
CREATE TYPE "AdContainerType" AS ENUM ('DISPLAY', 'NPC', 'MINIGAME');
CREATE TYPE "AdContainerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- Step 2: Create new table with updated structure
CREATE TABLE "AdContainer" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AdContainerType" NOT NULL,
    "position" JSONB NOT NULL,
    "status" "AdContainerStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentAdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdContainer_pkey" PRIMARY KEY ("id")
);

-- Step 3: Copy existing data with transformed structure
INSERT INTO "AdContainer" (
    "id", 
    "gameId", 
    "name", 
    "description", 
    "type", 
    "position", 
    "status", 
    "currentAdId",
    "createdAt",
    "updatedAt"
)
SELECT 
    id,
    "gameId",
    name,
    description,
    CASE 
        WHEN type = 'display' THEN 'DISPLAY'::"AdContainerType"
        WHEN type = 'npc' THEN 'NPC'::"AdContainerType"
        WHEN type = 'minigame' THEN 'MINIGAME'::"AdContainerType"
        ELSE 'DISPLAY'::"AdContainerType"
    END,
    jsonb_build_object(
        'x', "locationX",
        'y', "locationY",
        'z', "locationZ"
    ),
    CASE 
        WHEN status = 'active' THEN 'ACTIVE'::"AdContainerStatus"
        WHEN status = 'inactive' THEN 'INACTIVE'::"AdContainerStatus"
        WHEN status = 'maintenance' THEN 'MAINTENANCE'::"AdContainerStatus"
        ELSE 'ACTIVE'::"AdContainerStatus"
    END,
    "currentAdId",
    "createdAt",
    "updatedAt"
FROM "GameAdContainer";

-- Step 4: Create indexes for performance
CREATE INDEX "AdContainer_gameId_idx" ON "AdContainer"("gameId");
CREATE INDEX "AdContainer_currentAdId_idx" ON "AdContainer"("currentAdId");

-- Step 5: Add foreign key constraints
ALTER TABLE "AdContainer" 
ADD CONSTRAINT "AdContainer_gameId_fkey" 
FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdContainer" 
ADD CONSTRAINT "AdContainer_currentAdId_fkey" 
FOREIGN KEY ("currentAdId") REFERENCES "GameAd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Verify data migration
DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) FROM "GameAdContainer"
    ) = (
        SELECT COUNT(*) FROM "AdContainer"
    ), 'Data migration count mismatch';
END $$;

-- Step 7: If everything is successful, drop old table
-- IMPORTANT: Only uncomment this after verifying the migration
-- DROP TABLE "GameAdContainer"; 