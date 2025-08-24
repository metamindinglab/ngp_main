import { NextRequest, NextResponse } from 'next/server';
import { RobloxDataFetcher } from '@/lib/roblox-data-fetcher';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, universeId } = await request.json();

    if (!apiKey || !universeId) {
      return NextResponse.json(
        { error: 'API key and Universe ID are required' },
        { status: 400 }
      );
    }

    const fetcher = new RobloxDataFetcher(apiKey, parseInt(universeId));
    const gameInfoResult = await fetcher.fetchGameInfo();

    if (!gameInfoResult.success) {
      return NextResponse.json(
        { error: gameInfoResult.error || 'Failed to fetch game data' },
        { status: 500 }
      );
    }

    const gameInfo = gameInfoResult.data;
    
    // Debug logging to see what we're getting from RobloxDataFetcher
    console.log('🔍 Raw gameInfo from RobloxDataFetcher:', JSON.stringify(gameInfo, null, 2));
    
    // Get raw API data for accessing all fields
    const rawApiData = (gameInfo as any)?.rawApiData;
    
    // Transform the data to match what the frontend expects
    const transformedData = {
      name: gameInfo?.name || '',
      description: gameInfo?.description || '',
      genre: gameInfo?.gameSettings?.genre || '',
      subgenre: rawApiData?.genre_l1 || '', // Get from raw API data
      subgenre2: rawApiData?.genre_l2 || '', // Get from raw API data
      thumbnailUrl: (gameInfo?.media?.thumbnails?.[0] as any)?.thumbnails?.[0]?.imageUrl || '',
      iconUrl: gameInfo?.media?.icons?.[0]?.imageUrl || '',
      universeUrl: `https://www.roblox.com/games/${universeId}`,
      placeId: gameInfo?.placeId || 0,
      universeId: gameInfo?.universeId || parseInt(universeId),
      creator: gameInfo?.creator || { id: 0, type: 'User', name: 'Unknown' },
      stats: gameInfo?.stats || {
        playing: 0,
        visits: 0,
        favorites: 0,
        likes: 0,
        dislikes: 0
      },
      gameSettings: gameInfo?.gameSettings || {
        maxPlayers: 0,
        allowCopying: false,
        allowedGearTypes: [],
        universeAvatarType: 'MorphToR6',
        genre: 'All',
        isAllGenres: false,
        isFavoritedByUser: false,
        price: null
      },
      servers: gameInfo?.servers || [],
      media: gameInfo?.media || { thumbnails: [], icons: [] },
      // Add date information from the raw API response
      dates: {
        created: rawApiData?.created || '',
        updated: rawApiData?.updated || '',
        lastFetched: new Date().toISOString()
      },
      // Add activity status
      isActive: (gameInfo?.stats?.playing || 0) > 0,
      // Add all images for the Media tab
      images: [
        // Thumbnails
        ...(gameInfo?.media?.thumbnails?.[0] as any)?.thumbnails?.map((thumb: any, index: number) => ({
          id: `thumbnail_${index}`,
          type: 'thumbnail',
          title: `Game Thumbnail ${index + 1}`,
          url: thumb.imageUrl,
          targetId: thumb.targetId,
          state: thumb.state,
          version: thumb.version
        })) || [],
        // Icons
        ...gameInfo?.media?.icons?.map((icon: any, index: number) => ({
          id: `icon_${index}`,
          type: 'icon',
          title: `Game Icon ${index + 1}`,
          url: icon.imageUrl,
          targetId: icon.targetId,
          state: icon.state,
          version: icon.version
        })) || []
      ]
    };

    console.log('🎯 Transformed data being sent to frontend:', JSON.stringify(transformedData, null, 2));
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching game data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game data' },
      { status: 500 }
    );
  }
} 