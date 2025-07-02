import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonAuthService } from '@/lib/json-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { containerId: string } }
) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate session and get user
    const user = await jsonAuthService.validateSession(sessionToken)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { adId } = await request.json()

    // Verify container ownership
    const container = await prisma.gameAdContainer.findFirst({
      where: {
        id: params.containerId,
        game: {
          gameOwnerId: user.gameOwnerId
        }
      }
    })

    if (!container) {
      return NextResponse.json(
        { success: false, error: 'Container not found or access denied' },
        { status: 404 }
      )
    }

    // Verify ad assignment using _GameToAds table
    const gameToAd = await prisma.$queryRaw`
      SELECT * FROM "_GameToAds"
      WHERE "A" = ${container.gameId}
      AND "B" = ${adId}
      LIMIT 1
    `

    if (!gameToAd || (Array.isArray(gameToAd) && gameToAd.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Ad not found or not assigned to this game' },
        { status: 404 }
      )
    }

    // Update container with ad
    const updatedContainer = await prisma.gameAdContainer.update({
      where: {
        id: container.id
      },
      data: {
        currentAdId: adId
      },
      include: {
        game: {
          select: {
            id: true,
            name: true
          }
        },
        ad: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      container: updatedContainer
    })
  } catch (error) {
    console.error('Error assigning ad to container:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 