import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { addCorsHeaders, handleAuth, applyRateLimit, addRateLimitHeaders, handleOptions } from '../../middleware'

const prisma = new PrismaClient()

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// Get game ads for authenticated game
export async function GET(request: NextRequest) {
  try {
    // Handle authentication
    const auth = await handleAuth(request)
    if (!auth.isValid) {
      const response = NextResponse.json({ error: auth.error }, { status: 401 })
      return addCorsHeaders(response)
    }

    // Apply rate limiting
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')!
    const rateLimit = applyRateLimit(apiKey)
    
    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
        { status: 429 }
      )
      addRateLimitHeaders(response, rateLimit)
      return addCorsHeaders(response)
    }

    // Get game ads for the authenticated game
    const gameAds = await prisma.gameAd.findMany({
      where: { gameId: auth.gameId },
      include: {
        performance: {
          orderBy: { date: 'desc' },
          take: 1 // Get latest performance data
        }
      }
    })

    const response = NextResponse.json({
      success: true,
      gameId: auth.gameId,
      ads: gameAds.map(ad => ({
        id: ad.id,
        name: ad.name,
        type: ad.type,
        assets: ad.assets,
        createdAt: ad.createdAt,
        updatedAt: ad.updatedAt,
        latestPerformance: ad.performance[0] || null
      }))
    })

    addRateLimitHeaders(response, rateLimit)
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Error fetching game ads:', error)
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return addCorsHeaders(response)
  } finally {
    await prisma.$disconnect()
  }
}

// Create new game ad
export async function POST(request: NextRequest) {
  try {
    // Handle authentication
    const auth = await handleAuth(request)
    if (!auth.isValid) {
      const response = NextResponse.json({ error: auth.error }, { status: 401 })
      return addCorsHeaders(response)
    }

    // Apply rate limiting
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')!
    const rateLimit = applyRateLimit(apiKey)
    
    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
        { status: 429 }
      )
      addRateLimitHeaders(response, rateLimit)
      return addCorsHeaders(response)
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.type) {
      const response = NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      )
      addRateLimitHeaders(response, rateLimit)
      return addCorsHeaders(response)
    }

    // Create the game ad
    const gameAd = await prisma.gameAd.create({
      data: {
        id: `ad_${Date.now()}`,
        gameId: auth.gameId!,
        name: body.name,
        type: body.type,
        assets: body.assets || {},
        updatedAt: new Date()
      }
    })

    const response = NextResponse.json({
      success: true,
      ad: {
        id: gameAd.id,
        name: gameAd.name,
        type: gameAd.type,
        createdAt: gameAd.createdAt
      }
    }, { status: 201 })

    addRateLimitHeaders(response, rateLimit)
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Error creating game ad:', error)
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return addCorsHeaders(response)
  } finally {
    await prisma.$disconnect()
  }
} 