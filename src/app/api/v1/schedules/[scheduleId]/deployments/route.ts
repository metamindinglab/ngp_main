import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function normalizeStatus(status?: string) {
  if (!status) return 'ACTIVE'
  const s = status.toUpperCase()
  return ['ACTIVE', 'INACTIVE', 'PENDING'].includes(s) ? s : 'ACTIVE'
}

export async function GET(request: NextRequest, { params }: { params: { scheduleId: string }}) {
  try {
    const rows = await prisma.gameDeployment.findMany({ where: { scheduleId: params.scheduleId }})
    return NextResponse.json({ total: rows.length, deployments: rows })
  } catch (error) {
    console.error('[deployments][GET] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { scheduleId: string }}) {
  try {
    const body = await request.json()
    const created = await prisma.gameDeployment.create({
      data: { scheduleId: params.scheduleId, gameId: body.gameId, status: normalizeStatus(body.status) }
    })
    return NextResponse.json({ deployment: created })
  } catch (error) {
    console.error('[deployments][POST] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { scheduleId: string }}) {
  try {
    const body = await request.json()
    const updated = await prisma.gameDeployment.update({
      where: { id: body.id },
      data: { status: normalizeStatus(body.status) }
    })
    return NextResponse.json({ deployment: updated })
  } catch (error) {
    console.error('[deployments][PUT] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


