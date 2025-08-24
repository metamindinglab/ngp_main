import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        media: {
          select: {
            id: true,
            type: true,
            title: true,
            localPath: true,
            thumbnailUrl: true
          }
        }
      }
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

export async function POST(
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
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id: params.id }
    })
    
    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    
    // Update the game
    const updatedGame = await prisma.game.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        genre: body.genre,
        robloxLink: body.robloxLink,
        robloxAuthorization: body.robloxAuthorization,
        metrics: body.metrics,
        owner: body.owner,
        updatedAt: new Date()
      },
      include: {
        media: {
          select: {
            id: true,
            type: true,
            title: true,
            localPath: true,
            thumbnailUrl: true
          }
        }
      }
    })
    
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