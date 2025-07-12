import { NextResponse } from 'next/server'
import { getGameAdById, updateGameAd, deleteGameAd } from '@/lib/db/gameAds'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import type { GameAd, Asset as GameAdAsset, AssetType, GameAdTemplateType } from '@/types/gameAd'
import type { GameAdPerformanceMetrics } from '@/types/gameAdPerformance'
import { prisma } from '@/lib/prisma'

const validAssetTypes = [
  'kol_character', 'hat', 'clothing', 'item', 'shoes', 
  'animation', 'audio', 'multi_display'
] as const

// Validation schema for updating a game ad
const GameAdUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['multimedia_display', 'dancing_npc', 'minigame_ad'] as const),
  gameIds: z.array(z.string()).optional(),
  assets: z.array(z.object({
    assetType: z.enum(validAssetTypes),
    assetId: z.string().min(1, 'Asset ID is required'),
    robloxAssetId: z.string().min(1, 'Roblox Asset ID is required')
  })).refine((assets) => {
    // For dancing_npc template, only kol_character is required
    if (assets.some(asset => asset.assetType === 'kol_character')) {
      return true;
    }
    // For other templates, require at least one asset
    return assets.length > 0;
  }, {
    message: 'At least one asset is required. For Dancing NPC Ad, KOL character is required.'
  }).optional()
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ad = await getGameAdById(params.id)
    if (!ad) {
      return NextResponse.json(
        { error: 'Game ad not found' },
        { status: 404 }
      )
    }

    // Cast to access JSON fields
    const dbAd = ad as unknown as { assets: unknown; performance: Array<{ metrics: unknown }> }
    const assets = dbAd.assets

    // Map DB fields to API response shape
    return NextResponse.json({
      id: ad.id,
      name: ad.name,
      type: ad.type,
      assets: Array.isArray(assets) && assets.every(isGameAdAsset) ? assets : [],
      createdAt: ad.createdAt.toISOString(),
      updatedAt: ad.updatedAt.toISOString(),
      games: ad.games,
      performance: ad.performance,
      containers: ad.containers
    })
  } catch (error) {
    console.error('Error loading game ad:', error)
    return NextResponse.json(
      { error: 'Failed to load game ad' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = GameAdUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const gameAd = validationResult.data

    // Check if game ad exists
    const existing = await prisma.gameAd.findUnique({
      where: { id: params.id },
      include: {
        games: true
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Game ad not found' },
        { status: 404 }
      )
    }

    // Update game ad using Prisma client
    const updated = await prisma.gameAd.update({
      where: { id: params.id },
      data: {
        name: gameAd.name,
        type: gameAd.type,
        assets: gameAd.assets,
        updatedAt: new Date(),
        games: gameAd.gameIds ? {
          set: gameAd.gameIds.map(id => ({ id }))
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
      id: updated.id,
      name: updated.name,
      type: updated.type,
      assets: Array.isArray(updated.assets) && updated.assets.every(isGameAdAsset) ? updated.assets : [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      games: updated.games,
      performance: updated.performance,
      containers: updated.containers
    })
  } catch (error) {
    console.error('Error updating game ad:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if game ad exists
    const existing = await prisma.gameAd.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Game ad not found' },
        { status: 404 }
      )
    }

    // Delete game ad using Prisma client
    await prisma.gameAd.delete({
      where: { id: params.id }
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/game-ads/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 