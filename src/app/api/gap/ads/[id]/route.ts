import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to authenticate brand user
async function authenticateBrandUser(request: NextRequest) {
  try {
    const token = request.cookies.get('brandUserSessionToken')?.value
    
    if (!token) {
      return { isValid: false, error: 'No session token' }
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; type: string }
    
    if (decoded.type !== 'brand-user') {
      return { isValid: false, error: 'Invalid token type' }
    }

    const brandUser = await (prisma as any).brandUser.findUnique({
      where: { id: decoded.userId }
    })

    if (!brandUser || !brandUser.isActive) {
      return { isValid: false, error: 'User not found or inactive' }
    }

    return { isValid: true, userId: decoded.userId, user: brandUser }
  } catch (error) {
    return { isValid: false, error: 'Invalid token' }
  }
}

// GET - Fetch specific game ad
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const gameAd = await (prisma as any).gameAd.findFirst({
      where: {
        id: params.id,
        brandUserId: auth.userId
      },
      include: {
        performance: {
          orderBy: { date: 'desc' },
          take: 10 // Get recent performance data
        },
        games: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        }
      }
    })

    if (!gameAd) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    const latestPerformance = gameAd.performance[0]
    const metrics = latestPerformance?.metrics || {}

    return NextResponse.json({
      success: true,
      ad: {
        id: gameAd.id,
        name: gameAd.name,
        type: gameAd.type,
        status: getAdStatus(gameAd, latestPerformance),
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        ctr: metrics.clickThroughRate || 0,
        createdAt: gameAd.createdAt.toISOString(),
        updatedAt: gameAd.updatedAt.toISOString(),
        games: gameAd.games,
        assets: gameAd.assets,
        performance: gameAd.performance
      }
    })
  } catch (error) {
    console.error('Error fetching GAP ad:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update game ad
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { id: adId } = params
    const body = await request.json()
    const { name, description, status, type, assets } = body

    // Validate required fields (at least one field to update)
    if (!name && !description && !status && !type && !assets) {
      return NextResponse.json({ error: 'At least one field to update is required' }, { status: 400 })
    }

    // Check if ad exists and belongs to the user
    const existingAd = await (prisma as any).gameAd.findFirst({
      where: {
        id: adId,
        brandUserId: auth.userId
      }
    })

    if (!existingAd) {
      return NextResponse.json({ error: 'Ad not found or access denied' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    }
    if (name !== undefined) updateData.name = name
    // if (description !== undefined) updateData.description = description  // Temporarily disabled - field doesn't exist in DB
    if (status !== undefined) updateData.status = status
    if (type !== undefined) updateData.type = type
    if (assets !== undefined) updateData.assets = assets

    // Update the ad
    const updatedAd = await (prisma as any).gameAd.update({
      where: { id: adId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      ad: updatedAd,
      message: 'Ad updated successfully'
    })

  } catch (error) {
    console.error('Error updating GAP ad:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete game ad
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { id: adId } = params

    // Check if ad exists and belongs to the user
    const existingAd = await (prisma as any).gameAd.findFirst({
      where: {
        id: adId,
        brandUserId: auth.userId
      }
    })

    if (!existingAd) {
      return NextResponse.json({ error: 'Ad not found or access denied' }, { status: 404 })
    }

    // Delete the ad
    await (prisma as any).gameAd.delete({
      where: { id: adId }
    })

    return NextResponse.json({
      success: true,
      message: 'Ad deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting GAP ad:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to determine ad status
function getAdStatus(ad: any, latestPerformance: any) {
  if (!latestPerformance) return 'draft'
  
  const metrics = latestPerformance.metrics || {}
  const impressions = metrics.impressions || 0
  
  if (impressions > 0) {
    // Check if ad is still active (has recent performance data)
    const lastActivity = new Date(latestPerformance.date)
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceActivity <= 7) return 'active'
    return 'paused'
  }
  
  return 'draft'
} 