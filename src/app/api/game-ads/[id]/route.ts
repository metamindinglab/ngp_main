import { NextResponse } from 'next/server'
import { getGameAdById, updateGameAd, deleteGameAd } from '@/lib/db/gameAds'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import type { GameAd, Asset as GameAdAsset } from '@/types/gameAd'
import type { GameAdPerformanceMetrics } from '@/types/gameAdPerformance'

// Validation schema for updating a game ad
const GameAdUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  templateType: z.string().min(1, 'Template type is required'),
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
    const metrics = dbAd.performance?.[0]?.metrics

    // Map DB fields to API response shape
    return NextResponse.json({
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

    // Prepare data for Prisma
    const data: Prisma.GameAdUpdateInput = {
      name: gameAd.name,
      type: gameAd.templateType,
      status: gameAd.status || 'active',
      schedule: gameAd.schedule || null,
      targeting: gameAd.targeting || null,
      metrics: gameAd.metrics || null
    }

    // Add assets as JSON field
    const updateData = {
      ...data,
      assets: gameAd.assets as unknown as Prisma.JsonValue
    }

    const updated = await updateGameAd(params.id, updateData as Prisma.GameAdUpdateInput)

    // Cast to access JSON fields
    const dbAd = updated as unknown as { assets: unknown; performance: Array<{ metrics: unknown }> }
    const assets = dbAd.assets
    const metrics = dbAd.performance?.[0]?.metrics

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      templateType: updated.type,
      gameId: updated.gameId,
      status: updated.status,
      schedule: updated.schedule,
      targeting: updated.targeting,
      metrics: updated.metrics,
      assets: Array.isArray(assets) && assets.every(isGameAdAsset) ? assets : [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      game: updated.game ? {
        id: updated.game.id,
        name: updated.game.name,
        thumbnail: updated.game.thumbnail
      } : null,
      performance: isGameAdPerformanceMetrics(metrics) ? {
        impressions: metrics.totalImpressions,
        clicks: metrics.totalEngagements,
        conversions: metrics.conversionRate
      } : null
    })
  } catch (error) {
    console.error('Error updating game ad:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A game ad with this name already exists' },
          { status: 409 }
        )
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Game ad not found' },
          { status: 404 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to update game ad' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteGameAd(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game ad:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Game ad not found' },
          { status: 404 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to delete game ad' },
      { status: 500 }
    )
  }
} 