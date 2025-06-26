import { NextRequest, NextResponse } from 'next/server'
import { jsonAuthService } from '@/lib/json-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET single game
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = request.cookies.get('game-owner-session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await jsonAuthService.validateSession(sessionToken)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    if (!user.gameOwnerId) {
      return NextResponse.json(
        { success: false, error: 'No game owner ID found' },
        { status: 403 }
      )
    }

    // Get the specific game and verify ownership
    const game = await prisma.game.findFirst({
      where: {
        id: params.id,
        gameOwnerId: user.gameOwnerId
      }
    })

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      game: {
        id: game.id,
        name: game.name,
        description: game.description || '',
        genre: game.genre || '',
        robloxLink: game.robloxLink || '',
        thumbnail: game.thumbnail || '',
        metrics: game.metrics || { dau: 0, mau: 0, day1Retention: 0 }
      }
    })
  } catch (error) {
    console.error('Get game error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get game' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT (update) game
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = request.cookies.get('game-owner-session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await jsonAuthService.validateSession(sessionToken)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    if (!user.gameOwnerId) {
      return NextResponse.json(
        { success: false, error: 'No game owner ID found' },
        { status: 403 }
      )
    }

    const { name, description, genre, robloxLink, thumbnail } = await request.json()

    // Verify the game exists and user owns it
    const existingGame = await prisma.game.findFirst({
      where: {
        id: params.id,
        gameOwnerId: user.gameOwnerId
      }
    })

    if (!existingGame) {
      return NextResponse.json(
        { success: false, error: 'Game not found or access denied' },
        { status: 404 }
      )
    }

    // Update the game
    const updatedGame = await prisma.game.update({
      where: {
        id: params.id
      },
      data: {
        name,
        description,
        genre,
        robloxLink,
        thumbnail,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      game: {
        id: updatedGame.id,
        name: updatedGame.name,
        description: updatedGame.description,
        genre: updatedGame.genre,
        robloxLink: updatedGame.robloxLink,
        thumbnail: updatedGame.thumbnail
      }
    })
  } catch (error) {
    console.error('Update game error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update game' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 