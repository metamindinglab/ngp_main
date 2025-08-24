import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleAuth, applyRateLimit, addRateLimitHeaders } from '@/app/api/middleware'
import { z } from 'zod'

// Position validation schema
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number()
})

export async function PUT(
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

    // Get and validate request body
    const body = await request.json()
    const validationResult = positionSchema.safeParse(body.position)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid position data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const position = validationResult.data

    // Get container and verify ownership
    const container = await prisma.adContainer.findUnique({
      where: { id: params.containerId },
      include: {
        game: {
          select: {
            id: true,
            serverApiKey: true
          }
        }
      }
    })

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    // Verify the API key belongs to the game that owns this container
    if (container.game.serverApiKey !== auth.apiKey) {
      return NextResponse.json({ error: 'Unauthorized - API key does not match container owner' }, { status: 403 })
    }

    // Update container position
    const updatedContainer = await prisma.adContainer.update({
      where: { id: params.containerId },
      data: {
        position: position,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        position: true,
        updatedAt: true
      }
    })

    // Log the position update as an engagement event
    await prisma.adEngagement.create({
      data: {
        containerId: params.containerId,
        adId: container.currentAdId,
        eventType: 'position_update',
        data: {
          timestamp: new Date().toISOString(),
          previousPosition: container.position,
          newPosition: position,
          source: 'game_api'
        }
      }
    })

    const response = NextResponse.json({ 
      success: true, 
      container: updatedContainer,
      message: 'Container position updated successfully'
    })
    addRateLimitHeaders(response, rateLimit)
    return response

  } catch (error) {
    console.error('Error updating container position:', error)
    return NextResponse.json(
      { error: 'Failed to update container position' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400'
    }
  })
} 