-- DropIndex
DROP INDEX "_GameToAds_AB_unique";

-- DropIndex
DROP INDEX "_GameToAds_A_idx";

-- AlterTable
ALTER TABLE "GameAd" ALTER COLUMN "gameId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "GameAd" ADD CONSTRAINT "GameAd_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "GameAdPerformance_ad_game_day_idx" RENAME TO "GameAdPerformance_gameAdId_gameId_date_idx";

-- RenameIndex
ALTER INDEX "GameDeployment_schedule_game_unique" RENAME TO "GameDeployment_scheduleId_gameId_key";

