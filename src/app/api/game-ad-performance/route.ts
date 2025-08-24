import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addCorsHeaders, handleAuth, applyRateLimit, addRateLimitHeaders, handleOptions } from '../middleware';
import { Prisma, GameAd } from '@prisma/client';

type JsonValue = string | number | boolean | { [key: string]: JsonValue } | JsonValue[];

interface Metrics {
  totalImpressions: number;
  uniqueImpressions: number;
  totalEngagements: number;
  uniqueEngagements: number;
  engagementRate: number;
  completionRate: number;
  conversionRate: number;
}

interface Demographics {
  gender: Record<string, number>;
  ageGroup: Record<string, number>;
  geographicRegion: Record<string, number>;
  language: Record<string, number>;
  deviceType: Record<string, number>;
  platform: Record<string, number>;
}

interface PerformanceTrends {
  daily: Array<{
    date: string;
    impressions: number;
    engagements: number;
    engagementRate: number;
  }>;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameAdId = searchParams.get('gameAdId');
    const gameId = searchParams.get('gameId');

    if (!gameAdId && !gameId) {
      return NextResponse.json(
        { error: 'Either gameAdId or gameId is required' },
        { status: 400 }
      );
    }

    let query = {};
    if (gameAdId) {
      query = { ...query, gameAdId };
    }
    if (gameId) {
      query = { ...query, gameId };
    }

    // First check if the game ad exists
    let gameAd = null;
    if (gameAdId) {
      gameAd = await prisma.gameAd.findUnique({
        where: { id: gameAdId },
        include: {
          games: true
        }
      });

      if (!gameAd) {
        return NextResponse.json(
          { error: 'Game ad not found' },
          { status: 404 }
        );
      }
    }

    const performanceData = await prisma.gameAdPerformance.findMany({
      where: query,
      include: {
        ad: {
          include: {
            games: {
              select: {
                id: true,
                name: true,
                thumbnail: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    if (!performanceData || performanceData.length === 0) {
      // If no performance data exists, fetch the game ad to get game relationships
      if (gameAdId) {
        const gameAd = await prisma.gameAd.findUnique({
          where: { id: gameAdId },
          include: {
            games: {
              select: {
                id: true,
                name: true,
                thumbnail: true
              }
            }
          }
        });

        if (gameAd) {
          const emptyMetrics: Metrics = {
            totalImpressions: 0,
            uniqueImpressions: 0,
            totalEngagements: 0,
            uniqueEngagements: 0,
            engagementRate: 0,
            completionRate: 0,
            conversionRate: 0
          };

          const emptyDemographics: Demographics = {
            gender: {},
            ageGroup: {},
            geographicRegion: {},
            language: {},
            deviceType: {},
            platform: {}
          };

          const emptyTrends: PerformanceTrends = {
            daily: []
          };

          return NextResponse.json({
            performanceData: [{
              id: 'no-data',
              gameAdId: gameAd.id,
              gameId: gameAd.games[0]?.id || null,
              date: new Date(),
              ad: gameAd,
              metrics: emptyMetrics,
              demographics: emptyDemographics,
              performanceTrends: emptyTrends,
              createdAt: new Date(),
              updatedAt: new Date()
            }]
          });
        }
      }
      return NextResponse.json({
        performanceData: []
      });
    }

    // Transform the data to match the expected format
    const transformedData = performanceData.map(perf => {
      const metricsData = perf.metrics as JsonValue;
      const metrics: Metrics = {
        totalImpressions: (metricsData as any)?.totalImpressions || 0,
        uniqueImpressions: (metricsData as any)?.uniqueImpressions || 0,
        totalEngagements: (metricsData as any)?.totalEngagements || 0,
        uniqueEngagements: (metricsData as any)?.uniqueEngagements || 0,
        engagementRate: (metricsData as any)?.engagementRate || 0,
        completionRate: (metricsData as any)?.completionRate || 0,
        conversionRate: (metricsData as any)?.conversionRate || 0
      };

      const demographicsData = perf.demographics as JsonValue;
      const demographics: Demographics = {
        gender: (demographicsData as any)?.gender || {},
        ageGroup: (demographicsData as any)?.ageGroup || {},
        geographicRegion: (demographicsData as any)?.geographicRegion || {},
        language: (demographicsData as any)?.language || {},
        deviceType: (demographicsData as any)?.deviceType || {},
        platform: (demographicsData as any)?.platform || {}
      };

      const trendsData = perf.performanceTrends as JsonValue;
      const performanceTrends: PerformanceTrends = {
        daily: (trendsData as any)?.daily || []
      };

      return {
        id: perf.id,
        gameAdId: perf.gameAdId,
        gameId: perf.gameId,
        date: perf.date,
        ad: perf.ad,
        metrics,
        demographics,
        performanceTrends,
        createdAt: perf.createdAt,
        updatedAt: perf.updatedAt
      };
    });

    return NextResponse.json({ 
      performanceData: transformedData 
    });
  } catch (error) {
    console.error('Error reading game ad performance:', error);
    return NextResponse.json(
      { error: 'Failed to read game ad performance' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle authentication for external Roblox games
    const auth = await handleAuth(request)
    if (!auth.isValid) {
      const response = NextResponse.json({ error: auth.error }, { status: 401 })
      return addCorsHeaders(response)
    }

    // Apply rate limiting
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')!
    const rateLimit = applyRateLimit(apiKey)
    
    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
        { status: 429 }
      )
      addRateLimitHeaders(response, rateLimit)
      return addCorsHeaders(response)
    }

    const performance = await request.json();
    
    // Generate a unique ID for the performance record
    const id = `perf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date();
    
    const data: Prisma.GameAdPerformanceUncheckedCreateInput = {
      id,
      gameAdId: performance.gameAdId,
      gameId: auth.gameId!, // Use authenticated game ID for security
      playlistId: performance.playlistId || null,
      date: new Date(performance.date || now),
      metrics: performance.metrics || {},
      demographics: performance.demographics || {},
      engagements: performance.engagements || {},
      playerDetails: performance.playerDetails || {},
      timeDistribution: performance.timeDistribution || {},
      performanceTrends: performance.performanceTrends || {},
      updatedAt: now
    };
    
    const newPerformance = await prisma.gameAdPerformance.create({
      data,
      include: {
        ad: true
      }
    });
    
    const response = NextResponse.json({ 
      success: true, 
      performance: newPerformance,
      gameId: auth.gameId
    });

    addRateLimitHeaders(response, rateLimit)
    return addCorsHeaders(response)
  } catch (error) {
    console.error('Error creating game ad performance:', error);
    const response = NextResponse.json(
      { error: 'Failed to create game ad performance' },
      { status: 500 }
    );
    return addCorsHeaders(response)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    
    const updatedPerformance = await prisma.gameAdPerformance.update({
      where: { id },
      data: {
        metrics: updates.metrics,
        demographics: updates.demographics,
        engagements: updates.engagements,
        playerDetails: updates.playerDetails,
        timeDistribution: updates.timeDistribution,
        performanceTrends: updates.performanceTrends,
        date: updates.date ? new Date(updates.date) : undefined
      },
      include: {
        ad: true
      }
    });
    
    return NextResponse.json({ success: true, performance: updatedPerformance });
  } catch (error) {
    console.error('Error updating game ad performance:', error);
    return NextResponse.json(
      { error: 'Failed to update game ad performance' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Game ad performance ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.gameAdPerformance.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game ad performance:', error);
    return NextResponse.json(
      { error: 'Failed to delete game ad performance' },
      { status: 500 }
    );
  }
} 