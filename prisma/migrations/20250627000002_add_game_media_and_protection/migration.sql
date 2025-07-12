-- Add foreign key constraints with ON DELETE RESTRICT
ALTER TABLE "GameAd" DROP CONSTRAINT IF EXISTS "GameAd_gameId_fkey";
ALTER TABLE "GameAd" ADD CONSTRAINT "GameAd_gameId_fkey" 
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GameAdPerformance" DROP CONSTRAINT IF EXISTS "GameAdPerformance_gameAdId_fkey";
ALTER TABLE "GameAdPerformance" ADD CONSTRAINT "GameAdPerformance_gameAdId_fkey" 
  FOREIGN KEY ("gameAdId") REFERENCES "GameAd"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 