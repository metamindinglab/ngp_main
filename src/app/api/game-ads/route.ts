import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { GameAd } from '@/types/gameAd'

const DATA_FILE = path.join(process.cwd(), 'data', 'game-ads.json')
const CACHE_TTL = 60 * 1000 // 1 minute cache
const PAGE_SIZE = 10 // Number of items per page

let cachedGameAds: { data: GameAd[]; timestamp: number } | null = null

// Initialize data file if it doesn't exist
async function initDataFile() {
  try {
    await fs.access(DATA_FILE)
  } catch {
    // Create data directory if it doesn't exist
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    // Create initial data file with empty game ads array
    await fs.writeFile(DATA_FILE, JSON.stringify({ gameAds: [] }, null, 2))
  }
}

// Load game ads from cache or file
async function loadGameAds(): Promise<GameAd[]> {
  // Check cache first
  if (cachedGameAds && Date.now() - cachedGameAds.timestamp < CACHE_TTL) {
    return cachedGameAds.data
  }

  try {
    await initDataFile()
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    const gameAds = parsed.gameAds || []
    
    // Update cache
    cachedGameAds = {
      data: gameAds,
      timestamp: Date.now()
    }
    
    return gameAds
  } catch (error) {
    console.error('Error loading game ads:', error)
    return []
  }
}

// Save game ads to file and update cache
async function saveGameAds(gameAds: GameAd[]) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify({ gameAds }, null, 2))
    // Update cache
    cachedGameAds = {
      data: gameAds,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error('Error saving game ads:', error)
    throw new Error('Failed to save game ads')
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    
    const gameAds = await loadGameAds()
    
    // Filter by search term if provided
    const filteredAds = search
      ? gameAds.filter(ad => 
          ad.name.toLowerCase().includes(search.toLowerCase()) ||
          ad.description?.toLowerCase().includes(search.toLowerCase())
        )
      : gameAds

    // Calculate pagination
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const paginatedAds = filteredAds.slice(start, end)
    
    return NextResponse.json({
      gameAds: paginatedAds,
      total: filteredAds.length,
      page,
      totalPages: Math.ceil(filteredAds.length / PAGE_SIZE)
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'X-Cache': cachedGameAds ? 'HIT' : 'MISS'
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
    console.error('Error in POST /api/game-ads:', error)
    return NextResponse.json(
      { error: 'Failed to create game ad' },
      { status: 500 }
    )
  }
} 