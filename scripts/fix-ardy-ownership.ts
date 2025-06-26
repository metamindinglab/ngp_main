import { PrismaClient } from '@prisma/client'
import { jsonAuthService } from '../src/lib/json-auth'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function fixArdyOwnership() {
  console.log('🔧 Fixing Ardy Lee ownership issues...\n')
  
  try {
    // 1. Get Ardy Lee's user record
    const users = await jsonAuthService.getAllUsers()
    const ardyUser = users.find(u => u.name === 'Ardy Lee' || u.email === 'info@metamindinglab.com')
    
    if (!ardyUser) {
      console.log('❌ Ardy Lee user not found!')
      return
    }
    
    console.log(`Found Ardy Lee: ${ardyUser.name} (${ardyUser.email})`)
    console.log(`Current gameOwnerId: ${ardyUser.gameOwnerId}`)
    
    // 2. If gameOwnerId is undefined, assign a new one
    if (!ardyUser.gameOwnerId) {
      ardyUser.gameOwnerId = uuidv4()
      console.log(`\n✅ Assigned new gameOwnerId: ${ardyUser.gameOwnerId}`)
      
      // Update the user in the JSON auth system
      await jsonAuthService.updateUser(ardyUser.id, { gameOwnerId: ardyUser.gameOwnerId })
    }
    
    // 3. Find games that should belong to Ardy Lee (games without gameOwnerId)
    const unassignedGames = await prisma.game.findMany({
      where: {
        gameOwnerId: null
      }
    })
    
    console.log(`\n🎮 Found ${unassignedGames.length} unassigned games:`)
    for (const game of unassignedGames) {
      console.log(`  - ${game.name}`)
      
      // Assign these games to Ardy Lee
      await prisma.game.update({
        where: { id: game.id },
        data: { gameOwnerId: ardyUser.gameOwnerId }
      })
      console.log(`    ✅ Assigned to Ardy Lee`)
    }
    
    // 4. Verify the fix
    const ardyGames = await prisma.game.findMany({
      where: { gameOwnerId: ardyUser.gameOwnerId }
    })
    
    console.log(`\n🎯 Ardy Lee now owns ${ardyGames.length} games:`)
    ardyGames.forEach(game => {
      console.log(`  - ${game.name}`)
    })
    
    console.log('\n✅ Ownership fix completed successfully!')
    
  } catch (error) {
    console.error('❌ Error fixing ownership:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixArdyOwnership() 