import { NextRequest, NextResponse } from 'next/server'
import { getAllGameAds, createGameAd } from '@/lib/db/gameAds'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import type { GameAd, Asset as GameAdAsset, AssetType, GameAdTemplateType } from '@/types/gameAd'
import { AcceptedGameAdTypes, normalizeGameAdType } from '@/lib/ads/type-normalization'
import type { GameAdPerformanceMetrics } from '@/types/gameAdPerformance'
import { addCorsHeaders, handleAuth, applyRateLimit, addRateLimitHeaders, handleOptions } from '../middleware'

const PAGE_SIZE = 10 // Number of items per page

const validAssetTypes = [
  'kol_character', 'hat', 'clothing', 'item', 'shoes', 
  'animation', 'audio', 'multi_display'
] as const

// Validation schema for creating a game ad
const GameAdCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(AcceptedGameAdTypes as unknown as [string, ...string[]]),
  gameIds: z.array(z.string()).optional(),
  status: z.string().optional(),
  schedule: z.any().optional(),
  targeting: z.any().optional(),
  metrics: z.any().optional(),
  description: z.string().optional(),
  assets: z.array(z.object({
    assetType: z.enum(validAssetTypes),
    assetId: z.string().min(1, 'Asset ID is required'),
    robloxAssetId: z.string().min(1, 'Roblox Asset ID is required')
  })).optional()
})

// Type guard for GameAdAsset
function isGameAdAsset(obj: unknown): obj is GameAdAsset {
  if (!obj || typeof obj !== 'object') return false
  const asset = obj as Record<string, unknown>
  return (
    typeof asset.assetType === 'string' &&
    validAssetTypes.includes(asset.assetType as AssetType) &&
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

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * PAGE_SIZE

    // Get total count for pagination
    const totalCount = await prisma.gameAd.count()
    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    const results = await prisma.gameAd.findMany({
      skip,
      take: PAGE_SIZE,
      include: {
        games: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        },
        performance: true,
        containers: true
      }
    })

    return NextResponse.json({
      gameAds: results.map(ad => ({
        id: ad.id,
        name: ad.name,
        type: ad.type,
        assets: Array.isArray(ad.assets) && ad.assets.every(isGameAdAsset) ? ad.assets : [],
        createdAt: ad.createdAt.toISOString(),
        updatedAt: ad.updatedAt.toISOString(),
        games: ad.games,
        performance: ad.performance,
        containers: ad.containers
      })),
      totalPages
    })
  } catch (error) {
    console.error('Error in GET /api/game-ads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Soft validation: ensure asset compatibility using canonical ad type and existing Asset rows if present
    const canonicalAdType = normalizeGameAdType(gameAd.type)
    if (Array.isArray(gameAd.assets) && gameAd.assets.length > 0) {
      const assetIds = gameAd.assets.map(a => a.assetId)
      const dbAssets = await prisma.asset.findMany({ where: { id: { in: assetIds } }, select: { id: true, canonicalType: true, type: true } })
      const hasCompatible = dbAssets.some(a => {
        const c = String(a.canonicalType || '')
        if (canonicalAdType === 'DISPLAY') return c.startsWith('DISPLAY.')
        if (canonicalAdType === 'NPC') return c === 'NPC.character_model' || c === 'NPC.animation'
        if (canonicalAdType === 'MINIGAME') return c === 'MINIGAME.minigame_model'
        return false
      })
      if (!hasCompatible) {
        return NextResponse.json(
          { error: 'Incompatible assets for ad type', details: { type: canonicalAdType, assets: assetIds } },
          { status: 400 }
        )
      }
    }

    // Create game ad using Prisma client
    const created = await prisma.gameAd.create({
      data: {
        id: crypto.randomUUID(),
        gameId: gameAd.gameIds && gameAd.gameIds.length > 0 ? gameAd.gameIds[0] : 'game_001', // Use first game ID or default
        name: gameAd.name,
        type: normalizeGameAdType(gameAd.type),
        description: gameAd.description ?? null,
        assets: gameAd.assets,
        updatedAt: new Date(),
        games: gameAd.gameIds ? {
          connect: gameAd.gameIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        games: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        },
        performance: true,
        containers: true
      }
    })

    return NextResponse.json({
      id: created.id,
      name: created.name,
      type: created.type,
      description: (created as any).description ?? null,
      assets: Array.isArray(created.assets) && created.assets.every(isGameAdAsset) ? created.assets : [],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      games: created.games,
      performance: created.performance,
      containers: created.containers
    })
  } catch (error) {
    console.error('Error in POST /api/game-ads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 