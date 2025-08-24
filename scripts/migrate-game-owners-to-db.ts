import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface JsonGameOwnerUser {
  id: string
  gameOwnerId: string
  email: string
  passwordHash: string
  name: string
  country: string
  discordId?: string
  isActive: boolean
  emailVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

async function migrateGameOwnersToDb() {
  console.log('🚀 Starting Game Owner migration from JSON to PostgreSQL...\n')
  
  try {
    // 1. Load game owners from JSON
    const usersPath = join(process.cwd(), 'data/game-owner-users.json')
    const content = await readFile(usersPath, 'utf8')
    const data: { users: JsonGameOwnerUser[] } = JSON.parse(content)
    
    console.log(`📊 Found ${data.users.length} game owners in JSON`)
    
    // 2. Migrate each game owner to the database
    let migrated = 0
    for (const user of data.users) {
      try {
        // Create or update game owner in database
        await prisma.gameOwner.upsert({
          where: { id: user.gameOwnerId }, // Use gameOwnerId as the primary key
          update: {
            email: user.email.toLowerCase(),
            name: user.name,
            password: user.passwordHash, // Keep the existing bcrypt hash
            updatedAt: new Date(user.updatedAt)
          },
          create: {
            id: user.gameOwnerId, // Use gameOwnerId as the primary key
            email: user.email.toLowerCase(),
            name: user.name,
            password: user.passwordHash, // Keep the existing bcrypt hash
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        })
        
        // Update any games owned by this user
        await prisma.game.updateMany({
          where: { gameOwnerId: user.gameOwnerId },
          data: {
            owner: {
              name: user.name,
              email: user.email,
              country: user.country,
              discordId: user.discordId
            }
          }
        })
        
        migrated++
        console.log(`✅ Migrated game owner: ${user.name} (${user.email})`)
      } catch (error) {
        console.error(`❌ Failed to migrate game owner ${user.email}:`, error)
      }
    }
    
    console.log(`\n📊 Migration Summary:`)
    console.log(`Total game owners in JSON: ${data.users.length}`)
    console.log(`Successfully migrated: ${migrated}`)
    
    // 3. Verify the migration
    const dbUsers = await prisma.gameOwner.findMany()
    console.log(`Game owners in database: ${dbUsers.length}`)
    
    // 4. Check game ownership
    for (const dbUser of dbUsers) {
      const games = await prisma.game.findMany({
        where: { gameOwnerId: dbUser.id }
      })
      console.log(`  - ${dbUser.name} (${dbUser.email}): ${games.length} games`)
      games.forEach(game => {
        console.log(`    • ${game.name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration if called directly
if (require.main === module) {
  migrateGameOwnersToDb().catch(console.error)
} 