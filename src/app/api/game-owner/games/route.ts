import { NextRequest, NextResponse } from 'next/server'
import { jsonAuthService } from '@/lib/json-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('game-owner-session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await jsonAuthService.validateSession(sessionToken)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get user's games using gameOwnerId from database
    // Handle cases where gameOwnerId might be undefined
    if (!user.gameOwnerId) {
      console.log(`User ${user.email} has no gameOwnerId - returning empty games list`)
      return NextResponse.json({
        success: true,
        games: [],
        stats: {
          totalGames: 0,
          activeApiKeys: 0,
          totalAssignedAds: 0
        }
      })
    }

    const userGames = await prisma.game.findMany({
      where: {
        gameOwnerId: user.gameOwnerId
      },
      include: {
        ads: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    console.log(`Found ${userGames.length} games for gameOwnerId: ${user.gameOwnerId}`)

    // Load game ad template registrations (for now, assume all templates are enabled)
    const gameAdTemplates = ['dancing_npc', 'multimedia_display', 'minigame_ad']

    const enrichedGames = userGames.map((game) => {
      // Ensure robloxLink is a valid URL or fallback to a placeholder
      let robloxLink = game.robloxLink || '#'
      if (robloxLink !== '#' && !robloxLink.startsWith('http')) {
        robloxLink = `https://${robloxLink}`
      }

      return {
        id: game.id,
        name: game.name,
        description: game.description || 'No description available',
        genre: game.genre || 'Unknown',
        robloxLink: robloxLink,
        thumbnail: game.thumbnail || '/games/default-game.png',
        metrics: game.metrics || { dau: 0, mau: 0, day1Retention: 0 },
        dates: game.dates || { created: new Date().toISOString() },
        serverApiKey: game.serverApiKey || null,
        serverApiKeyStatus: game.serverApiKeyStatus || 'inactive',
        enabledTemplates: gameAdTemplates, // For now, all enabled
        assignedAds: game.ads.map(ad => ({
          id: ad.id,
          name: ad.name,
          templateType: ad.type || 'unknown',
          status: ad.status || 'active',
          createdAt: ad.createdAt.toISOString()
        }))
      }
    })

    return NextResponse.json({
      success: true,
      games: enrichedGames,
      stats: {
        totalGames: enrichedGames.length,
        activeApiKeys: enrichedGames.filter(g => g.serverApiKeyStatus === 'active').length,
        totalAssignedAds: enrichedGames.reduce((sum, g) => sum + g.assignedAds.length, 0)
      }
    })
  } catch (error) {
    console.error('Get games error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get games' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 