import fs from 'fs'
import path from 'path'

export interface GameOwnerData {
  id: string
  email: string
  name: string
  country: string
  discordId?: string
  games: string[]
  status: 'complete' | 'incomplete'
}

export interface ExtractedOwnerResult {
  validOwners: GameOwnerData[]
  incompleteOwners: GameOwnerData[]
  stats: {
    totalGames: number
    gamesWithOwners: number
    gamesWithoutOwners: number
    uniqueOwners: number
  }
}

export function extractGameOwners(): ExtractedOwnerResult {
  const gamesDataPath = path.join(process.cwd(), 'data/games.json')
  
  if (!fs.existsSync(gamesDataPath)) {
    throw new Error('games.json not found')
  }

  const gamesData = JSON.parse(fs.readFileSync(gamesDataPath, 'utf8'))
  const ownerMap = new Map<string, GameOwnerData>()
  const incompleteMap = new Map<string, GameOwnerData>()
  let ownerId = 1

  gamesData.games.forEach((game: any) => {
    if (game.owner) {
      const { name, email, country, discordId } = game.owner
      
      // Check if owner has complete data (at minimum: name and email)
      if (email && email.trim() && name && name.trim()) {
        // Complete owner
        if (!ownerMap.has(email)) {
          ownerMap.set(email, {
            id: `owner_${ownerId.toString().padStart(3, '0')}`,
            email: email.trim(),
            name: name.trim(),
            country: country?.trim() || '',
            discordId: discordId?.trim() || '',
            games: [],
            status: 'complete'
          })
          ownerId++
        }
        ownerMap.get(email)!.games.push(game.id)
      } else if (name && name.trim()) {
        // Incomplete owner (has name but no email)
        const key = name.trim()
        if (!incompleteMap.has(key)) {
          incompleteMap.set(key, {
            id: `incomplete_${ownerId.toString().padStart(3, '0')}`,
            email: '',
            name: name.trim(),
            country: country?.trim() || '',
            discordId: discordId?.trim() || '',
            games: [],
            status: 'incomplete'
          })
          ownerId++
        }
        incompleteMap.get(key)!.games.push(game.id)
      }
    }
  })

  const validOwners = Array.from(ownerMap.values())
  const incompleteOwners = Array.from(incompleteMap.values())
  
  return {
    validOwners,
    incompleteOwners,
    stats: {
      totalGames: gamesData.games.length,
      gamesWithOwners: validOwners.reduce((sum, owner) => sum + owner.games.length, 0),
      gamesWithoutOwners: gamesData.games.length - validOwners.reduce((sum, owner) => sum + owner.games.length, 0) - incompleteOwners.reduce((sum, owner) => sum + owner.games.length, 0),
      uniqueOwners: validOwners.length
    }
  }
}

// Function to get games for a specific owner by gameOwnerId (using database)
export async function getOwnerGamesByOwnerId(gameOwnerId: string): Promise<any[]> {
  // Import prisma dynamically to avoid edge runtime issues
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    const games = await prisma.game.findMany({
      where: {
        gameOwnerId: gameOwnerId
      }
    })
    
    return games
  } catch (error) {
    console.error('Error fetching games by gameOwnerId:', error)
    return []
  } finally {
    await prisma.$disconnect()
  }
}

// Function to get games for a specific owner by email (legacy - for migration)
export function getOwnerGames(ownerEmail: string): any[] {
  const gamesDataPath = path.join(process.cwd(), 'data/games.json')
  const gamesData = JSON.parse(fs.readFileSync(gamesDataPath, 'utf8'))
  
  return gamesData.games.filter((game: any) => 
    game.owner?.email && game.owner.email.trim().toLowerCase() === ownerEmail.toLowerCase()
  )
}

// Function to migrate games to use gameOwnerId mapping
export async function migrateGamesToOwnerIds(): Promise<void> {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    // Get all games that don't have gameOwnerId set
    const gamesWithoutOwnerId = await prisma.game.findMany({
      where: {
        gameOwnerId: null
      }
    })
    
    // Get all game owner users to map emails to gameOwnerIds
    const { jsonAuthService } = await import('@/lib/json-auth')
    const users = await jsonAuthService.getAllUsers()
    
    for (const game of gamesWithoutOwnerId) {
      const gameOwnerEmail = game.owner?.email
      if (gameOwnerEmail) {
        const user = users.find(u => u.email.toLowerCase() === gameOwnerEmail.toLowerCase())
        if (user) {
          await prisma.game.update({
            where: { id: game.id },
            data: { gameOwnerId: user.gameOwnerId }
          })
          console.log(`Mapped game ${game.name} to gameOwnerId ${user.gameOwnerId}`)
        }
      }
    }
  } catch (error) {
    console.error('Error migrating games to gameOwnerIds:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Function to find owner by email
export function findOwnerByEmail(email: string): GameOwnerData | null {
  const result = extractGameOwners()
  return result.validOwners.find(owner => 
    owner.email.toLowerCase() === email.toLowerCase()
  ) || null
} 