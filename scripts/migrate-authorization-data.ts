import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

interface GameData {
  id: string
  name: string
  authorization?: {
    type: 'api_key' | 'oauth'
    apiKey?: string
    clientId?: string
    clientSecret?: string
    lastVerified?: string
    status: 'active' | 'expired' | 'invalid' | 'unverified'
  }
}

interface GamesDatabase {
  version: string
  lastUpdated: string
  games: GameData[]
}

async function migrateAuthorizationData() {
  try {
    console.log('🔄 Starting authorization data migration...')
    
    // Read the JSON file to get authorization data
    const gamesPath = join(process.cwd(), 'data/games.json')
    const content = await readFile(gamesPath, 'utf8')
    const data: GamesDatabase = JSON.parse(content)
    
    console.log(`📋 Found ${data.games.length} games in JSON file`)
    
    // Migrate authorization data for each game
    let migratedCount = 0
    for (const game of data.games) {
      if (game.authorization) {
        try {
          await prisma.game.update({
            where: { id: game.id },
            data: {
              robloxAuthorization: game.authorization
            }
          })
          console.log(`✅ Migrated authorization for: ${game.name} (${game.id})`)
          migratedCount++
        } catch (error) {
          console.error(`❌ Failed to migrate authorization for ${game.id}:`, error)
        }
      }
    }
    
    console.log(`✨ Authorization migration completed! ${migratedCount} games updated.`)
    
  } catch (error) {
    console.error('💥 Authorization migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  migrateAuthorizationData()
}

export default migrateAuthorizationData 