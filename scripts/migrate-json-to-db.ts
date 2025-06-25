import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface GameData {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  robloxLink?: string;
  thumbnail?: string;
  metrics?: any;
  dates?: any;
  owner?: any;
  authorization?: any;
  robloxInfo?: any;
}

interface GamesDatabase {
  version: string;
  lastUpdated: string;
  games: GameData[];
}

async function migrateGamesToDatabase() {
  try {
    console.log('Starting migration from JSON to database...');
    
    // Read the JSON file
    const gamesPath = path.join(process.cwd(), 'data/games.json');
    const content = await fs.readFile(gamesPath, 'utf8');
    const data: GamesDatabase = JSON.parse(content);
    
    console.log(`Found ${data.games.length} games to migrate`);
    
    // Clear existing games (optional - remove if you want to keep existing data)
    await prisma.game.deleteMany();
    console.log('Cleared existing games from database');
    
    // Insert each game
    for (const game of data.games) {
      try {
        const newGame = await prisma.game.create({
          data: {
            id: game.id,
            name: game.name,
            description: game.description || null,
            genre: game.genre || null,
            robloxLink: game.robloxLink || null,
            thumbnail: game.thumbnail || null,
            metrics: game.metrics || null,
            dates: game.dates || null,
            owner: game.owner || null,
            // Handle authorization data
            robloxAuthorization: game.authorization || null,
            // Handle API key from authorization field if it exists
            serverApiKey: game.authorization?.apiKey || null,
            serverApiKeyStatus: game.authorization?.status || null,
            serverApiKeyCreatedAt: game.authorization?.apiKey ? new Date() : null,
          }
        });
        console.log(`✓ Migrated game: ${game.name} (${game.id})`);
      } catch (error) {
        console.error(`✗ Failed to migrate game ${game.id}:`, error);
      }
    }
    
    // Verify migration
    const count = await prisma.game.count();
    console.log(`\nMigration complete! ${count} games now in database.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateGamesToDatabase();

async function main() {
  try {
    console.log('Starting migration...');

    // 1. Migrate Games
    console.log('Migrating games...');
    await migrateGamesToDatabase();
    console.log('Games migration complete!');

    // 2. Migrate Assets
    console.log('Migrating assets...');
    const assetsPath = path.join(__dirname, '../data/assets.json');
    const assetsData = JSON.parse(await fs.readFile(assetsPath, 'utf-8'));
    for (const asset of assetsData.assets) {
      // Prepare metadata object to store additional fields
      const metadata: any = {
        description: asset.description,
        tags: asset.tags,
        assetType: asset.assetType,
        image: asset.image,
        previewImage: asset.previewImage,
        compatibility: asset.compatibility,
        brands: asset.brands,
        size: asset.size,
        characterType: asset.characterType,
        appearance: asset.appearance,
        personality: asset.personality,
        defaultAnimations: asset.defaultAnimations,
        suitableFor: asset.suitableFor,
        marketingCapabilities: asset.marketingCapabilities,
        difficulty: asset.difficulty,
        maxPlayers: asset.maxPlayers,
        gameplayDuration: asset.gameplayDuration,
        customizableElements: asset.customizableElements,
        duration: asset.duration,
        category: asset.category,
        previewUrl: asset.previewUrl,
        url: asset.url,
        dimensions: asset.dimensions,
        fileFormat: asset.fileFormat,
        fileSize: asset.fileSize
      };

      // Clean up metadata by removing undefined values
      Object.keys(metadata).forEach(key => {
        if (metadata[key] === undefined) {
          delete metadata[key];
        }
      });

      await prisma.asset.upsert({
        where: { id: asset.id },
        update: {
          name: asset.name,
          type: asset.type || asset.assetType,
          status: 'active',
          robloxId: asset.robloxAssetId,
          metadata: metadata,
          updatedAt: asset.updatedAt ? new Date(asset.updatedAt) : new Date(),
        },
        create: {
          id: asset.id,
          name: asset.name,
          type: asset.type || asset.assetType,
          status: 'active',
          robloxId: asset.robloxAssetId,
          metadata: metadata,
          createdAt: asset.createdAt ? new Date(asset.createdAt) : new Date(),
          updatedAt: asset.updatedAt ? new Date(asset.updatedAt) : new Date(),
        }
      });
    }
    console.log('Assets migration complete!');

    // 3. Migrate Playlists
    console.log('Migrating playlists...');
    const playlistsPath = path.join(__dirname, '../data/playlists.json');
    const playlistsData = JSON.parse(await fs.readFile(playlistsPath, 'utf-8'));
    for (const playlist of playlistsData.playlists) {
      await prisma.playlist.upsert({
        where: { id: playlist.id },
        update: {
          name: playlist.name,
          description: playlist.description,
          type: playlist.type,
          createdBy: playlist.createdBy,
          metadata: playlist.metadata,
          updatedAt: playlist.updatedAt ? new Date(playlist.updatedAt) : undefined,
        },
        create: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          type: playlist.type,
          createdBy: playlist.createdBy,
          metadata: playlist.metadata,
          createdAt: playlist.createdAt ? new Date(playlist.createdAt) : undefined,
          updatedAt: playlist.updatedAt ? new Date(playlist.updatedAt) : undefined,
        }
      });
    }
    console.log('Playlists migration complete!');

    // 4. Migrate Game Ads
    console.log('Migrating game ads...');
    const adsPath = path.join(__dirname, '../data/game-ads.json');
    const adsData = JSON.parse(await fs.readFile(adsPath, 'utf-8'));
    for (const ad of adsData.gameAds) {
      await prisma.gameAd.upsert({
        where: { id: ad.id },
        update: {
          gameId: ad.gameId || 'game_001', // Default game ID if not specified
          name: ad.name,
          type: ad.templateType,
          status: 'active', // Default status
          schedule: ad.schedule || null,
          targeting: ad.targeting || null,
          metrics: ad.metrics || null,
          assets: ad.assets || null,
          updatedAt: ad.updatedAt ? new Date(ad.updatedAt) : undefined,
        },
        create: {
          id: ad.id,
          gameId: ad.gameId || 'game_001', // Default game ID if not specified
          name: ad.name,
          type: ad.templateType,
          status: 'active', // Default status
          schedule: ad.schedule || null,
          targeting: ad.targeting || null,
          metrics: ad.metrics || null,
          assets: ad.assets || null,
          createdAt: ad.createdAt ? new Date(ad.createdAt) : undefined,
          updatedAt: ad.updatedAt ? new Date(ad.updatedAt) : undefined,
        }
      });
    }
    console.log('Game ads migration complete!');

    // 5. Migrate Game Ad Performance
    console.log('Migrating game ad performance...');
    const performancePath = path.join(__dirname, '../data/game-ad-performance.json');
    const performanceData = JSON.parse(await fs.readFile(performancePath, 'utf-8'));
    for (const perf of performanceData.performanceData) {
      await prisma.gameAdPerformance.upsert({
        where: { id: perf.id },
        update: {
          gameAdId: perf.gameAdId,
          gameId: perf.gameId,
          playlistId: perf.playlistId,
          date: new Date(perf.date),
          metrics: typeof perf.metrics === 'object' ? perf.metrics : null,
          demographics: typeof perf.demographics === 'object' ? perf.demographics : null,
          engagements: typeof perf.engagements === 'object' ? perf.engagements : null,
          playerDetails: typeof perf.playerDetails === 'object' ? perf.playerDetails : null,
          timeDistribution: typeof perf.timeDistribution === 'object' ? perf.timeDistribution : null,
          performanceTrends: typeof perf.performanceTrends === 'object' ? perf.performanceTrends : null,
          updatedAt: new Date(),
        },
        create: {
          id: perf.id,
          gameAdId: perf.gameAdId,
          gameId: perf.gameId,
          playlistId: perf.playlistId,
          date: new Date(perf.date),
          metrics: typeof perf.metrics === 'object' ? perf.metrics : null,
          demographics: typeof perf.demographics === 'object' ? perf.demographics : null,
          engagements: typeof perf.engagements === 'object' ? perf.engagements : null,
          playerDetails: typeof perf.playerDetails === 'object' ? perf.playerDetails : null,
          timeDistribution: typeof perf.timeDistribution === 'object' ? perf.timeDistribution : null,
          performanceTrends: typeof perf.performanceTrends === 'object' ? perf.performanceTrends : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
    }
    console.log('Game ad performance migration complete!');

    // 6. Migrate Removable Assets
    console.log('Migrating removable assets...');
    const removablePath = path.join(__dirname, '../data/removable-assets.json');
    const removableData = JSON.parse(await fs.readFile(removablePath, 'utf-8'));
    for (const asset of removableData.removableAssets) {
      await prisma.removableAsset.upsert({
        where: { id: asset.id },
        update: {
          robloxAssetId: asset.robloxAssetId,
          name: asset.name,
          replacedBy: asset.replacedBy || null,
          reason: asset.reason,
          dateMarkedRemovable: new Date(asset.dateMarkedRemovable),
          updatedAt: new Date(),
        },
        create: {
          id: asset.id,
          robloxAssetId: asset.robloxAssetId,
          name: asset.name,
          replacedBy: asset.replacedBy || null,
          reason: asset.reason,
          dateMarkedRemovable: new Date(asset.dateMarkedRemovable),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
    }
    console.log('Removable assets migration complete!');

    // Note: sample-data.json is not migrated as it appears to be example data
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

main()
  .then(async () => {
    console.log('Migration complete! Disconnecting from database...');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during migration:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 