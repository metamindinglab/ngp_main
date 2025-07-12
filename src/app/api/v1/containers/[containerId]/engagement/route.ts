import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleAuth, applyRateLimit, addRateLimitHeaders } from '@/app/api/middleware'
import { randomUUID } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { containerId: string } }
) {
  try {
    // Validate API key and rate limiting
    const auth = await handleAuth(request)
    if (!auth.isValid || !auth.apiKey) {
      return NextResponse.json({ error: auth.error || 'Invalid API key' }, { status: 401 })
    }

    const rateLimit = applyRateLimit(auth.apiKey)
    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
      addRateLimitHeaders(response, rateLimit)
      return response
    }

    // Get container
    const container = await prisma.adContainer.findUnique({
      where: { id: params.containerId },
      include: {
        game: true,
        currentAd: true
      }
    })

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    // Verify the API key belongs to the game owner
    if (container.game.serverApiKey !== auth.apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get engagement data from request
    const body = await request.json()
    
    // Store engagement data
    const engagement = await prisma.adEngagement.create({
      data: {
        id: randomUUID(),
        containerId: container.id,
        adId: container.currentAd?.id,
        eventType: body.eventType,
        data: body.data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    const response = NextResponse.json({ success: true, engagementId: engagement.id })
    addRateLimitHeaders(response, rateLimit)
    return response
  } catch (error) {
    console.error('Error recording engagement:', error)
    return NextResponse.json(
      { error: 'Failed to record engagement' },
      { status: 500 }
    )
  }
} 