import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

async function restoreDatabase(backupFile: string) {
  try {
    console.log('🚀 Starting database restore...')

    // Read backup file
    const content = await readFile(backupFile, 'utf8')
    const backup = JSON.parse(content)

    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await prisma.gameAdPerformance.deleteMany()
    await prisma.adContainer.deleteMany()
    await prisma.gameAd.deleteMany()
    await prisma.gameMedia.deleteMany()
    await prisma.game.deleteMany()
    await prisma.gameOwner.deleteMany()
    await prisma.asset.deleteMany()
    await prisma.playlist.deleteMany()

    // Restore data
    console.log('📥 Restoring data...')
    
    // Restore game owners first
    for (const gameOwner of backup.data.gameOwners) {
      await prisma.gameOwner.create({ data: gameOwner })
    }
    
    // Restore games
    for (const game of backup.data.games) {
      await prisma.game.create({ data: game })
    }
    
    // Restore assets
    for (const asset of backup.data.assets) {
      await prisma.asset.create({ data: asset })
    }
    
    // Restore playlists
    for (const playlist of backup.data.playlists) {
      await prisma.playlist.create({ data: playlist })
    }
    
    // Restore game ads
    for (const gameAd of backup.data.gameAds) {
      await prisma.gameAd.create({ data: gameAd })
    }
    
    // Restore game ad containers
    for (const container of backup.data.gameAdContainers) {
      await prisma.adContainer.create({ data: container })
    }
    
    // Restore game ad performance
    for (const performance of backup.data.gameAdPerformance) {
      await prisma.gameAdPerformance.create({ data: performance })
    }
    
    // Restore game media
    for (const media of backup.data.gameMedia) {
      await prisma.gameMedia.create({ data: media })
    }

    console.log('✅ Database restored successfully!')
  } catch (error) {
    console.error('❌ Restore failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get backup file from command line argument
const backupFile = process.argv[2]
if (!backupFile) {
  console.error('Please provide the backup file path')
  console.error('Usage: npx ts-node restore-database.ts <backup_file>')
  process.exit(1)
}

// Run restore
restoreDatabase(backupFile).catch(console.error)
