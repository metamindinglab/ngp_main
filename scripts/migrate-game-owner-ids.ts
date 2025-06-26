import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { jsonAuthService } from '../src/lib/json-auth'

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
  owner?: {
    name?: string
    email?: string
    country?: string
    discordId?: string
  }
  authorization?: any
}

async function migrateGameOwnerIds() {
  console.log('🔄 Starting Game Owner ID migration...\n')
  
  try {
    // 1. Load games from JSON to understand owner relationships
    const gamesJsonPath = join(process.cwd(), 'data/games.json')
    const gamesJsonData = await readFile(gamesJsonPath, 'utf-8')
    const gamesJson = JSON.parse(gamesJsonData)
    
    // 2. Get all existing database games
    const dbGames = await prisma.game.findMany()
    console.log(`📊 Found ${dbGames.length} games in database`)
    
    // 3. Get all existing game owner users
    const existingUsers = await jsonAuthService.getAllUsers()
    console.log(`👥 Found ${existingUsers.length} existing game owner users`)
    
    // 4. Create a map of email to gameOwnerId for existing users
    const emailToGameOwnerIdMap = new Map()
    existingUsers.forEach(user => {
      emailToGameOwnerIdMap.set(user.email.toLowerCase(), user.gameOwnerId)
    })
    
    // 5. Process each game and create missing users as needed
    for (const jsonGame of gamesJson.games) {
      const dbGame = dbGames.find(g => g.id === jsonGame.id)
      if (!dbGame) continue
      
      const ownerEmail = jsonGame.owner?.email
      if (!ownerEmail) {
        console.log(`⚠️  Game ${jsonGame.name} has no owner email, skipping...`)
        continue
      }
      
      let gameOwnerId = emailToGameOwnerIdMap.get(ownerEmail.toLowerCase())
      
      // If user doesn't exist, create them
      if (!gameOwnerId) {
        console.log(`👤 Creating new game owner for email: ${ownerEmail}`)
        
        const registerResult = await jsonAuthService.registerUser(
          ownerEmail,
          'temppassword123', // They can reset this later
          jsonGame.owner?.name || 'Game Owner',
          jsonGame.owner?.country || '',
          jsonGame.owner?.discordId
        )
        
        if (registerResult.success && registerResult.user) {
          gameOwnerId = registerResult.user.gameOwnerId
          emailToGameOwnerIdMap.set(ownerEmail.toLowerCase(), gameOwnerId)
          console.log(`✅ Created user with gameOwnerId: ${gameOwnerId}`)
        } else {
          console.log(`❌ Failed to create user for ${ownerEmail}: ${registerResult.error}`)
          continue
        }
      }
      
      // Update the game with the gameOwnerId
      if (gameOwnerId) {
        await prisma.game.update({
          where: { id: dbGame.id },
          data: { gameOwnerId }
        })
        console.log(`🔗 Mapped game "${jsonGame.name}" to gameOwnerId: ${gameOwnerId}`)
      }
    }
    
    // 6. Verify the migration
    const updatedGames = await prisma.game.findMany({
      where: {
        gameOwnerId: { not: null }
      }
    })
    
    console.log(`\n✅ Migration completed successfully!`)
    console.log(`📊 Games with gameOwnerId: ${updatedGames.length}/${dbGames.length}`)
    
    // 7. Show summary
    const allUsers = await jsonAuthService.getAllUsers()
    console.log(`\n👥 Game Owner Summary:`)
    for (const user of allUsers) {
      const userGames = await prisma.game.findMany({
        where: { gameOwnerId: user.gameOwnerId }
      })
      console.log(`  - ${user.name} (${user.email}): ${userGames.length} games`)
      userGames.forEach(game => {
        console.log(`    • ${game.name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  migrateGameOwnerIds()
} 