import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/v1/games/[gameId]/containers
export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const { gameId } = params

    // Auth via X-API-Key (server key issued for the game)
    const apiKey = request.headers.get('X-API-Key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game || game.serverApiKey !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized or game not found' }, { status: 401 })
    }

    const containers = await prisma.adContainer.findMany({
      where: { gameId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        position: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ gameId, total: containers.length, containers })
  } catch (error) {
    console.error('[DEBUG] Error fetching game containers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


