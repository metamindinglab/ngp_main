import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/downloadToken'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')
    if (!apiKey || !apiKey.startsWith('RBXG-')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const game = await prisma.game.findFirst({ where: { serverApiKey: apiKey } })
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    const body = await request.json().catch(() => ({}))
    const type = (body?.type as 'bootstrap' | 'container') || 'bootstrap'
    const containerId = body?.containerId as string | undefined
    if (type === 'container' && !containerId) return NextResponse.json({ error: 'containerId required' }, { status: 400 })
    const exp = Math.floor(Date.now() / 1000) + 60 * 10 // 10 minutes
    const token = signToken({ type, gameId: game.id, containerId, exp })
    return NextResponse.json({ token, exp })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to issue token', message: e?.message }, { status: 500 })
  }
}


