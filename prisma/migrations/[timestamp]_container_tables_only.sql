-- First, create the new enum types if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adcontainertype') THEN
        CREATE TYPE "AdContainerType" AS ENUM ('DISPLAY', 'NPC', 'MINIGAME');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adcontainerstatus') THEN
        CREATE TYPE "AdContainerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
    END IF;
END $$;

-- Drop the old container table if it exists (we confirmed it's empty)
DROP TABLE IF EXISTS "GameAdContainer";

-- Create new AdContainer table
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

-- Create AdEngagement table
CREATE TABLE "AdEngagement" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "adId" TEXT,
    "eventType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdEngagement_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "AdContainer_gameId_idx" ON "AdContainer"("gameId");
CREATE INDEX "AdContainer_currentAdId_idx" ON "AdContainer"("currentAdId");
CREATE INDEX "AdEngagement_containerId_idx" ON "AdEngagement"("containerId");
CREATE INDEX "AdEngagement_adId_idx" ON "AdEngagement"("adId");

-- Add foreign key constraints
ALTER TABLE "AdContainer" 
ADD CONSTRAINT "AdContainer_gameId_fkey" 
FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdContainer" 
ADD CONSTRAINT "AdContainer_currentAdId_fkey" 
FOREIGN KEY ("currentAdId") REFERENCES "GameAd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdEngagement" 
ADD CONSTRAINT "AdEngagement_containerId_fkey" 
FOREIGN KEY ("containerId") REFERENCES "AdContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE; 