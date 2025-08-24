import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function normalizeStatus(status?: string) {
  if (!status) return 'ACTIVE'
  const s = status.toUpperCase()
  return ['ACTIVE', 'INACTIVE', 'PENDING'].includes(s) ? s : 'ACTIVE'
}

// GET /api/v1/schedules?gameAdId=...&gameId=... (optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameAdId = searchParams.get('gameAdId') || undefined
    const gameId = searchParams.get('gameId') || undefined

    const schedules = await prisma.playlistSchedule.findMany({
      where: {
        gameAdId,
        deployments: gameId ? { some: { gameId } } : undefined as any
      },
      include: { deployments: true }
    })
    return NextResponse.json({ total: schedules.length, schedules })
  } catch (error) {
    console.error('[schedules][GET] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/schedules
// { playlistId, gameAdId, startDate, duration, status?, deployments?: [{gameId, status?}] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const status = normalizeStatus(body.status)
    const schedule = await prisma.playlistSchedule.create({
      data: {
        playlistId: body.playlistId,
        gameAdId: body.gameAdId,
        startDate: new Date(body.startDate || Date.now()),
        duration: Number(body.duration || 0),
        endDate: new Date(new Date(body.startDate || Date.now()).getTime() + (Number(body.duration || 0) * 24 * 60 * 60 * 1000)),
        status,
        updatedAt: new Date(),
        deployments: body.deployments && Array.isArray(body.deployments)
          ? { create: body.deployments.map((d: any) => ({ gameId: d.gameId, status: normalizeStatus(d.status), updatedAt: new Date() })) }
          : undefined
      },
      include: { deployments: true }
    })
    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('[schedules][POST] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


