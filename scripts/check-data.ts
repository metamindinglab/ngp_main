import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log("Checking current data state...");
    
    const [assets, gameAdPerf] = await Promise.all([
      prisma.asset.findMany(),
      prisma.gameAdPerformance.findMany(),
    ]);

    console.log("Current data counts:");
    console.log("- Assets:", assets.length);
    console.log("- Game Ad Performance:", gameAdPerf.length);
    
    // Check for potential data issues
    const assetsWithMissingFields = assets.filter(a => !a.robloxId || !a.status);
    const perfWithMissingFields = gameAdPerf.filter(p => {
      const metrics = p.metrics as any;
      return !metrics || !metrics.impressions || !metrics.clicks;
    });

    if (assetsWithMissingFields.length > 0) {
      console.log("\nFound assets with missing fields:", assetsWithMissingFields.length);
    }
    
    if (perfWithMissingFields.length > 0) {
      console.log("\nFound performance records with missing metrics:", perfWithMissingFields.length);
    }

  } catch (error) {
    console.error("Error checking data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 