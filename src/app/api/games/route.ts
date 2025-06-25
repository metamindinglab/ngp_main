import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

// Helper function to generate next game ID
async function generateGameId(): Promise<string> {
  const games = await prisma.game.findMany({
    select: { id: true },
    orderBy: { createdAt: 'desc' }
  })
  
  const existingIds = games
    .map(game => parseInt(game.id.replace('game_', '')) || 0)
    .filter(id => !isNaN(id))
  
  const nextId = Math.max(...existingIds, 0) + 1
  return `game_${nextId.toString().padStart(3, '0')}`
}

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ games })
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
    const gameData = await request.json()
    
    // Generate next game ID
    const gameId = await generateGameId()
    
    // Create new game in database
    const newGame = await prisma.game.create({
      data: {
        id: gameId,
        name: gameData.name,
        description: gameData.description,
        genre: gameData.genre,
        robloxLink: gameData.robloxLink,
        thumbnail: gameData.thumbnail,
        metrics: gameData.metrics || {
          dau: 0,
          mau: 0,
          day1Retention: 0,
          topGeographicPlayers: []
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
        }
      }
    })
    
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
    const { id, ...updates } = await request.json()
    
    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id }
    })
    
    if (!existingGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    
    // Update the game
    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ success: true, game: updatedGame })
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }
    
    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id }
    })
    
    if (!existingGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    
    // Delete the game
    await prisma.game.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 