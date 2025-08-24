/*
  Warnings:

  - A unique constraint covering the columns `[serverApiKey]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "gameOwnerId" TEXT,
ADD COLUMN     "robloxAuthorization" JSONB,
ADD COLUMN     "serverApiKey" TEXT,
ADD COLUMN     "serverApiKeyCreatedAt" TIMESTAMP(3),
ADD COLUMN     "serverApiKeyStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Game_serverApiKey_key" ON "Game"("serverApiKey");
