import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const gamesPath = path.join(process.cwd(), 'data/games.json')

export async function GET() {
  try {
    const fileContents = await fs.readFile(gamesPath, 'utf8')
    const data = JSON.parse(fileContents)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading games:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const newGame = await request.json()
    const fileContents = await fs.readFile(gamesPath, 'utf8')
    const data = JSON.parse(fileContents)
    
    // Generate next game ID
    const existingIds = data.games.map(g => parseInt(g.id.replace('game_', '')) || 0)
    const nextId = Math.max(...existingIds, 0) + 1
    const gameId = `game_${nextId.toString().padStart(3, '0')}`
    
    // Ensure media arrays exist
    if (!newGame.robloxInfo) {
      newGame.robloxInfo = {}
    }
    if (!newGame.robloxInfo.media) {
      newGame.robloxInfo.media = {
        images: [],
        videos: []
      }
    }
    
    // Add the game with the new ID
    const gameWithId = {
      ...newGame,
      id: gameId,
      dates: {
        ...newGame.dates,
        lastUpdated: new Date().toISOString()
      }
    }
    
    data.games.push(gameWithId)
    data.lastUpdated = new Date().toISOString()
    
    await fs.writeFile(gamesPath, JSON.stringify(data, null, 2))
    return NextResponse.json(gameWithId)
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
} 