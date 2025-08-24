import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAllTables() {
  try {
    console.log('Checking all tables...\n')
    
    // Check Asset table
    const assets = await prisma.asset.findMany()
    console.log(`Assets: ${assets.length} records`)
    
    // Check Game table
    const games = await prisma.game.findMany()
    console.log(`Games: ${games.length} records`)
    
    // Check GameAd table
    const gameAds = await prisma.gameAd.findMany()
    console.log(`GameAds: ${gameAds.length} records`)
    
    // Check GameAdContainer table
    const containers = await prisma.adContainer.findMany()
    console.log(`GameAdContainers: ${containers.length} records`)
    
    // Check GameAdPerformance table
    const performances = await prisma.gameAdPerformance.findMany()
    console.log(`GameAdPerformances: ${performances.length} records`)
    
    // Check GameMedia table
    const media = await prisma.gameMedia.findMany()
    console.log(`GameMedia: ${media.length} records`)
    
    // Check GameOwner table
    const owners = await prisma.gameOwner.findMany()
    console.log(`GameOwners: ${owners.length} records`)
    
    // Check Playlist table
    const playlists = await prisma.playlist.findMany()
    console.log(`Playlists: ${playlists.length} records`)
    
    // Check PlaylistSchedule table
    const schedules = await prisma.playlistSchedule.findMany()
    console.log(`PlaylistSchedules: ${schedules.length} records`)
    
    // Check GameDeployment table
    const deployments = await prisma.gameDeployment.findMany()
    console.log(`GameDeployments: ${deployments.length} records`)
    
    // Check RemovableAsset table
    const removableAssets = await prisma.removableAsset.findMany()
    console.log(`RemovableAssets: ${removableAssets.length} records`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllTables() 