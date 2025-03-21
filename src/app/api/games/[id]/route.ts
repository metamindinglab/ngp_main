import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const gamesPath = path.join(process.cwd(), 'data/games.json')

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileContents = await fs.readFile(gamesPath, 'utf8')
    const data = JSON.parse(fileContents)
    const game = data.games.find((g: any) => g.id === params.id)
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    
    return NextResponse.json(game)
  } catch (error) {
    console.error('Error reading game:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updatedGame = await request.json()
    const fileContents = await fs.readFile(gamesPath, 'utf8')
    const data = JSON.parse(fileContents)
    
    const index = data.games.findIndex((g: any) => g.id === params.id)
    if (index === -1) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    
    data.games[index] = updatedGame
    data.lastUpdated = new Date().toISOString()
    
    await fs.writeFile(gamesPath, JSON.stringify(data, null, 2))
    return NextResponse.json(updatedGame)
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileContents = await fs.readFile(gamesPath, 'utf8')
    const data = JSON.parse(fileContents)
    
    const index = data.games.findIndex((g: any) => g.id === params.id)
    if (index === -1) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    
    data.games.splice(index, 1)
    data.lastUpdated = new Date().toISOString()
    
    await fs.writeFile(gamesPath, JSON.stringify(data, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
  }
} 