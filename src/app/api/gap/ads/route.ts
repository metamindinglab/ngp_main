import { NextRequest, NextResponse } from 'next/server'
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
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'

    // Build where clause
    const where: any = {
      brandUserId: auth.userId
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (type !== 'all') {
      where.type = type
    }

    // Fetch game ads with performance data
    const gameAds = await (prisma as any).gameAd.findMany({
      where,
      include: {
        performance: {
          orderBy: { date: 'desc' },
          take: 1 // Get latest performance data
        },
        games: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform data for GAP frontend
    const transformedAds = gameAds.map((ad: any) => {
      const latestPerformance = ad.performance[0]
      const metrics = latestPerformance?.metrics || {}
      
      return {
        id: ad.id,
        name: ad.name,
        type: ad.type,
        status: getAdStatus(ad, latestPerformance),
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        ctr: metrics.clickThroughRate || 0,
        createdAt: ad.createdAt.toISOString(),
        updatedAt: ad.updatedAt.toISOString(),
        games: ad.games,
        assets: ad.assets
      }
    })

    return NextResponse.json({
      success: true,
      ads: transformedAds,
      total: transformedAds.length
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
        type,
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
      // Required: multiMediaSignage + (image OR video), Optional: audio
      const hasSignage = assetTypes.includes('multiMediaSignage')
      const hasImage = assetTypes.includes('image')
      const hasVideo = assetTypes.includes('video')
      
      if (!hasSignage) {
        return { isValid: false, error: 'Multimedia signage is required for display ads' }
      }
      if (!hasImage && !hasVideo) {
        return { isValid: false, error: 'Either image or video content is required for display ads' }
      }
      if (hasImage && hasVideo) {
        return { isValid: false, error: 'Cannot have both image and video content for display ads' }
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