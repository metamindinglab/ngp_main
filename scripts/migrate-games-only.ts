import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Environment check
if (process.env.NODE_ENV === 'production') {
  console.error('❌ This script cannot be run in production');
  process.exit(1);
}

const prisma = new PrismaClient()

interface GameData {
  id: string
  name: string
  description?: string
  genre?: string
  robloxLink?: string
  thumbnail?: string
  metrics?: any
  dates?: any
  owner?: any
  authorization?: any
  robloxInfo?: any
}

interface GamesDatabase {
  version: string
  lastUpdated: string
  games: GameData[]
}

async function migrateGames(clearExisting: boolean = false) {
  try {
    console.log('🚀 Starting migration from JSON to database...')
    
    // Read the JSON file
    const gamesPath = join(process.cwd(), 'data/games.json')
    const content = await readFile(gamesPath, 'utf8')
    const data: GamesDatabase = JSON.parse(content)
    
    console.log(`📋 Found ${data.games.length} games to migrate`)
    
    // Clear existing games only if explicitly requested
    if (clearExisting) {
      await prisma.game.deleteMany()
      console.log('🗑️  Cleared existing games from database')
    }
    
    // Insert each game
    let successCount = 0
    for (const game of data.games) {
      try {
        await prisma.game.create({
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
        })
        console.log(`✅ Migrated: ${game.name} (${game.id})`)
        successCount++
      } catch (error) {
        console.error(`❌ Failed to migrate ${game.id}:`, error)
      }
    }
    
    // Verify migration
    const totalCount = await prisma.game.count()
    console.log(`\n🎉 Migration complete! ${successCount}/${data.games.length} games migrated successfully.`)
    console.log(`📊 Total games in database: ${totalCount}`)
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateGames().catch(console.error) 