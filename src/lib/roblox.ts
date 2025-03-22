import { RobloxAuthorization, Game } from '@/types/game'
import { downloadMedia, MediaStorageError, MediaMetadata } from './media-storage'

interface RobloxGameInfo {
  name: string;
  description: string;
  playing: number;
  visits: number;
  creator: {
    name: string;
    id: number;
    type: string;
  };
}

interface RobloxPublicGameInfo {
  id: number;
  rootPlaceId: number;
  name: string;
  description: string;
  sourceName: string;
  sourceDescription: string;
  creator: {
    id: number;
    type: string;
    name: string;
    hasVerifiedBadge: boolean;
  };
  price: number | null;
  allowedGearGenres: string[];
  allowedGearCategories: string[];
  isGenreEnforced: boolean;
  copyingAllowed: boolean;
  playing: number;
  visits: number;
  maxPlayers: number;
  created: string;
  updated: string;
  studioAccessToApisAllowed: boolean;
  createVipServersAllowed: boolean;
  universeAvatarType: string;
  genre: string;
  isAllGenre: boolean;
  isFavoritedByUser: boolean;
  favoritedCount: number;
}

interface RobloxServerInfo {
  id: string;
  maxPlayers: number;
  playing: number;
  playerTokens: string[];
  fps: number;
  ping: number;
}

interface RobloxMediaData {
  assetType: string;
  assetTypeId: number;
  imageId: number;
  videoHash: string | null;
  videoTitle: string | null;
  approved: boolean;
  altText: string | null;
}

export function extractPlaceId(url: string): number | null {
  try {
    const match = url.match(/\/games\/(\d+)/)
    return match ? parseInt(match[1]) : null
  } catch (error) {
    console.error('Error extracting place ID:', error)
    return null
  }
}

export async function getUniverseId(placeId: number): Promise<number> {
  try {
    console.log('Fetching universe ID for place:', placeId)
    
    // Use the correct endpoint for getting universe ID
    const response = await fetch(`/api/roblox/cloud/universes/v1/places/${placeId}/universe`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch universe ID:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Failed to fetch universe ID: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Universe ID response:', data)

    if (!data?.universeId) {
      throw new Error('Universe ID not found in response')
    }

    const universeId = data.universeId
    console.log('Successfully got universe ID:', universeId)
    return universeId
  } catch (error) {
    console.error('Error getting universe ID:', error)
    throw error
  }
}

export async function getRobloxGameInfo(placeId: string): Promise<Game> {
  try {
    // 1. First get the universe ID (most reliable method)
    const universeIdResponse = await fetch(`/api/roblox/cloud/universes/v1/places/${placeId}/universe`);
    if (!universeIdResponse.ok) {
      throw new Error(`Failed to fetch universe ID: ${universeIdResponse.statusText}`);
    }
    const universeIdData = await universeIdResponse.json();
    const universeId = universeIdData.universeId;
    
    console.log(`[Roblox] Successfully fetched universe ID: ${universeId}`);

    // 2. Get detailed game info using universe ID
    const gameInfoResponse = await fetch(`/api/roblox/games/v1/games?universeIds=${universeId}`);
    if (!gameInfoResponse.ok) {
      throw new Error(`Failed to fetch game info: ${gameInfoResponse.statusText}`);
    }
    const gameInfoData = await gameInfoResponse.json();
    
    if (!gameInfoData.data?.[0]) {
      throw new Error('No game data found in response');
    }

    const gameInfo = gameInfoData.data[0] as RobloxPublicGameInfo;
    console.log('[Roblox] Game info:', gameInfo);

    // 3. Initialize empty media info structure
    let thumbnail = '';
    let mediaInfo = {
      images: [],
      videos: []
    };

    // Use default thumbnail URL with correct format
    const fallbackUrl = `https://www.roblox.com/asset-thumbnail/image?assetId=${placeId}&width=768&height=432&format=png`;
    thumbnail = fallbackUrl;

    // 4. Get current player count and server information
    let currentPlayers = gameInfo.playing;
    let servers: Array<{
      id: string;
      maxPlayers: number;
      playing: number;
      fps: number;
      ping: number;
    }> = [];

    try {
      const serversResponse = await fetch(`/api/roblox/games/v1/games/${universeId}/servers/Public?sortOrder=Desc&limit=100`);
      if (serversResponse.ok) {
        const serversData = await serversResponse.json();
        if (serversData.data) {
          servers = serversData.data.map((server: RobloxServerInfo) => ({
            id: server.id,
            maxPlayers: server.maxPlayers,
            playing: server.playing,
            fps: server.fps,
            ping: server.ping
          }));
          currentPlayers = servers.reduce((total: number, server: { playing: number }) => total + server.playing, 0);
        }
      }
    } catch (error) {
      console.log('[Roblox] Failed to fetch server info:', error);
    }

    const currentDate = new Date().toISOString();

    // Construct the game object with all available data
    const game: Game = {
      id: placeId,
      name: gameInfo.name,
      description: gameInfo.description,
      genre: gameInfo.genre,
      robloxLink: `https://www.roblox.com/games/${placeId}`,
      metrics: {
        dau: 0, // Manually set in games.json
        mau: 0, // Manually set in games.json
        day1Retention: 0, // Manually set in games.json
        topGeographicPlayers: [] // Manually set in games.json
      },
      dates: {
        created: gameInfo.created,
        lastUpdated: gameInfo.updated,
        mgnJoined: currentDate,
        lastRobloxSync: currentDate
      },
      owner: {
        name: gameInfo.creator.name,
        discordId: '', // Manually set in games.json
        email: '', // Manually set in games.json
        country: '' // Manually set in games.json
      },
      robloxInfo: {
        placeId: parseInt(placeId, 10),
        universeId: parseInt(universeId.toString(), 10),
        creator: {
          name: gameInfo.creator.name,
          id: gameInfo.creator.id,
          type: gameInfo.creator.type
        },
        stats: {
          playing: currentPlayers,
          visits: gameInfo.visits,
          favorites: gameInfo.favoritedCount,
          likes: 0,
          dislikes: 0
        },
        servers,
        media: mediaInfo,
        gameSettings: {
          maxPlayers: gameInfo.maxPlayers,
          allowCopying: gameInfo.copyingAllowed,
          allowedGearTypes: gameInfo.allowedGearGenres,
          universeAvatarType: gameInfo.universeAvatarType,
          genre: gameInfo.genre,
          isAllGenres: gameInfo.isAllGenre,
          isFavoritedByUser: gameInfo.isFavoritedByUser,
          price: gameInfo.price
        }
      },
      thumbnail
    };

    console.log('[Roblox] Constructed game object:', game);
    return game;
  } catch (error) {
    console.error('[Roblox] Error fetching game info:', error);
    throw error;
  }
} 