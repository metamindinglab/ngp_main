import { PrismaClient } from '@prisma/client'
import { jsonAuthService } from '../src/lib/json-auth'

const prisma = new PrismaClient()

async function debugGameOwnership() {
  console.log('🔍 Debugging Game Ownership Issues...\n')
  
  try {
    // Check all games and their gameOwnerIds
    const games = await prisma.game.findMany({
      select: { id: true, name: true, gameOwnerId: true }
    })
    
    console.log('📊 Current game ownership mapping:')
    games.forEach(game => {
      console.log(`Game: ${game.name} -> gameOwnerId: ${game.gameOwnerId || 'NULL'}`)
    })
    
    // Check all users and their gameOwnerIds
    const users = await jsonAuthService.getAllUsers()
    console.log('\n👥 Current users and their gameOwnerIds:')
    users.forEach(user => {
      console.log(`User: ${user.name} (${user.email}) -> gameOwnerId: ${user.gameOwnerId}`)
    })
    
    // Check the specific user mentioned in the bug report
    const ardyUser = users.find(u => u.name === 'Ardy Lee' || u.email === 'info@metamindinglab.com')
    if (ardyUser) {
      console.log(`\n🎯 Found Ardy Lee: gameOwnerId = ${ardyUser.gameOwnerId}`)
      
      const ardyGames = await prisma.game.findMany({
        where: { gameOwnerId: ardyUser.gameOwnerId }
      })
      console.log(`Games for Ardy Lee: ${ardyGames.length}`)
      ardyGames.forEach(game => {
        console.log(`  - ${game.name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugGameOwnership() 