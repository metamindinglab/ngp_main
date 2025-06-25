import { NextResponse } from 'next/server'
import { getAllGameAds, createGameAd } from '@/lib/db/gameAds'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import type { GameAd, Asset as GameAdAsset } from '@/types/gameAd'
import type { GameAdPerformanceMetrics } from '@/types/gameAdPerformance'

const PAGE_SIZE = 10 // Number of items per page

// Validation schema for creating a game ad
const GameAdCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  templateType: z.string().min(1, 'Template type is required'),
  gameId: z.string().optional(),
  status: z.string().optional(),
  schedule: z.any().optional(),
  targeting: z.any().optional(),
  metrics: z.any().optional(),
  assets: z.array(z.object({
    assetType: z.string().min(1, 'Asset type is required'),
    assetId: z.string().min(1, 'Asset ID is required'),
    robloxAssetId: z.string().min(1, 'Roblox Asset ID is required')
  })).min(1, 'At least one asset is required')
})

// Type guard for GameAdAsset
function isGameAdAsset(obj: unknown): obj is GameAdAsset {
  if (!obj || typeof obj !== 'object') return false
  const asset = obj as Record<string, unknown>
  return (
    typeof asset.assetType === 'string' &&
    typeof asset.assetId === 'string' &&
    typeof asset.robloxAssetId === 'string'
  )
}

// Type guard for GameAdPerformanceMetrics
function isGameAdPerformanceMetrics(obj: unknown): obj is GameAdPerformanceMetrics {
  if (!obj || typeof obj !== 'object') return false
  const metrics = obj as Record<string, unknown>
  return (
    typeof metrics.totalImpressions === 'number' &&
    typeof metrics.totalEngagements === 'number' &&
    typeof metrics.conversionRate === 'number'
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const gameId = searchParams.get('gameId')

    // Fetch all game ads from the database
    let gameAds = await getAllGameAds()

    // Apply filters
    let filteredAds = gameAds
    
    if (search) {
      filteredAds = filteredAds.filter(ad =>
        ad.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status) {
      filteredAds = filteredAds.filter(ad => ad.status === status)
    }

    if (gameId) {
      filteredAds = filteredAds.filter(ad => ad.gameId === gameId)
    }

    // Calculate pagination
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const paginatedAds = filteredAds.slice(start, end)

    // Map DB fields to API response shape
    const mappedAds = paginatedAds.map(ad => {
      const dbAd = ad as unknown as { assets: unknown; performance: Array<{ metrics: unknown }> }
      const assets = dbAd.assets
      const metrics = dbAd.performance?.[0]?.metrics

      return {
        id: ad.id,
        name: ad.name,
        templateType: ad.type,
        gameId: ad.gameId,
        status: ad.status,
        schedule: ad.schedule,
        targeting: ad.targeting,
        metrics: ad.metrics,
        assets: Array.isArray(assets) && assets.every(isGameAdAsset) ? assets : [],
        createdAt: ad.createdAt.toISOString(),
        updatedAt: ad.updatedAt.toISOString(),
        game: ad.game ? {
          id: ad.game.id,
          name: ad.game.name,
          thumbnail: ad.game.thumbnail
        } : null,
        performance: isGameAdPerformanceMetrics(metrics) ? {
          impressions: metrics.totalImpressions,
          clicks: metrics.totalEngagements,
          conversions: metrics.conversionRate
        } : null
      }
    })

    return NextResponse.json({
      gameAds: mappedAds,
      total: filteredAds.length,
      page,
      totalPages: Math.ceil(filteredAds.length / PAGE_SIZE)
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60',
      }
    })
  } catch (error) {
    console.error('Error in GET /api/game-ads:', error)
    return NextResponse.json(
      { error: 'Failed to load game ads' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = GameAdCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const gameAd = validationResult.data

    // Prepare data for Prisma
    const data: Prisma.GameAdCreateInput = {
      name: gameAd.name,
      type: gameAd.templateType,
      game: {
        connect: {
          id: gameAd.gameId || 'game_001' // Default game ID if not specified
        }
      },
      status: gameAd.status || 'active',
      schedule: gameAd.schedule || null,
      targeting: gameAd.targeting || null,
      metrics: gameAd.metrics || null
    }

    // Add assets as JSON field
    const createData = {
      ...data,
      assets: gameAd.assets
    } as const

    const created = await createGameAd(createData)

    // Map response
    const dbAd = created as unknown as { assets: unknown }
    const assets = dbAd.assets

    return NextResponse.json({
      id: created.id,
      name: created.name,
      templateType: created.type,
      gameId: created.gameId,
      status: created.status,
      schedule: created.schedule,
      targeting: created.targeting,
      metrics: created.metrics,
      assets: Array.isArray(assets) && assets.every(isGameAdAsset) ? assets : [],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      game: created.game ? {
        id: created.game.id,
        name: created.game.name,
        thumbnail: created.game.thumbnail
      } : null
    })
  } catch (error) {
    console.error('Error in POST /api/game-ads:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A game ad with this name already exists' },
          { status: 409 }
        )
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Referenced game does not exist' },
          { status: 400 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to create game ad' },
      { status: 500 }
    )
  }
} 