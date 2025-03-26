import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface Game {
  id: string
  name: string
  description: string
  genre: string
  metrics: {
    dau: number
    mau: number
    day1Retention: number
  }
  owner: {
    name: string
    country: string
  }
  thumbnail: string
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
    const game = await request.json()
    const content = await readFile(gamesPath, 'utf8')
    const data: GamesDatabase = JSON.parse(content)
    
    // Generate next game ID
    const existingIds = data.games.map((game: Game): number => parseInt(game.id.replace('game_', '')) || 0)
    const nextId = Math.max(...existingIds, 0) + 1
    const gameId = `game_${nextId.toString().padStart(3, '0')}`
    
    const newGame: Game = {
      id: gameId,
      name: game.name,
      description: game.description,
      genre: game.genre,
      metrics: {
        dau: game.metrics.dau,
        mau: game.metrics.mau,
        day1Retention: game.metrics.day1Retention
      },
      owner: {
        name: game.owner.name,
        country: game.owner.country
      },
      thumbnail: game.thumbnail
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