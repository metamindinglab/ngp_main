import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRobloxDataFetcher, isValidUniverseId } from '@/lib/roblox-data-fetcher';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch the game from database
    const game = await prisma.game.findUnique({
      where: { id: params.id }
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check if game has Roblox authorization
    const robloxAuth = game.robloxAuthorization as any;
    if (!robloxAuth || !robloxAuth.apiKey || robloxAuth.status !== 'active') {
      return NextResponse.json(
        { error: 'No active Roblox API key found for this game' },
        { status: 400 }
      );
    }

    // Get universe ID from existing robloxInfo or from request body
    const body = await request.json().catch(() => ({}));
    const universeId = body.universeId || (game as any).robloxInfo?.universeId;

    if (!universeId || !isValidUniverseId(universeId)) {
      return NextResponse.json(
        { error: 'Valid universe ID is required' },
        { status: 400 }
      );
    }

    // Create Roblox data fetcher
    const fetcher = createRobloxDataFetcher(
      robloxAuth.apiKey,
      universeId,
      (game as any).robloxInfo?.placeId
    );

    // Fetch updated game information
    const gameInfoResponse = await fetcher.fetchGameInfo();
    
    if (!gameInfoResponse.success) {
      return NextResponse.json(
        { error: gameInfoResponse.error || 'Failed to fetch game information from Roblox' },
        { status: 500 }
      );
    }

    // Prepare updated robloxInfo
    const updatedRobloxInfo = {
      ...gameInfoResponse.data,
      lastUpdated: new Date().toISOString(),
      fetchedAt: new Date().toISOString()
    };

    // Update the game in database
    const updatedGame = await prisma.game.update({
      where: { id: params.id },
      data: {
        robloxInfo: updatedRobloxInfo,
        updatedAt: new Date()
      } as any
    });

    // Return the updated game with fresh Roblox data
    return NextResponse.json({
      success: true,
      game: updatedGame,
      robloxInfo: updatedRobloxInfo,
      refreshedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error refreshing Roblox data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method to check if refresh is available
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        robloxAuthorization: true,
        robloxInfo: true
      } as any
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const robloxAuth = game.robloxAuthorization as any;
    const robloxInfo = (game as any).robloxInfo;

    const canRefresh = !!(
      robloxAuth &&
      robloxAuth.apiKey &&
      robloxAuth.status === 'active' &&
      robloxInfo &&
      robloxInfo.universeId
    );

    return NextResponse.json({
      canRefresh,
      hasApiKey: !!(robloxAuth && robloxAuth.apiKey),
      hasUniverseId: !!(robloxInfo && robloxInfo.universeId),
      apiKeyStatus: robloxAuth?.status || 'unverified',
      lastUpdated: robloxInfo?.lastUpdated || null
    });

  } catch (error) {
    console.error('Error checking refresh availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 