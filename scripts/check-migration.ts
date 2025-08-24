import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\nChecking migration results...\n');

    // Check Games
    const games = await prisma.game.findMany();
    console.log(`Games in database: ${games.length}`);
    
    // Check Assets
    const assets = await prisma.asset.findMany();
    console.log(`Assets in database: ${assets.length}`);
    
    // Check Playlists
    const playlists = await prisma.playlist.findMany();
    console.log(`Playlists in database: ${playlists.length}`);
    
    // Check Game Ads
    const gameAds = await prisma.gameAd.findMany();
    console.log(`Game Ads in database: ${gameAds.length}`);
    
    // Check Game Ad Performance
    const gameAdPerformance = await prisma.gameAdPerformance.findMany();
    console.log(`Game Ad Performance records in database: ${gameAdPerformance.length}`);
    
    // Check Removable Assets
    const removableAssets = await prisma.removableAsset.findMany();
    console.log(`Removable Assets in database: ${removableAssets.length}`);

    // Print a sample from each table
    if (games.length > 0) {
      console.log('\nSample Game:', JSON.stringify(games[0], null, 2));
    }
    if (assets.length > 0) {
      console.log('\nSample Asset:', JSON.stringify(assets[0], null, 2));
    }
    if (playlists.length > 0) {
      console.log('\nSample Playlist:', JSON.stringify(playlists[0], null, 2));
    }
    if (gameAds.length > 0) {
      console.log('\nSample Game Ad:', JSON.stringify(gameAds[0], null, 2));
    }
    if (gameAdPerformance.length > 0) {
      console.log('\nSample Game Ad Performance:', JSON.stringify(gameAdPerformance[0], null, 2));
    }
    if (removableAssets.length > 0) {
      console.log('\nSample Removable Asset:', JSON.stringify(removableAssets[0], null, 2));
    }

  } catch (error) {
    console.error('Error checking migration:', error);
    throw error;
  }
}

main()
  .then(async () => {
    console.log('\nCheck complete! Disconnecting from database...');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during check:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 