import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET single game
export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify JWT token
    let userId: string
    try {
      const decoded = verify(sessionToken, JWT_SECRET) as { userId: string }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.gameOwner.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the specific game and verify ownership
    const game = await prisma.game.findFirst({
      where: {
        id: params.gameId,
        gameOwnerId: user.id
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
        metrics: game.metrics || { dau: 0, mau: 0, day1Retention: 0 },
        owner: {
          name: user.name || '',
          email: user.email,
          country: '',  // These fields are not in the database schema
          discordId: '' // These fields are not in the database schema
        },
        media: game.media
      }
    })
  } catch (error) {
    console.error('Get game error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get game' },
      { status: 500 }
    )
  }
}

// PUT (update) game
export async function PUT(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify JWT token
    let userId: string
    try {
      const decoded = verify(sessionToken, JWT_SECRET) as { userId: string }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.gameOwner.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const { name, description, genre, robloxLink, thumbnail } = await request.json()

    // Verify the game exists and user owns it
    const existingGame = await prisma.game.findFirst({
      where: {
        id: params.gameId,
        gameOwnerId: user.id
      },
      include: {
        media: true
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
        id: params.gameId
      },
      data: {
        name,
        description,
        genre,
        robloxLink,
        thumbnail,
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

    return NextResponse.json({
      success: true,
      game: {
        id: updatedGame.id,
        name: updatedGame.name,
        description: updatedGame.description,
        genre: updatedGame.genre,
        robloxLink: updatedGame.robloxLink,
        thumbnail: updatedGame.thumbnail,
        media: updatedGame.media
      }
    })
  } catch (error) {
    console.error('Update game error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update game' },
      { status: 500 }
    )
  }
} 