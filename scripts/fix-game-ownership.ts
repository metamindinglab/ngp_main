import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const gameOwnerId = '9be282ab-42b0-4e1d-a9fa-c8facfea9470'
  
  // First, get the game owner details
  const gameOwner = await prisma.gameOwner.findUnique({
    where: { id: gameOwnerId }
  })

  if (!gameOwner) {
    console.error('Game owner not found!')
    return
  }

  console.log('Game owner found:', {
    id: gameOwner.id,
    email: gameOwner.email,
    name: gameOwner.name
  })

  // Get all games assigned to this owner
  const games = await prisma.game.findMany({
    where: { gameOwnerId }
  })

  console.log(`Found ${games.length} games with gameOwnerId:`, games.map(g => g.name))

  // Update the owner JSON field for all games
  for (const game of games) {
    await prisma.game.update({
      where: { id: game.id },
      data: {
        owner: {
          name: gameOwner.name,
          email: gameOwner.email,
          country: '',
          discordId: ''
        }
      }
    })
    console.log(`Updated owner JSON for game: ${game.name}`)
  }

  console.log('All games have been updated!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) 