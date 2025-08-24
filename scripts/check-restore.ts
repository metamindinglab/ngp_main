import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkRestore() {
  try {
    console.log("Checking restored data...");
    
    const [assets, gameAds, gameMedia, gameAdPerformance] = await Promise.all([
      prisma.asset.findMany(),
      prisma.gameAd.findMany(),
      prisma.gameMedia.findMany(),
      prisma.gameAdPerformance.findMany()
    ]);

    console.log("\nRestored record counts:");
    console.log("- Assets:", assets.length);
    console.log("- Game Ads:", gameAds.length);
    console.log("- Game Media:", gameMedia.length);
    console.log("- Game Ad Performance:", gameAdPerformance.length);

    // Check relationships
    console.log("\nChecking relationships...");
    
    // Check game media relationships
    for (const media of gameMedia) {
      const game = await prisma.game.findUnique({ where: { id: media.gameId } });
      if (!game) {
        console.warn(`Warning: Game media ${media.id} references non-existent game ${media.gameId}`);
      }
    }

    // Check game ad relationships
    for (const ad of gameAds) {
      const game = await prisma.game.findUnique({ where: { id: ad.gameId } });
      if (!game) {
        console.warn(`Warning: Game ad ${ad.id} references non-existent game ${ad.gameId}`);
      }
    }

    // Check game ad performance relationships
    for (const perf of gameAdPerformance) {
      const gameAd = await prisma.gameAd.findUnique({ where: { id: perf.gameAdId } });
      if (!gameAd) {
        console.warn(`Warning: Game ad performance ${perf.id} references non-existent game ad ${perf.gameAdId}`);
      }
    }

    // Check asset-game relationships
    for (const asset of assets) {
      const games = await prisma.game.findMany({
        where: {
          assets: {
            some: {
              id: asset.id
            }
          }
        }
      });
      if (games.length === 0) {
        console.warn(`Warning: Asset ${asset.id} is not connected to any games`);
      }
    }

    console.log("\nCheck completed!");
  } catch (error) {
    console.error("Error during check:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkRestore(); 