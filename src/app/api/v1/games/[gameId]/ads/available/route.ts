import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/v1/games/[gameId]/ads/available
export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameId = params.gameId

    // Validate API key
    const apiKey = request.headers.get('X-API-Key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    // Find game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { ads: true }
    })

    if (!game || game.serverApiKey !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized or game not found' }, { status: 401 })
    }

    // Get available ads via active schedules targeted to this game
    // Conditions:
    // - Ad is linked to this game (many-to-many)
    // - Has at least one PlaylistSchedule with status active (case-insensitive)
    // - Now within [startDate, startDate + duration)
    // - If GameDeployment table is present and used, schedule must have an active deployment to this game
    const now = new Date()
    const availableAds = await prisma.gameAd.findMany({
      where: {
        games: { some: { id: gameId } },
        playlistSchedules: {
          some: {
            OR: [
              { status: 'ACTIVE' },
              { status: 'active' }
            ],
            startDate: { lte: now },
            // End window check done in JS below as duration is an int
          }
        }
      },
      include: {
        playlistSchedules: true
      }
    })

    // Post-filter: check end window and optional GameDeployment targeting if present
    const filtered = [] as typeof availableAds
    for (const ad of availableAds) {
      const activeSchedules = ad.playlistSchedules.filter(ps => {
        // Interpret duration as DAYS
        const end = new Date(ps.startDate)
        end.setUTCDate(end.getUTCDate() + (ps.duration || 0))
        const inWindow = now >= new Date(ps.startDate) && now < end
        const statusOk = String(ps.status).toLowerCase() === 'active'
        return statusOk && inWindow
      })
      if (activeSchedules.length > 0) filtered.push(ad)
    }

    console.log(`[DEBUG] Fetched ${filtered.length} available ads for game ${gameId}`)

    return NextResponse.json({
      ads: filtered,
      total: filtered.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[DEBUG] Error fetching available ads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
