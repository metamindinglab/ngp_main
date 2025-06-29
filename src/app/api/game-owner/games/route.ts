import { NextRequest, NextResponse } from 'next/server'
import { jsonAuthService } from '@/lib/json-auth'
import { PrismaClient, Game as PrismaGame, GameAd, GameMedia, Prisma } from '@prisma/client'
import { Game } from '@/types/game'

const prisma = new PrismaClient()

type GameWithRelations = PrismaGame & {
  ads: GameAd[]
  media: GameMedia[]
}

export async function GET(request: NextRequest) {
  try {
    // Get user from auth token
    const sessionToken = request.cookies.get('game-owner-session')?.value
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const user = await jsonAuthService.validateSession(sessionToken)
    if (!user || !user.gameOwnerId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get all games for this game owner
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
        },
        media: {
          select: {
            id: true,
            type: true,
            title: true,
            localPath: true,
            thumbnailUrl: true
          }
        }
      }
    }) as unknown as GameWithRelations[]

    console.log(`Found ${userGames.length} games for gameOwnerId: ${user.gameOwnerId}`)

    // Load game ad template registrations (for now, assume all templates are enabled)
    const gameAdTemplates = ['dancing_npc', 'multimedia_display', 'minigame_ad']

    const enrichedGames = userGames.map((game: GameWithRelations) => {
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
        owner: game.owner || { name: '', discordId: '', email: '', country: '' },
        robloxAuthorization: game.robloxAuthorization || { type: 'api_key', status: 'unverified' },
        serverApiKey: game.serverApiKey || null,
        serverApiKeyStatus: game.serverApiKeyStatus || 'inactive',
        enabledTemplates: gameAdTemplates, // For now, all enabled
        assignedAds: game.ads.map(ad => ({
          id: ad.id,
          name: ad.name,
          templateType: ad.type || 'unknown',
          status: ad.status || 'active',
          createdAt: ad.createdAt.toISOString()
        })),
        media: game.media
      }
    })

    // Calculate stats
    const stats = {
      totalGames: enrichedGames.length,
      activeApiKeys: enrichedGames.filter(g => g.serverApiKeyStatus === 'active').length,
      totalAssignedAds: enrichedGames.reduce((sum, g) => sum + g.assignedAds.length, 0)
    }

    return NextResponse.json({
      success: true,
      games: enrichedGames,
      stats
    })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      games: [],
      stats: { totalGames: 0, activeApiKeys: 0, totalAssignedAds: 0 }
    }, { status: 500 })
  }
} 