import { NextResponse } from 'next/server'
import { getGameAdById, updateGameAd, deleteGameAd } from '@/lib/db/gameAds'
import { Prisma } from '@prisma/client'

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
    // Map DB fields to API response shape
    return NextResponse.json({
      id: ad.id,
      name: ad.name,
      templateType: ad.type,
      createdAt: ad.createdAt.toISOString(),
      updatedAt: ad.updatedAt.toISOString(),
      assets: ad.assets || [],
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
    const gameAd = await request.json()
    // Validate required fields
    if (!gameAd.name || !gameAd.templateType || !gameAd.assets?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    // Validate that all assets have required fields
    for (const asset of gameAd.assets) {
      if (!asset.assetType || !asset.assetId || !asset.robloxAssetId) {
        return NextResponse.json(
          { error: 'Missing required asset fields' },
          { status: 400 }
        )
      }
    }
    // Prepare data for Prisma
    const data: Prisma.GameAdUpdateInput = {
      name: gameAd.name,
      type: gameAd.templateType,
      status: 'active',
      schedule: gameAd.schedule || null,
      targeting: gameAd.targeting || null,
      metrics: gameAd.metrics || null,
      assets: gameAd.assets,
      updatedAt: new Date(),
    }
    const updated = await updateGameAd(params.id, data)
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      templateType: updated.type,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      assets: updated.assets || [],
    })
  } catch (error) {
    console.error('Error updating game ad:', error)
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
    return NextResponse.json(
      { error: 'Failed to delete game ad' },
      { status: 500 }
    )
  }
} 