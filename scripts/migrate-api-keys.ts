import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateApiKeys() {
  try {
    console.log('🔄 Starting API key migration...')
    
    // Get all games with existing API keys
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { serverApiKey: { not: null } },
          { serverApiKeyCreatedAt: { not: null } },
          { serverApiKeyStatus: { not: null } }
        ]
      }
    })
    
    console.log(`📋 Found ${games.length} games with existing API keys`)
    
    // Migrate each game's API key data
    for (const game of games) {
      try {
        await prisma.game.update({
          where: { id: game.id },
          data: {
            serverApiKey: game.serverApiKey,
            serverApiKeyCreatedAt: game.serverApiKeyCreatedAt,
            serverApiKeyStatus: game.serverApiKeyStatus,
          }
        })
        console.log(`✅ Migrated API key for: ${game.name} (${game.id})`)
      } catch (error) {
        console.error(`❌ Failed to migrate API key for ${game.id}:`, error)
      }
    }
    
    console.log('✨ API key migration completed!')
    
  } catch (error) {
    console.error('💥 API key migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  migrateApiKeys()
}

export default migrateApiKeys 