import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function backupData() {
  try {
    console.log("Starting data backup...");
    
    // Create backups directory if it doesn't exist
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Fetch all data from affected tables
    const [assets, gameAdPerformance, gameMedia] = await Promise.all([
      prisma.asset.findMany(),
      prisma.gameAdPerformance.findMany(),
      prisma.gameMedia.findMany(),
    ]);

    const backup = {
      assets,
      gameAdPerformance,
      gameMedia,
      timestamp: new Date().toISOString(),
    };

    // Save backup to file
    const backupPath = path.join(backupDir, `backup_${backup.timestamp.replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`Backup completed successfully! File saved at: ${backupPath}`);
  } catch (error) {
    console.error("Error during backup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupData(); 