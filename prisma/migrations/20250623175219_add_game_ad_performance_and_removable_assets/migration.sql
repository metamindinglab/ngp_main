-- CreateTable
CREATE TABLE "GameAdPerformance" (
    "id" TEXT NOT NULL,
    "gameAdId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playlistId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "demographics" JSONB NOT NULL,
    "engagements" JSONB NOT NULL,
    "playerDetails" JSONB NOT NULL,
    "timeDistribution" JSONB NOT NULL,
    "performanceTrends" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameAdPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemovableAsset" (
    "id" TEXT NOT NULL,
    "robloxAssetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "replacedBy" TEXT,
    "reason" TEXT NOT NULL,
    "dateMarkedRemovable" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemovableAsset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GameAdPerformance" ADD CONSTRAINT "GameAdPerformance_gameAdId_fkey" FOREIGN KEY ("gameAdId") REFERENCES "GameAd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
