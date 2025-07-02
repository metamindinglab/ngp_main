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

    // Get container type from query params
    const searchParams = request.nextUrl.searchParams
    const containerType = searchParams.get('containerType')

    if (!containerType) {
      return NextResponse.json(
        { success: false, error: 'Container type is required' },
        { status: 400 }
      )
    }

    // Find games that have the specified container type
    const games = await prisma.game.findMany({
      where: {
        gameOwnerId: user.id,
        adContainers: {
          some: {
            type: containerType,
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        adContainers: {
          where: {
            type: containerType,
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            description: true,
            locationX: true,
            locationY: true,
            locationZ: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      games: games.map(game => ({
        ...game,
        thumbnailUrl: game.thumbnail || '/placeholder.svg',
        containerCount: game.adContainers.length
      }))
    })
  } catch (error) {
    console.error('Error fetching available games:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 