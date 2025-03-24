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
    const updatedAd = await request.json()
    const gameAds = await loadGameAds()
    const index = gameAds.findIndex(ad => ad.id === params.id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Game ad not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!updatedAd.name || !updatedAd.templateType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Preserve the original ID and creation date
    updatedAd.id = params.id
    updatedAd.createdAt = gameAds[index].createdAt
    updatedAd.updatedAt = new Date().toISOString()

    // Update the game ad
    gameAds[index] = updatedAd

    // Save to file
    await saveGameAds(gameAds)

    return NextResponse.json(updatedAd)
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