import { PrismaClient } from '@prisma/client'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function backupDatabase() {
  try {
    console.log('🚀 Starting database backup...')

    // Create backup directory if it doesn't exist
    const backupDir = join(process.cwd(), 'backup')
    await mkdir(backupDir, { recursive: true })

    // Create backup file name with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = join(backupDir, `${timestamp}_clean_db.json`)

    // Get all data from each table
    const gameOwners = await prisma.gameOwner.findMany()
    const games = await prisma.game.findMany()
    const assets = await prisma.asset.findMany()
    const gameAds = await prisma.gameAd.findMany()
    const gameAdContainers = await prisma.adContainer.findMany()
    const gameAdPerformance = await prisma.gameAdPerformance.findMany()
    const gameMedia = await prisma.gameMedia.findMany()
    const playlists = await prisma.playlist.findMany()

    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        gameOwners,
        games,
        assets,
        gameAds,
        gameAdContainers,
        gameAdPerformance,
        gameMedia,
        playlists
      }
    }

    // Save backup to file
    await writeFile(backupFile, JSON.stringify(backup, null, 2))
    
    console.log(`✅ Backup completed successfully!`)
    console.log(`📁 Backup file: ${backupFile}`)

    // Create restore script
    const restoreScript = `import { PrismaClient } from '@prisma/client'
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
    await prisma.gameAdContainer.deleteMany()
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
      await prisma.gameAdContainer.create({ data: container })
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
`

    // Save restore script
    const restoreScriptPath = join(backupDir, 'restore-database.ts')
    await writeFile(restoreScriptPath, restoreScript)

    console.log(`\n📝 Created restore script: ${restoreScriptPath}`)
    console.log('To restore the database, run:')
    console.log(`npx ts-node backup/restore-database.ts backup/<backup_file>`)

  } catch (error) {
    console.error('❌ Backup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run backup if called directly
if (require.main === module) {
  backupDatabase().catch(console.error)
} 