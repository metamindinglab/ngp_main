import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { adId: string } }) {
  try {
    const { gameIds } = await request.json()
    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json({ error: 'gameIds required' }, { status: 400 })
    }
    const values = gameIds.map((g) => `('${g}','${params.adId}')`).join(',')
    const sql = `INSERT INTO "_GameToAds" ("A","B") VALUES ${values} ON CONFLICT DO NOTHING`
    const result = await prisma.$executeRawUnsafe(sql)
    return NextResponse.json({ linked: result })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to link games' }, { status: 500 })
  }
}


