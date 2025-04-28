import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface Game {
  id: string
  name: string
  description: string
  genre: string
  robloxLink: string
  thumbnail: string
  metrics: {
    dau: number
    mau: number
    day1Retention: number
    topGeographicPlayers: {
      country: string
      percentage: number
    }[]
  }
  dates: {
    created: string
    lastUpdated: string
    mgnJoined: string
    lastRobloxSync?: string
  }
  owner: {
    name: string
    discordId: string
    email: string
    country: string
  }
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
  games: Game[]
}

const gamesPath = join(process.cwd(), 'data/games.json')

// Initialize data file if it doesn't exist
async function initDataFile() {
  try {
    await readFile(gamesPath, 'utf8')
  } catch {
    // Create data directory if it doesn't exist
    await mkdir(join(process.cwd(), 'data'), { recursive: true })
    // Create initial data file
    const initialData: GamesDatabase = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      games: []
    }
    await writeFile(gamesPath, JSON.stringify(initialData, null, 2))
  }
}

export async function GET() {
  try {
    await initDataFile()
    const content = await readFile(gamesPath, 'utf8')
    const data: GamesDatabase = JSON.parse(content)
    return NextResponse.json({ games: data.games })
  } catch (error) {
    console.error('Error reading games:', error)
    return NextResponse.json(
      { error: 'Failed to read games' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDataFile()
    const gameData = await request.json()
    const content = await readFile(gamesPath, 'utf8')
    const data: GamesDatabase = JSON.parse(content)
    
    // Generate next game ID
    const existingIds = data.games.map((game: Game): number => parseInt(game.id.replace('game_', '')) || 0)
    const nextId = Math.max(...existingIds, 0) + 1
    const gameId = `game_${nextId.toString().padStart(3, '0')}`
    
    // Create new game with all required fields
    const newGame: Game = {
      id: gameId,
      name: gameData.name,
      description: gameData.description,
      genre: gameData.genre,
      robloxLink: gameData.robloxLink,
      thumbnail: gameData.thumbnail,
      metrics: {
        dau: gameData.metrics?.dau || 0,
        mau: gameData.metrics?.mau || 0,
        day1Retention: gameData.metrics?.day1Retention || 0,
        topGeographicPlayers: gameData.metrics?.topGeographicPlayers || []
      },
      dates: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        mgnJoined: new Date().toISOString()
      },
      owner: {
        name: gameData.owner?.name || '',
        discordId: gameData.owner?.discordId || '',
        email: gameData.owner?.email || '',
        country: gameData.owner?.country || ''
      },
      authorization: gameData.authorization || {
        type: 'api_key',
        status: 'unverified'
      }
    }

    data.games.push(newGame)
    data.lastUpdated = new Date().toISOString()
    
    await writeFile(gamesPath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true, game: newGame })
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initDataFile()
    const { id, ...updates } = await request.json()
    const content = await readFile(gamesPath, 'utf8')
    const data: GamesDatabase = JSON.parse(content)
    
    const gameIndex = data.games.findIndex((game: Game): boolean => game.id === id)
    if (gameIndex === -1) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    
    data.games[gameIndex] = {
      ...data.games[gameIndex],
      ...updates,
      id // Preserve the original ID
    }
    data.lastUpdated = new Date().toISOString()
    
    await writeFile(gamesPath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true, game: data.games[gameIndex] })
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initDataFile()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }
    
    const content = await readFile(gamesPath, 'utf8')
    const data: GamesDatabase = JSON.parse(content)
    
    const gameIndex = data.games.findIndex((game: Game): boolean => game.id === id)
    if (gameIndex === -1) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    
    data.games.splice(gameIndex, 1)
    data.lastUpdated = new Date().toISOString()
    
    await writeFile(gamesPath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  }
} 