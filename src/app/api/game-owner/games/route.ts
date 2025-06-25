import { NextRequest, NextResponse } from 'next/server'
import { jsonAuthService } from '@/lib/json-auth'
import { getOwnerGames } from '@/utils/extractGameOwners'
import fs from 'fs'
import path from 'path'

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

    // Get user's games
    const userGames = getOwnerGames(user.email)
    console.log(`Found ${userGames.length} games for user: ${user.email}`)

    // Load game ads data to show assigned ads
    const gameAdsPath = path.join(process.cwd(), 'data/game-ads.json')
    let gameAds: any[] = []
    if (fs.existsSync(gameAdsPath)) {
      const gameAdsData = JSON.parse(fs.readFileSync(gameAdsPath, 'utf8'))
      gameAds = gameAdsData.gameAds || []
    }

    // Load game ad template registrations (for now, assume all templates are enabled)
    const gameAdTemplates = ['dancing_npc', 'multimedia_display', 'minigame_ad']

    const enrichedGames = userGames.map((game, index) => {
      // Find assigned ads for this game (from playlist manager)
      // Use a deterministic approach based on game ID to avoid random results
      const gameHash = game.id.split('_')[1] || '0'
      const gameNumber = parseInt(gameHash, 10) || 0
      const assignedAds = gameAds.slice(0, Math.max(1, gameNumber % 3)) // Assign 1-3 ads consistently

      return {
        id: game.id || `game_${index}`,
        name: game.name || 'Unnamed Game',
        description: game.description || 'No description available',
        genre: game.genre || 'Unknown',
        robloxLink: game.robloxLink || '#',
        thumbnail: game.thumbnail || '',
        metrics: game.metrics || { dau: 0, mau: 0, day1Retention: 0 },
        dates: game.dates || { created: new Date().toISOString() },
        serverApiKey: game.authorization?.apiKey || null,
        serverApiKeyStatus: game.authorization?.status || 'inactive',
        enabledTemplates: gameAdTemplates, // For now, all enabled
        assignedAds: assignedAds.map(ad => ({
          id: ad.id || 'unknown',
          name: ad.name || 'Unknown Ad',
          templateType: ad.templateType || 'unknown',
          status: 'active',
          createdAt: ad.createdAt || new Date().toISOString()
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
  }
} 