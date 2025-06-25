import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: params.id }
    })
    
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
    
    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id: params.id }
    })
    
    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Ensure we preserve the game ID
    updatedGame.id = params.id

    // Update the game and timestamps
    const game = await prisma.game.update({
      where: { id: params.id },
      data: {
        ...updatedGame,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json(game)
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
    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id: params.id }
    })
    
    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    
    // Delete the game
    await prisma.game.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication/authorization check to ensure only the game owner or admin can generate a key
    
    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id: params.id }
    })
    
    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    
    // Generate a secure random API key
    const serverApiKey = 'RBXG-' + crypto.randomBytes(24).toString('hex')
    
    // Update the game with the new server API key
    const updatedGame = await prisma.game.update({
      where: { id: params.id },
      data: {
        serverApiKey,
        serverApiKeyCreatedAt: new Date(),
        serverApiKeyStatus: 'active',
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ 
      serverApiKey,
      serverApiKeyCreatedAt: updatedGame.serverApiKeyCreatedAt,
      serverApiKeyStatus: updatedGame.serverApiKeyStatus
    })
  } catch (error) {
    console.error('Error generating server API key:', error)
    return NextResponse.json({ error: 'Failed to generate server API key' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 