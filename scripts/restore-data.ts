import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface BackupData {
  assets: any[];
  gameAdPerformance: any[];
  gameMedia: any[];
  timestamp: string;
}

async function restoreData(backupFilePath: string) {
  try {
    console.log("Starting data restoration...");
    
    // Read backup file
    const backupContent = fs.readFileSync(backupFilePath, 'utf-8');
    const backup: BackupData = JSON.parse(backupContent);

    // First, ensure all required games exist
    console.log("Ensuring games exist...");
    const uniqueGameIds = new Set([
      ...backup.gameAdPerformance.map(p => p.gameId),
      ...backup.assets.map(a => a.gameId),
      ...(backup.gameMedia || []).map(m => m.gameId)
    ].filter(Boolean));

    // Create a default game for assets without a game
    console.log("Creating default game...");
    const defaultGame = await prisma.game.upsert({
      where: { id: 'default_game' },
      create: {
        id: 'default_game',
        name: 'Default Game',
        description: 'Default game for restored assets',
        genre: 'Mixed'
      },
      update: {}
    });

    // Add default game to the list of games
    uniqueGameIds.add(defaultGame.id);

    for (const gameId of uniqueGameIds) {
      if (gameId === defaultGame.id) continue;
      try {
        await prisma.game.upsert({
          where: { id: gameId },
          create: { 
            id: gameId,
            name: `Game ${gameId}`,
            description: 'Restored game',
            genre: 'Unknown'
          },
          update: {}
        });
      } catch (error) {
        console.warn(`Warning: Could not create game ${gameId}:`, error);
      }
    }

    // Then ensure all game ads exist
    console.log("Ensuring game ads exist...");
    const uniqueGameAdIds = new Set(
      backup.gameAdPerformance.map(p => p.gameAdId).filter(Boolean)
    );

    for (const gameAdId of uniqueGameAdIds) {
      try {
        const relatedPerf = backup.gameAdPerformance.find(p => p.gameAdId === gameAdId);
        const gameId = relatedPerf?.gameId || Array.from(uniqueGameIds)[0] || '0';
        
        // First check if the game exists
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game) {
          await prisma.game.create({
            data: {
              id: gameId,
              name: `Game ${gameId}`,
              description: 'Restored game',
              genre: 'Unknown'
            }
          });
        }

        await prisma.gameAd.upsert({
          where: { id: gameAdId },
          create: {
            id: gameAdId,
            gameId: gameId,
            name: `Ad ${gameAdId}`,
            status: 'ACTIVE'
          },
          update: {}
        });
      } catch (error) {
        console.warn(`Warning: Could not create game ad ${gameAdId}:`, error);
      }
    }

    // Now restore assets
    console.log("Restoring assets...");
    const assetIds: string[] = [];
    for (const asset of backup.assets) {
      try {
        const { id, gameId, games, ...assetData } = asset;
        
        // First create the asset without any relationships
        await prisma.asset.upsert({
          where: { id },
          create: {
            ...assetData,
            id,
            name: assetData.name || `Asset ${id}`,
            status: assetData.status || 'PENDING',
            robloxId: assetData.robloxId || '0',
            games: {
              connect: [{ id: defaultGame.id }]
            }
          },
          update: {
            ...assetData,
            games: {
              connect: [{ id: defaultGame.id }]
            }
          }
        });

        assetIds.push(id);
      } catch (error) {
        console.warn(`Warning: Could not restore asset ${asset.id}:`, error);
      }
    }

    // Finally restore game ad performance
    console.log("Restoring game ad performance...");
    for (const perf of backup.gameAdPerformance) {
      try {
        const { id, ...perfData } = perf;
        
        // First check if the game ad exists
        const gameAd = await prisma.gameAd.findUnique({ where: { id: perfData.gameAdId } });
        if (!gameAd) {
          console.warn(`Warning: Game ad ${perfData.gameAdId} not found, skipping performance record ${id}`);
          continue;
        }

        // Ensure required fields are present and properly formatted
        const data = {
          ...perfData,
          gameId: perfData.gameId || Array.from(uniqueGameIds)[0] || '0',
          gameAdId: perfData.gameAdId || Array.from(uniqueGameAdIds)[0] || '0',
          date: perfData.date ? new Date(perfData.date) : new Date(),
          metrics: typeof perfData.metrics === 'string' ? perfData.metrics : JSON.stringify(perfData.metrics || {}),
          demographics: typeof perfData.demographics === 'string' ? perfData.demographics : JSON.stringify(perfData.demographics || {}),
          engagements: typeof perfData.engagements === 'string' ? perfData.engagements : JSON.stringify(perfData.engagements || {}),
          playerDetails: typeof perfData.playerDetails === 'string' ? perfData.playerDetails : JSON.stringify(perfData.playerDetails || {}),
          timeDistribution: typeof perfData.timeDistribution === 'string' ? perfData.timeDistribution : JSON.stringify(perfData.timeDistribution || {}),
          performanceTrends: typeof perfData.performanceTrends === 'string' ? perfData.performanceTrends : JSON.stringify(perfData.performanceTrends || {})
        };

        await prisma.gameAdPerformance.upsert({
          where: { id },
          create: {
            id,
            ...data
          },
          update: data
        });
      } catch (error) {
        console.warn(`Warning: Could not restore performance record ${perf.id}:`, error);
      }
    }

    // Finally restore game media
    if (backup.gameMedia && backup.gameMedia.length > 0) {
      console.log("Restoring game media...");
      for (const media of backup.gameMedia) {
        try {
          const { id, gameId, ...mediaData } = media;
          
          // First check if the game exists
          const game = await prisma.game.findUnique({ where: { id: gameId } });
          if (!game) {
            console.warn(`Warning: Game ${gameId} not found, skipping media ${id}`);
            continue;
          }

          await prisma.gameMedia.upsert({
            where: { id },
            create: {
              id,
              gameId,
              ...mediaData,
              type: mediaData.type || 'image',
              localPath: mediaData.localPath || '',
              approved: mediaData.approved !== false
            },
            update: mediaData
          });
        } catch (error) {
          console.warn(`Warning: Could not restore media ${media.id}:`, error);
        }
      }
    }

    console.log("Restoration completed successfully!");
  } catch (error) {
    console.error("Error during restoration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if backup file path is provided
const backupFilePath = process.argv[2];
if (!backupFilePath) {
  console.error("Please provide the backup file path as an argument");
  process.exit(1);
}

restoreData(backupFilePath); 