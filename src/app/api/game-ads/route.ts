import { NextResponse } from 'next/server'
import { getAllGameAds, createGameAd } from '@/lib/db/gameAds'
import { Prisma } from '@prisma/client'

const PAGE_SIZE = 10 // Number of items per page

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''

    // Fetch all game ads from the database
    let gameAds = await getAllGameAds()

    // Filter by search term if provided
    const filteredAds = search
      ? gameAds.filter(ad =>
          ad.name.toLowerCase().includes(search.toLowerCase()) ||
          (typeof ad.description === 'string' && ad.description.toLowerCase().includes(search.toLowerCase()))
        )
      : gameAds

    // Calculate pagination
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const paginatedAds = filteredAds.slice(start, end)

    // Map DB fields to API response shape
    const mappedAds = paginatedAds.map(ad => ({
      id: ad.id,
      name: ad.name,
      templateType: ad.type,
      createdAt: ad.createdAt.toISOString(),
      updatedAt: ad.updatedAt.toISOString(),
      assets: ad.assets || [],
      // Optionally include other fields if needed
    }))

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
    const data: Prisma.GameAdCreateInput = {
      id: gameAd.id,
      gameId: gameAd.gameId || 'game_001', // Default game ID if not specified
      name: gameAd.name,
      type: gameAd.templateType,
      status: 'active',
      schedule: gameAd.schedule || null,
      targeting: gameAd.targeting || null,
      metrics: gameAd.metrics || null,
      assets: gameAd.assets,
      createdAt: gameAd.createdAt ? new Date(gameAd.createdAt) : undefined,
      updatedAt: gameAd.updatedAt ? new Date(gameAd.updatedAt) : undefined,
    }

    const created = await createGameAd(data)

    return NextResponse.json({
      id: created.id,
      name: created.name,
      templateType: created.type,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      assets: created.assets || [],
    })
  } catch (error) {
    console.error('Error in POST /api/game-ads:', error)
    return NextResponse.json(
      { error: 'Failed to create game ad' },
      { status: 500 }
    )
  }
} 