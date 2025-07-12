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

-- CreateIndex
CREATE INDEX "GameAdContainer_gameId_idx" ON "GameAdContainer"("gameId");

-- CreateIndex
CREATE INDEX "GameAdContainer_currentAdId_idx" ON "GameAdContainer"("currentAdId");

-- AddForeignKey
ALTER TABLE "GameAdContainer" ADD CONSTRAINT "GameAdContainer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAdContainer" ADD CONSTRAINT "GameAdContainer_currentAdId_fkey" FOREIGN KEY ("currentAdId") REFERENCES "GameAd"("id") ON DELETE SET NULL ON UPDATE CASCADE; 