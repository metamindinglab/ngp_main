import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonAuthService } from '@/lib/json-auth'
import { GameAd, GameAdPerformance, Game, Prisma } from '@prisma/client'

interface TransformedGameAd {
  id: string
  name: string
  type: string | null
  assignedGames: {
    id: string
    name: string
    thumbnail: string | null
    status: string
  }[]
  performance: {
    id: string
    gameAdId: string
    date: string
    metrics: {
      impressions: number
      interactions: number
      engagementTime: number
      clickThroughRate: number
    }
    demographics: {
      ageGroups: Record<string, number>
      regions: Record<string, number>
    }
    engagements: {
      types: Record<string, number>
      durations: Record<string, number>
    }
  }[]
}

interface AdMetrics {
  impressions: number
  interactions: number
  engagementTime: number
}

interface AdDemographics {
  ageGroups: Array<{ name: string; count: number }>
  regions: Array<{ name: string; count: number }>
}

interface AdEngagements {
  type: string
  count: number
  duration: number
}

interface AdTimeDistribution {
  hour: number
  count: number
}

function assertType<T>(value: unknown, errorMessage: string): T {
  if (!value || typeof value !== 'object') {
    throw new Error(errorMessage)
  }
  return value as T
}

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

    // Validate session and get user
    const user = await jsonAuthService.validateSession(sessionToken)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = new URL(request.url).searchParams
    const gameId = searchParams.get('gameId')
    const adType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: Prisma.GameAdWhereInput = {}

    if (gameId) {
      where.games = {
        some: {
          id: gameId
        }
      }
    }

    if (adType) {
      where.type = adType
    }

    // Get game ads with performance data
    const ads = await prisma.gameAd.findMany({
      where,
      include: {
        games: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        },
        performance: {
          where: startDate && endDate ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          } : undefined
        }
      }
    })

    // Transform the data to match the frontend interface
    const transformedAds: TransformedGameAd[] = ads.map((ad) => {
      return {
        id: ad.id,
        name: ad.name,
        type: ad.type,
        assignedGames: ad.games.map((game) => ({
          id: game.id,
          name: game.name,
          thumbnail: game.thumbnail,
          status: 'ACTIVE'
        })),
        performance: ad.performance.map((perf) => ({
          id: perf.id,
          gameAdId: perf.gameAdId,
          date: perf.date.toISOString(),
          metrics: (perf.metrics || {}) as {
            impressions: number
            interactions: number
            engagementTime: number
            clickThroughRate: number
          },
          demographics: (perf.demographics || {}) as {
            ageGroups: Record<string, number>
            regions: Record<string, number>
          },
          engagements: (perf.engagements || {}) as {
            types: Record<string, number>
            durations: Record<string, number>
          }
        }))
      }
    })

    return NextResponse.json({ success: true, data: transformedAds })
  } catch (error) {
    console.error('Error fetching game ads:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
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

    // Validate session and get user
    const user = await jsonAuthService.validateSession(sessionToken)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { name, type, assets, gameIds } = body

    // Create game ad with proper type annotations
    const createInput: Prisma.GameAdUncheckedCreateInput = {
      id: crypto.randomUUID(),
      gameId: gameIds && gameIds.length > 0 ? gameIds[0] : 'game_001', // Use first game ID or default
      name,
      type,
      assets: assets || [],
      updatedAt: new Date()
    }

    // Create the game ad first
    const gameAd = await prisma.gameAd.create({
      data: createInput,
      include: {
        games: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        },
        performance: true
      }
    })

    // Connect to additional games if provided
    if (gameIds && gameIds.length > 1) {
      await prisma.gameAd.update({
        where: { id: gameAd.id },
        data: {
          games: {
            connect: gameIds.slice(1).map((id: string) => ({ id }))
          }
        }
      })
    }

    // Transform the response to match the frontend interface
    const transformedAd: TransformedGameAd = {
      id: gameAd.id,
      name: gameAd.name,
      type: gameAd.type,
      assignedGames: gameAd.games.map((game) => ({
        id: game.id,
        name: game.name,
        thumbnail: game.thumbnail,
        status: 'ACTIVE'
      })),
      performance: gameAd.performance.map((perf) => ({
        id: perf.id,
        gameAdId: perf.gameAdId,
        date: perf.date.toISOString(),
        metrics: (perf.metrics || {}) as {
          impressions: number
          interactions: number
          engagementTime: number
          clickThroughRate: number
        },
        demographics: (perf.demographics || {}) as {
          ageGroups: Record<string, number>
          regions: Record<string, number>
        },
        engagements: (perf.engagements || {}) as {
          types: Record<string, number>
          durations: Record<string, number>
        }
      }))
    }

    return NextResponse.json({ success: true, data: transformedAd })
  } catch (error) {
    console.error('Error creating game ad:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 