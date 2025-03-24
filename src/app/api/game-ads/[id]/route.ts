import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { GameAd } from '@/types/gameAd'

const DATA_FILE = path.join(process.cwd(), 'data', 'game-ads.json')

// Load game ads from file
async function loadGameAds(): Promise<GameAd[]> {
  const data = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(data).gameAds
}

// Save game ads to file
async function saveGameAds(gameAds: GameAd[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify({ gameAds }, null, 2))
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gameAds = await loadGameAds()
    const gameAd = gameAds.find(ad => ad.id === params.id)

    if (!gameAd) {
      return NextResponse.json(
        { error: 'Game ad not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(gameAd)
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

    // Load existing game ads
    const gameAds = await loadGameAds()
    const index = gameAds.findIndex(ad => ad.id === params.id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Game ad not found' },
        { status: 404 }
      )
    }

    // Update timestamps
    gameAd.updatedAt = new Date().toISOString()
    gameAd.createdAt = gameAds[index].createdAt

    // Update the game ad
    gameAds[index] = gameAd

    // Save to file
    await saveGameAds(gameAds)

    return NextResponse.json(gameAd)
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
    const gameAds = await loadGameAds()
    const index = gameAds.findIndex(ad => ad.id === params.id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Game ad not found' },
        { status: 404 }
      )
    }

    // Remove the game ad
    gameAds.splice(index, 1)

    // Save to file
    await saveGameAds(gameAds)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game ad:', error)
    return NextResponse.json(
      { error: 'Failed to delete game ad' },
      { status: 500 }
    )
  }
} 