import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
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

    const { adId, gameIds } = await request.json()

    if (!adId || !Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    // Verify game ownership
    const games = await prisma.game.findMany({
      where: {
        id: {
          in: gameIds
        },
        gameOwnerId: user.id
      }
    })

    if (games.length !== gameIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more games not found or access denied' },
        { status: 404 }
      )
    }

    // Create game assignments by connecting games to the ad
    const updatedAd = await prisma.gameAd.update({
      where: { id: adId },
      data: {
        games: {
          connect: gameIds.map(gameId => ({ id: gameId }))
        }
      },
      include: {
        games: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      ad: updatedAd
    })
  } catch (error) {
    console.error('Error assigning games to ad:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { adId, gameIds } = await request.json()

    if (!adId || !Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    // Verify game ownership
    const games = await prisma.game.findMany({
      where: {
        id: {
          in: gameIds
        },
        gameOwnerId: user.id
      }
    })

    if (games.length !== gameIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more games not found or access denied' },
        { status: 404 }
      )
    }

    // Delete game assignments by disconnecting games from the ad
    await prisma.gameAd.update({
      where: { id: adId },
      data: {
        games: {
          disconnect: gameIds.map(gameId => ({ id: gameId }))
        }
      }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error removing game assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 