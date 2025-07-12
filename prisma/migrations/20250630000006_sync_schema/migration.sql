-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT,
    "robloxId" TEXT,
    "creator" JSONB,
    "metadata" JSONB,
    "versions" JSONB,
    "relationships" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT,
    "robloxLink" TEXT,
    "thumbnail" TEXT,
    "metrics" JSONB,
    "dates" JSONB,
    "owner" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameOwnerId" TEXT,
    "robloxAuthorization" JSONB,
    "serverApiKey" TEXT,
    "serverApiKeyCreatedAt" TIMESTAMP(3),
    "serverApiKeyStatus" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAd" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "schedule" JSONB,
    "targeting" JSONB,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assets" JSONB,
    "description" TEXT,

    CONSTRAINT "GameAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAdContainer" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "locationX" DOUBLE PRECISION NOT NULL,
    "locationY" DOUBLE PRECISION NOT NULL,
    "locationZ" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "currentAdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameAdContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAdPerformance" (
    "id" TEXT NOT NULL,
    "gameAdId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playlistId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB,
    "demographics" JSONB,
    "engagements" JSONB,
    "playerDetails" JSONB,
    "timeDistribution" JSONB,
    "performanceTrends" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameAdPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameMedia" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "localPath" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "robloxId" TEXT,
    "altText" TEXT,

    CONSTRAINT "GameMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameOwner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "createdBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemovableAsset" (
    "id" TEXT NOT NULL,
    "robloxAssetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "replacedBy" TEXT,
    "reason" TEXT,
    "dateMarkedRemovable" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemovableAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssetPlaylists" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssetPlaylists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GameAssets" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GameAssets_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GamePlaylists" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GamePlaylists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GameToAds" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GameToAds_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_serverApiKey_key" ON "Game"("serverApiKey");

-- CreateIndex
CREATE INDEX "GameAdContainer_currentAdId_idx" ON "GameAdContainer"("currentAdId");

-- CreateIndex
CREATE INDEX "GameAdContainer_gameId_idx" ON "GameAdContainer"("gameId");

-- CreateIndex
CREATE INDEX "GameMedia_gameId_idx" ON "GameMedia"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameOwner_email_key" ON "GameOwner"("email");

-- CreateIndex
CREATE INDEX "_AssetPlaylists_B_index" ON "_AssetPlaylists"("B");

-- CreateIndex
CREATE INDEX "_GameAssets_B_index" ON "_GameAssets"("B");

-- CreateIndex
CREATE INDEX "_GamePlaylists_B_index" ON "_GamePlaylists"("B");

-- CreateIndex
CREATE INDEX "_GameToAds_B_index" ON "_GameToAds"("B");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_gameOwnerId_fkey" FOREIGN KEY ("gameOwnerId") REFERENCES "GameOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAdContainer" ADD CONSTRAINT "GameAdContainer_currentAdId_fkey" FOREIGN KEY ("currentAdId") REFERENCES "GameAd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAdContainer" ADD CONSTRAINT "GameAdContainer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAdPerformance" ADD CONSTRAINT "GameAdPerformance_gameAdId_fkey" FOREIGN KEY ("gameAdId") REFERENCES "GameAd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameMedia" ADD CONSTRAINT "GameMedia_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetPlaylists" ADD CONSTRAINT "_AssetPlaylists_A_fkey" FOREIGN KEY ("A") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetPlaylists" ADD CONSTRAINT "_AssetPlaylists_B_fkey" FOREIGN KEY ("B") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameAssets" ADD CONSTRAINT "_GameAssets_A_fkey" FOREIGN KEY ("A") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameAssets" ADD CONSTRAINT "_GameAssets_B_fkey" FOREIGN KEY ("B") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GamePlaylists" ADD CONSTRAINT "_GamePlaylists_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GamePlaylists" ADD CONSTRAINT "_GamePlaylists_B_fkey" FOREIGN KEY ("B") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToAds" ADD CONSTRAINT "_GameToAds_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToAds" ADD CONSTRAINT "_GameToAds_B_fkey" FOREIGN KEY ("B") REFERENCES "GameAd"("id") ON DELETE CASCADE ON UPDATE CASCADE;

