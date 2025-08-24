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

    const games = await prisma.game.findMany({
      where: {
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

    // For each game, fetch the latest metrics
    const gamesWithMetrics = await Promise.all(games.map(async (game) => {
      // Fetch latest metrics for DAU, MAU, and D1 Retention using raw SQL
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

      // Update the game object with latest metrics
      return {
        ...game,
        metrics: {
          dau: latestDAU[0]?.value || 0,
          mau: latestMAU[0]?.value || 0,
          day1Retention: latestD1Retention[0]?.value || 0
        },
        enabledTemplates: [],
        assignedAds: []
      };
    }));

    return NextResponse.json({ success: true, games: gamesWithMetrics })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 