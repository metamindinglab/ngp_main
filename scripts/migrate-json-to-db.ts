import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting migration...');

    // 1. Migrate Games
    console.log('Migrating games...');
    const gamesPath = path.join(__dirname, '../data/games.json');
    const gamesData = JSON.parse(await fs.readFile(gamesPath, 'utf-8'));
    for (const game of gamesData.games) {
      await prisma.game.upsert({
        where: { id: game.id },
        update: {
          name: game.name,
          description: game.description,
          genre: game.genre,
          robloxLink: game.robloxLink,
          thumbnail: game.thumbnail,
          metrics: game.metrics,
          dates: game.dates,
          owner: game.owner,
          updatedAt: game.dates?.lastUpdated ? new Date(game.dates.lastUpdated) : undefined,
        },
        create: {
          id: game.id,
          name: game.name,
          description: game.description,
          genre: game.genre,
          robloxLink: game.robloxLink,
          thumbnail: game.thumbnail,
          metrics: game.metrics,
          dates: game.dates,
          owner: game.owner,
          createdAt: game.dates?.created ? new Date(game.dates.created) : undefined,
          updatedAt: game.dates?.lastUpdated ? new Date(game.dates.lastUpdated) : undefined,
        }
      });
    }
    console.log('Games migration complete!');

    // 2. Migrate Assets
    console.log('Migrating assets...');
    const assetsPath = path.join(__dirname, '../data/assets.json');
    const assetsData = JSON.parse(await fs.readFile(assetsPath, 'utf-8'));
    for (const asset of assetsData.assets) {
      await prisma.asset.upsert({
        where: { id: asset.id },
        update: {
          name: asset.name,
          type: asset.type,
          status: asset.status,
          robloxId: asset.robloxId,
          creator: asset.creator,
          metadata: asset.metadata,
          versions: asset.versions,
          relationships: asset.relationships,
          updatedAt: asset.updatedAt ? new Date(asset.updatedAt) : undefined,
        },
        create: {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          status: asset.status,
          robloxId: asset.robloxId,
          creator: asset.creator,
          metadata: asset.metadata,
          versions: asset.versions,
          relationships: asset.relationships,
          createdAt: asset.createdAt ? new Date(asset.createdAt) : undefined,
          updatedAt: asset.updatedAt ? new Date(asset.updatedAt) : undefined,
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
          schedule: {},
          targeting: {},
          metrics: {},
          updatedAt: ad.updatedAt ? new Date(ad.updatedAt) : undefined,
        },
        create: {
          id: ad.id,
          gameId: ad.gameId || 'game_001', // Default game ID if not specified
          name: ad.name,
          type: ad.templateType,
          status: 'active', // Default status
          schedule: {},
          targeting: {},
          metrics: {},
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
          metrics: perf.metrics,
          demographics: perf.demographics,
          engagements: perf.engagements,
          playerDetails: perf.playerDetails,
          timeDistribution: perf.timeDistribution,
          performanceTrends: perf.performanceTrends,
          updatedAt: new Date(),
        },
        create: {
          id: perf.id,
          gameAdId: perf.gameAdId,
          gameId: perf.gameId,
          playlistId: perf.playlistId,
          date: new Date(perf.date),
          metrics: perf.metrics,
          demographics: perf.demographics,
          engagements: perf.engagements,
          playerDetails: perf.playerDetails,
          timeDistribution: perf.timeDistribution,
          performanceTrends: perf.performanceTrends,
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
      await prisma.removableAssets.upsert({
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