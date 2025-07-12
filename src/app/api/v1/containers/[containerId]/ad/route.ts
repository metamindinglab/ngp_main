import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleAuth } from '@/app/api/middleware'
import type { Prisma, AdContainerType } from '@prisma/client'

// Default placeholder assets and properties by container type
const PLACEHOLDER_CONFIGS = {
  DISPLAY: {
    robloxAssetId: "rbxassetid://default_billboard",
    properties: {
      size: { width: 10, height: 5 },
      transparency: 0.1,
      surfaceGui: true
    }
  },
  NPC: {
    robloxAssetId: "rbxassetid://default_npc",
    properties: {
      animations: {
        idle: "rbxassetid://default_idle",
        walk: "rbxassetid://default_walk"
      },
      interactionRadius: 5
    }
  },
  MINIGAME: {
    robloxAssetId: "rbxassetid://default_trigger",
    properties: {
      size: { width: 10, height: 10, depth: 10 },
      transparency: 0.8,
      triggerEnabled: true
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { containerId: string } }
) {
  try {
    // Simple auth check - just verify the game's API key
    const auth = await handleAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Get container and ad information
    const container = await prisma.adContainer.findUnique({
      where: { 
        id: params.containerId,
        gameId: auth.gameId // Ensure container belongs to the game
      },
      select: {
        type: true,
        status: true,
        position: true,
        currentAd: {
          select: {
            id: true,
            assets: true,
            type: true
          }
        }
      }
    })

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    if (container.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Container is not active' }, { status: 403 })
    }

    // Track engagement
    await prisma.adEngagement.create({
      data: {
        containerId: params.containerId,
        adId: container.currentAd?.id,
        eventType: 'view',
        data: {
          timestamp: new Date().toISOString(),
          type: 'initial_load',
          containerType: container.type
        }
      }
    })

    // Get placeholder config for container type
    const placeholderConfig = PLACEHOLDER_CONFIGS[container.type as AdContainerType]

    // Prepare response
    const response = {
      hasAd: !!container.currentAd,
      adType: container.type,
      position: container.position,
      // If there's an active ad, use its assets, otherwise use placeholder
      assets: container.currentAd?.assets || [{
        type: container.type,
        robloxAssetId: placeholderConfig.robloxAssetId,
        properties: {
          ...placeholderConfig.properties,
          position: container.position
        }
      }],
      // Include type-specific configuration
      config: placeholderConfig.properties
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting ad content:', error)
    return NextResponse.json(
      { error: 'Failed to get ad content' },
      { status: 500 }
    )
  }
} 