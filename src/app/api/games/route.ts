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
    
    data.games.push(newGame)
    data.lastUpdated = new Date().toISOString()
    
    await fs.writeFile(gamesPath, JSON.stringify(data, null, 2))
    return NextResponse.json(newGame)
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
} 