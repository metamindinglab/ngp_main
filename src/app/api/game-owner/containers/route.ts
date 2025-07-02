import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
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

    // Get containers for all games owned by this user
    const containers = await prisma.gameAdContainer.findMany({
      where: {
        game: {
          gameOwnerId: user.id
        }
      },
      include: {
        game: {
          select: {
            id: true,
            name: true
          }
        },
        ad: {
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

    const body = await request.json()
    const { gameId, name, description, type, locationX, locationY, locationZ } = body

    // Verify game ownership
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        gameOwnerId: user.id
      }
    })

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found or access denied' }, { status: 404 })
    }

    // Create container
    const container = await prisma.gameAdContainer.create({
      data: {
        id: crypto.randomUUID(),
        gameId,
        name,
        description,
        type,
        locationX,
        locationY,
        locationZ,
        status: 'ACTIVE',
        updatedAt: new Date()
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