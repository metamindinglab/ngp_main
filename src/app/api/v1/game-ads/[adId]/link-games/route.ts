import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/v1/game-ads/[adId]/link-games { gameIds: string[] }
export async function POST(request: NextRequest, { params }: { params: { adId: string } }) {
  try {
    const body = await request.json()
    const gameIds: string[] = Array.isArray(body.gameIds) ? body.gameIds : []
    if (gameIds.length === 0) return NextResponse.json({ linked: 0 })

    // Upsert links via raw due to M2M table
    const values = gameIds.map((g) => `('${g}','${params.adId}')`).join(',')
    const sql = `INSERT INTO "_GameToAds" ("A","B") VALUES ${values} ON CONFLICT DO NOTHING`
    // @ts-expect-error raw
    const result = await prisma.$executeRawUnsafe(sql)
    return NextResponse.json({ linked: result })
  } catch (error) {
    console.error('[link-games][POST] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


