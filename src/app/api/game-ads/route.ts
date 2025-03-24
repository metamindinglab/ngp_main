import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { GameAd } from '@/types/gameAd'

const DATA_FILE = path.join(process.cwd(), 'data', 'game-ads.json')

// Initialize data file if it doesn't exist
async function initDataFile() {
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify({ gameAds: [] }))
  }
}

// Load game ads from file
async function loadGameAds(): Promise<GameAd[]> {
  await initDataFile()
  const data = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(data).gameAds
}

// Save game ads to file
async function saveGameAds(gameAds: GameAd[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify({ gameAds }, null, 2))
}

export async function GET() {
  try {
    const gameAds = await loadGameAds()
    return NextResponse.json({ gameAds })
  } catch (error) {
    console.error('Error loading game ads:', error)
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

    // Load existing game ads
    const gameAds = await loadGameAds()

    // Add timestamps
    gameAd.createdAt = new Date().toISOString()
    gameAd.updatedAt = new Date().toISOString()

    // Add the new game ad
    gameAds.push(gameAd)

    // Save to file
    await saveGameAds(gameAds)

    return NextResponse.json(gameAd)
  } catch (error) {
    console.error('Error creating game ad:', error)
    return NextResponse.json(
      { error: 'Failed to create game ad' },
      { status: 500 }
    )
  }
} 