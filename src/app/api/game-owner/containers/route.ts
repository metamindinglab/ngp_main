import { NextRequest, NextResponse } from 'next/server'
import { jsonAuthService } from '@/lib/json-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get user from auth token
    const sessionToken = request.cookies.get('game-owner-session')?.value
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const user = await jsonAuthService.validateSession(sessionToken)
    if (!user || !user.gameOwnerId) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    // Get containers for all games owned by this user
    const containers = await prisma.gameAdContainer.findMany({
      where: {
        game: {
          gameOwnerId: user.gameOwnerId
        }
      },
      include: {
        game: {
          select: {
            id: true,
            name: true
          }
        },
        currentAd: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      containers
    })
  } catch (error) {
    console.error('Error fetching containers:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from auth token
    const sessionToken = request.cookies.get('game-owner-session')?.value
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const user = await jsonAuthService.validateSession(sessionToken)
    if (!user || !user.gameOwnerId) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const { gameId, name, description, type, locationX, locationY, locationZ } = body

    // Verify game ownership
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        gameOwnerId: user.gameOwnerId
      }
    })

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found or access denied' }, { status: 404 })
    }

    // Create container
    const container = await prisma.gameAdContainer.create({
      data: {
        gameId,
        name,
        description,
        type,
        locationX,
        locationY,
        locationZ,
        status: 'ACTIVE'
      },
      include: {
        game: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      container
    })
  } catch (error) {
    console.error('Error creating container:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
} 