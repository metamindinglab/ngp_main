import { NextRequest, NextResponse } from 'next/server'
import { normalizeGameAdType } from '@/lib/ads/type-normalization'
import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to authenticate brand user
async function authenticateBrandUser(request: NextRequest) {
  try {
    const token = request.cookies.get('brandUserSessionToken')?.value
    
    if (!token) {
      return { isValid: false, error: 'No session token' }
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; type: string }
    
    if (decoded.type !== 'brand-user') {
      return { isValid: false, error: 'Invalid token type' }
    }

    const brandUser = await (prisma as any).brandUser.findUnique({
      where: { id: decoded.userId }
    })

    if (!brandUser || !brandUser.isActive) {
      return { isValid: false, error: 'User not found or inactive' }
    }

    return { isValid: true, userId: decoded.userId, user: brandUser }
  } catch (error) {
    return { isValid: false, error: 'Invalid token' }
  }
}

// GET - Fetch brand user's game ads
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = (searchParams.get('status') || 'all').toLowerCase()
    const type = (searchParams.get('type') || 'all').toLowerCase()

    // Build where clause
    const where: any = { brandUserId: auth.userId }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Do not filter by DB type here; we filter by normalized category after computing status

    // Fetch game ads with performance data
    const gameAds = await (prisma as any).gameAd.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        assets: true,
        games: { select: { id: true, name: true, thumbnail: true } },
        performance: {
          orderBy: { date: 'desc' },
          take: 1
        },
        BrandUser: { select: { id: true } },
        playlistSchedules: { select: { status: true, startDate: true, duration: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Compute aggregate performance (impressions/clicks) per ad
    const adIds = gameAds.map((a: any) => a.id)
    const agg = adIds.length > 0 ? await (prisma as any).gameAdPerformance.groupBy({
      by: ['gameAdId'],
      _sum: { views: true, touches: true },
      where: { gameAdId: { in: adIds } }
    }) : []
    const perfByAd: Record<string, { views: number, touches: number }> = {}
    for (const row of agg) {
      perfByAd[row.gameAdId] = {
        views: Number(row._sum?.views || 0),
        touches: Number(row._sum?.touches || 0)
      }
    }

    // Transform data for GAP frontend
    const transformedAds = gameAds.map((ad: any) => {
      const latestPerformance = ad.performance[0]
      const metrics = latestPerformance?.metrics || {}
      const now = new Date()
      const schedules = Array.isArray(ad.playlistSchedules) ? ad.playlistSchedules : []
      const hasActiveWindow = schedules.some((ps: any) => {
        const st = String(ps.status || '').toLowerCase()
        const start = new Date(ps.startDate)
        const end = new Date(start)
        end.setUTCDate(end.getUTCDate() + (ps.duration || 0))
        return st === 'active' && now >= start && now < end
      })
      const hasPending = schedules.some((ps: any) => {
        const st = String(ps.status || '').toLowerCase()
        const start = new Date(ps.startDate)
        return (st === 'active' && now < start) || st === 'scheduled'
      })
      const computedStatus = hasActiveWindow ? 'broadcasting' : (hasPending ? 'pending' : 'draft')
      const normalizedType = (() => {
        const t = String(ad.type || '').toLowerCase()
        if (t === 'multimedia_display' || t === 'display' || t === 'display_ad') return 'display'
        if (t === 'dancing_npc' || t === 'kol' || t === 'npc') return 'npc'
        if (t === 'minigame_ad' || t === 'minigame') return 'minigame'
        return 'display'
      })()
      
      const totals = perfByAd[ad.id] || { views: 0, touches: 0 }
      const ctr = totals.views > 0 ? (totals.touches / totals.views) * 100 : 0

      return {
        id: ad.id,
        name: ad.name,
        description: ad.description,
        type: ad.type,
        status: computedStatus,
        category: normalizedType,
        impressions: totals.views,
        clicks: totals.touches,
        ctr,
        createdAt: (ad.createdAt instanceof Date ? ad.createdAt : new Date(ad.createdAt)).toISOString(),
        updatedAt: (ad.updatedAt instanceof Date ? ad.updatedAt : new Date(ad.updatedAt)).toISOString(),
        games: ad.games,
        assets: ad.assets
      }
    })

    const filtered = transformedAds.filter((ad: any) => {
      const statusOk = status === 'all' || ad.status === status
      const typeOk = type === 'all' || ad.category === type
      return statusOk && typeOk
    })

    return NextResponse.json({
      success: true,
      ads: filtered,
      total: filtered.length
    })
  } catch (error) {
    console.error('Error fetching GAP ads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new game ad
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, description, assets } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Validate assets based on template type
    const assetValidation = validateTemplateAssets(type, assets)
    if (!assetValidation.isValid) {
      return NextResponse.json(
        { error: `Asset validation failed: ${assetValidation.error}` },
        { status: 400 }
      )
    }

    // Create the game ad (independent of games - associations happen through playlists)
    // We use a placeholder gameId to satisfy the schema constraint, but actual game associations are managed via playlists
    const gameAd = await (prisma as any).gameAd.create({
      data: {
        id: `gap_ad_${Date.now()}`,
        gameId: 'game_001', // Placeholder - actual game associations happen through playlists
        name,
        type: normalizeGameAdType(type),
        description: description || null,
        assets: assets || [],
        brandUserId: auth.userId,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      ad: {
        id: gameAd.id,
        name: gameAd.name,
        description: gameAd.description,
        type: gameAd.type,
        status: 'draft', // Default status for new ads
        impressions: 0, // Default metrics for new ads
        clicks: 0,
        ctr: 0,
        assets: gameAd.assets,
        brandUserId: gameAd.brandUserId,
        createdAt: gameAd.createdAt,
        updatedAt: gameAd.updatedAt
      }
    })
  } catch (error) {
    console.error('Error creating GAP ad:', error)
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 })
  }
}

// Helper function to determine ad status
function getAdStatus(ad: any, latestPerformance: any) {
  if (!latestPerformance) return 'draft'
  
  const metrics = latestPerformance.metrics || {}
  const impressions = metrics.impressions || 0
  
  if (impressions > 0) {
    // Check if ad is still active (has recent performance data)
    const lastActivity = new Date(latestPerformance.date)
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceActivity <= 7) return 'active'
    return 'paused'
  }
  
  return 'draft'
} 

// Helper function to validate template assets
function validateTemplateAssets(adType: string, assets: any[]) {
  if (!assets || !Array.isArray(assets)) {
    return { isValid: false, error: 'Assets array is required' }
  }

  const assetTypes = assets.map(asset => asset.assetType)

  switch (adType) {
    case 'multimedia_display':
      // Required: (image XOR video); Optional: audio. No signage required.
      const hasImage = assetTypes.includes('image')
      const hasVideo = assetTypes.includes('video')
      if ((!hasImage && !hasVideo)) {
        return { isValid: false, error: 'Display ad requires either an image or a video' }
      }
      if (hasImage && hasVideo) {
        return { isValid: false, error: 'Display ad cannot include both image and video' }
      }
      return { isValid: true }

    case 'dancing_npc':
      // Required: kol_character, clothing_top, clothing_bottom, shoes, animation
      // Optional: hat, item, audio
      const requiredKolTypes = ['kol_character', 'clothing_top', 'clothing_bottom', 'shoes', 'animation']
      const missingRequired = requiredKolTypes.filter(type => !assetTypes.includes(type))
      
      if (missingRequired.length > 0) {
        return { isValid: false, error: `Missing required assets: ${missingRequired.join(', ')}` }
      }
      return { isValid: true }

    case 'minigame_ad':
      // Required: minigame
      const hasMinigame = assetTypes.includes('minigame')
      
      if (!hasMinigame) {
        return { isValid: false, error: 'Minigame asset is required for minigame ads' }
      }
      return { isValid: true }

    default:
      return { isValid: false, error: 'Unknown ad type' }
  }
} 