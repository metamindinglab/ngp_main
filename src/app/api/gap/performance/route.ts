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

// GET - Fetch performance data for brand user's ads
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const adId = searchParams.get('adId')
    const dateRange = searchParams.get('dateRange') || '7d'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    let dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    } else {
      const now = new Date()
      const daysBack = dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 7
      const pastDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
      dateFilter = {
        date: {
          gte: pastDate,
          lte: now
        }
      }
    }

    // Build where clause for performance data
    const performanceWhere: any = {
      ...dateFilter,
      ad: {
        brandUserId: auth.userId
      }
    }

    if (adId && adId !== 'all') {
      performanceWhere.gameAdId = adId
    }

    // Fetch performance data
    const performanceData = await (prisma as any).gameAdPerformance.findMany({
      where: performanceWhere,
      include: {
        ad: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Fetch brand user's ads for filtering
    const userAds = await (prisma as any).gameAd.findMany({
      where: { brandUserId: auth.userId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true
      }
    })

    // Process performance data
    const processedData = processPerformanceData(performanceData)

    return NextResponse.json({
      success: true,
      data: {
        performance: processedData,
        ads: userAds,
        dateRange: {
          start: dateFilter.date?.gte?.toISOString(),
          end: dateFilter.date?.lte?.toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Error fetching GAP performance data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to process performance data
function processPerformanceData(performanceData: any[]) {
  if (!performanceData.length) {
    return {
      metrics: {
        totalImpressions: 0,
        totalClicks: 0,
        totalEngagements: 0,
        averageCTR: 0,
        averageEngagementTime: 0,
        conversionRate: 0
      },
      trends: [],
      demographics: {
        ageGroup: {},
        gender: {},
        country: {}
      },
      campaigns: []
    }
  }

  // Calculate aggregate metrics
  let totalImpressions = 0
  let totalClicks = 0
  let totalEngagements = 0
  let totalEngagementTime = 0
  let totalConversions = 0
  const trendData: any[] = []
  const campaignData: any = {}
  const demographics = {
    ageGroup: {} as Record<string, number>,
    gender: {} as Record<string, number>,
    country: {} as Record<string, number>
  }

  performanceData.forEach(item => {
    const metrics = item.metrics || {}
    const demoData = item.demographics || {}
    const engagements = item.engagements || {}

    // Aggregate metrics
    const impressions = metrics.impressions || 0
    const clicks = metrics.clicks || 0
    const engagementCount = metrics.engagements || 0
    const engagementTime = metrics.engagementTime || 0
    const conversions = metrics.conversions || 0

    totalImpressions += impressions
    totalClicks += clicks
    totalEngagements += engagementCount
    totalEngagementTime += engagementTime
    totalConversions += conversions

    // Trend data
    trendData.push({
      date: item.date.toISOString().split('T')[0],
      impressions,
      clicks,
      engagements: engagementCount,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      engagementTime
    })

    // Campaign data
    if (item.ad) {
      if (!campaignData[item.ad.id]) {
        campaignData[item.ad.id] = {
          id: item.ad.id,
          name: item.ad.name,
          type: item.ad.type,
          impressions: 0,
          clicks: 0,
          engagements: 0,
          ctr: 0
        }
      }
      campaignData[item.ad.id].impressions += impressions
      campaignData[item.ad.id].clicks += clicks
      campaignData[item.ad.id].engagements += engagementCount
    }

    // Demographics aggregation
    if (demoData.ageGroup) {
      Object.entries(demoData.ageGroup).forEach(([key, value]: [string, any]) => {
        demographics.ageGroup[key] = (demographics.ageGroup[key] || 0) + (value || 0)
      })
    }

    if (demoData.gender) {
      Object.entries(demoData.gender).forEach(([key, value]: [string, any]) => {
        demographics.gender[key] = (demographics.gender[key] || 0) + (value || 0)
      })
    }

    if (demoData.country) {
      Object.entries(demoData.country).forEach(([key, value]: [string, any]) => {
        demographics.country[key] = (demographics.country[key] || 0) + (value || 0)
      })
    }
  })

  // Calculate CTR for campaigns
  Object.values(campaignData).forEach((campaign: any) => {
    campaign.ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0
  })

  // Sort trend data by date
  trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    metrics: {
      totalImpressions,
      totalClicks,
      totalEngagements,
      averageCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      averageEngagementTime: performanceData.length > 0 ? totalEngagementTime / performanceData.length : 0,
      conversionRate: totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0
    },
    trends: trendData,
    demographics,
    campaigns: Object.values(campaignData)
  }
} 