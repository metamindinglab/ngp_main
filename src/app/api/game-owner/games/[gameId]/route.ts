import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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

    // Fetch the specific game
    const game = await prisma.game.findFirst({
      where: {
        id: params.gameId,
        gameOwnerId: user.id // Ensure ownership
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

    // Fetch latest metrics for this game
    const [latestDAU, latestMAU, latestD1Retention] = await Promise.all([
      prisma.$queryRaw<Array<{ value: number, date: Date }>>`
        SELECT value, date
        FROM "GameMetricData"
        WHERE "gameId" = ${game.id} AND "metricType"::text = 'daily_active_users'
        ORDER BY date DESC
        LIMIT 1
      `,
      prisma.$queryRaw<Array<{ value: number, date: Date }>>`
        SELECT value, date
        FROM "GameMetricData"
        WHERE "gameId" = ${game.id} AND "metricType"::text = 'monthly_active_users_by_day'
        ORDER BY date DESC
        LIMIT 1
      `,
      prisma.$queryRaw<Array<{ value: number, date: Date }>>`
        SELECT value, date
        FROM "GameMetricData"
        WHERE "gameId" = ${game.id} AND "metricType"::text = 'd1_retention'
        ORDER BY date DESC
        LIMIT 1
      `
    ]);

    const gameWithMetrics = {
      ...game,
      metrics: {
        dau: latestDAU[0]?.value || 0,
        mau: latestMAU[0]?.value || 0,
        day1Retention: latestD1Retention[0]?.value || 0
      }
    };

    return NextResponse.json({ success: true, game: gameWithMetrics })
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Parse the request body
    const { name, description, genre, robloxLink, thumbnail } = await request.json()

    // Update the game
    const updatedGame = await prisma.game.update({
      where: {
        id: params.gameId,
        gameOwnerId: user.id // Ensure ownership
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

    return NextResponse.json({ success: true, game: updatedGame })
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 