import { NextRequest, NextResponse } from 'next/server'
import { jsonAuthService } from '@/lib/json-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { containerId: string } }
) {
  try {
    // Get user from auth token
    const sessionToken = request.cookies.get('game-owner-session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await jsonAuthService.validateSession(sessionToken)
    if (!user || !user.gameOwnerId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
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
      },
      include: {
        game: true
      }
    })

    if (!container) {
      return NextResponse.json(
        { success: false, error: 'Container not found or access denied' },
        { status: 404 }
      )
    }

    // Verify ad assignment
    const ad = await prisma.gameAd.findFirst({
      where: {
        id: adId,
        gameId: container.gameId
      }
    })

    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'Ad not found or not assigned to this game' },
        { status: 404 }
      )
    }

    // Update container with new ad
    const updatedContainer = await prisma.gameAdContainer.update({
      where: {
        id: params.containerId
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
        currentAd: {
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