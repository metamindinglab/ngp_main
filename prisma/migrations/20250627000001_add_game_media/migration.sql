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

    CONSTRAINT "GameMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameMedia_gameId_idx" ON "GameMedia"("gameId");

-- AddForeignKey
ALTER TABLE "GameMedia" ADD CONSTRAINT "GameMedia_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE; 