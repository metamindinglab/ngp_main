import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addCorsHeaders, handleAuth, applyRateLimit, addRateLimitHeaders, handleOptions } from '../middleware';

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameAdId = searchParams.get('gameAdId');
    const gameId = searchParams.get('gameId');

    let query = {};
    if (gameAdId) {
      query = { ...query, gameAdId };
    }
    if (gameId) {
      query = { ...query, gameId };
    }

    const performanceData = await prisma.gameAdPerformance.findMany({
      where: query,
      include: {
        gameAd: {
          include: {
            game: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ performanceData });
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
    
    const newPerformance = await prisma.gameAdPerformance.create({
      data: {
        gameAdId: performance.gameAdId,
        gameId: auth.gameId!, // Use authenticated game ID for security
        playlistId: performance.playlistId,
        date: new Date(performance.date || Date.now()),
        metrics: performance.metrics || {},
        demographics: performance.demographics || {},
        engagements: performance.engagements || {},
        playerDetails: performance.playerDetails || {},
        timeDistribution: performance.timeDistribution || {},
        performanceTrends: performance.performanceTrends || {}
      },
      include: {
        gameAd: true
      }
    });
    
    const response = NextResponse.json({ 
      success: true, 
      performance: newPerformance,
      gameId: auth.gameId
    })

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
        gameAd: true
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