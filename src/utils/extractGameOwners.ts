import { prisma } from '@/lib/prisma'
import type { Prisma, Game } from '@prisma/client'

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

type GameWithOwnerInfo = {
  id: string
  gameOwnerId: string
  name: string
}

type OwnerInfo = {
  id: string
  email: string
  name: string
}

export async function extractGameOwners(): Promise<ExtractedOwnerResult> {
  try {
    // Get all games with their owners
    const games = await prisma.game.findMany({
      select: {
        id: true,
        gameOwnerId: true,
        name: true
      }
    }) as GameWithOwnerInfo[]

    // Get all owners
    const owners = await prisma.$queryRaw`
      SELECT id, email, name 
      FROM "GameOwner"
    ` as OwnerInfo[]

    const ownerMap = new Map<string, GameOwnerData>()
    const incompleteMap = new Map<string, GameOwnerData>()
    let ownerId = 1

    // First, create owner maps
    owners.forEach((owner: OwnerInfo) => {
      const { name, email } = owner
      if (email && email.trim() && name && name.trim()) {
        ownerMap.set(owner.id, {
          id: owner.id,
          email: email.trim(),
          name: name.trim(),
          country: '',
          discordId: '',
          games: [],
          status: 'complete'
        })
      } else if (name && name.trim()) {
        const key = name.trim()
        if (!incompleteMap.has(key)) {
          incompleteMap.set(key, {
            id: `incomplete_${ownerId.toString().padStart(3, '0')}`,
            email: '',
            name: name.trim(),
            country: '',
            discordId: '',
            games: [],
            status: 'incomplete'
          })
          ownerId++
        }
      }
    })

    // Then, associate games with owners
    games.forEach((game: GameWithOwnerInfo) => {
      if (game.gameOwnerId) {
        const owner = ownerMap.get(game.gameOwnerId)
        if (owner) {
          owner.games.push(game.id)
        } else {
          // If owner not found in complete owners, try incomplete owners
          const incompleteOwner = Array.from(incompleteMap.values()).find(o => o.name === game.name)
          if (incompleteOwner) {
            incompleteOwner.games.push(game.id)
          }
        }
      }
    })

    const validOwners = Array.from(ownerMap.values())
    const incompleteOwners = Array.from(incompleteMap.values())
    
    return {
      validOwners,
      incompleteOwners,
      stats: {
        totalGames: games.length,
        gamesWithOwners: validOwners.reduce((sum, owner) => sum + owner.games.length, 0),
        gamesWithoutOwners: games.length - validOwners.reduce((sum, owner) => sum + owner.games.length, 0) - incompleteOwners.reduce((sum, owner) => sum + owner.games.length, 0),
        uniqueOwners: validOwners.length
      }
    }
  } catch (error) {
    console.error('Error extracting game owners:', error)
    return {
      validOwners: [],
      incompleteOwners: [],
      stats: {
        totalGames: 0,
        gamesWithOwners: 0,
        gamesWithoutOwners: 0,
        uniqueOwners: 0
      }
    }
  }
}

// Function to get games for a specific owner by gameOwnerId
export async function getOwnerGamesByOwnerId(gameOwnerId: string) {
  try {
    const games = await prisma.game.findMany({
      where: {
        gameOwnerId
      }
    })
    
    return games
  } catch (error) {
    console.error('Error fetching games by gameOwnerId:', error)
    return []
  }
}

// Function to get games for a specific owner by email
export async function getOwnerGames(ownerEmail: string) {
  try {
    const owner = await prisma.$queryRaw`
      SELECT id 
      FROM "GameOwner" 
      WHERE email = ${ownerEmail}
    ` as { id: string }[]

    if (!owner.length) return []

    const games = await prisma.game.findMany({
      where: {
        gameOwnerId: owner[0].id
      }
    })
    
    return games
  } catch (error) {
    console.error('Error fetching games by owner email:', error)
    return []
  }
}

// Function to find owner by email
export async function findOwnerByEmail(email: string): Promise<GameOwnerData | null> {
  try {
    const owner = await prisma.$queryRaw`
      SELECT o.id, o.email, o.name, g.id as game_id
      FROM "GameOwner" o
      LEFT JOIN "Game" g ON g."gameOwnerId" = o.id
      WHERE o.email = ${email.toLowerCase()}
    ` as (OwnerInfo & { game_id: string | null })[]

    if (!owner.length) return null

    const ownerInfo = owner[0]
    return {
      id: ownerInfo.id,
      email: ownerInfo.email,
      name: ownerInfo.name,
      country: '',
      discordId: '',
      games: owner.map(o => o.game_id).filter((id): id is string => id !== null),
      status: 'complete'
    }
  } catch (error) {
    console.error('Error finding owner by email:', error)
    return null
  }
} 