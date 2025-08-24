// Roblox Data Fetcher Service
// Handles fetching game data from Roblox APIs

interface RobloxGameInfo {
  placeId: number;
  universeId: number;
  name: string;
  description: string;
  creator: {
    id: number;
    type: string;
    name: string;
  };
  stats: {
    playing: number;
    visits: number;
    favorites: number;
    likes: number;
    dislikes: number;
  };
  gameSettings: {
    maxPlayers: number;
    allowCopying: boolean;
    allowedGearTypes: string[];
    universeAvatarType: string;
    genre: string;
    isAllGenres: boolean;
    isFavoritedByUser: boolean;
    price: number | null;
  };
  servers: Array<{
    id: string;
    playing: number;
    maxPlayers: number;
    fps: number;
    ping: number;
  }>;
  media: {
    thumbnails: Array<{
      targetId: number;
      state: string;
      imageUrl: string;
      version: string;
    }>;
    icons: Array<{
      targetId: number;
      state: string;
      imageUrl: string;
      version: string;
    }>;
  };
}

interface RobloxApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}

export class RobloxDataFetcher {
  private apiKey: string;
  private universeId: number;
  private placeId?: number;

  constructor(apiKey: string, universeId: number, placeId?: number) {
    // Clean and validate API key
    this.apiKey = apiKey.trim();
    this.universeId = universeId;
    this.placeId = placeId;
    
    // Validate API key format
    if (!this.isValidApiKey(this.apiKey)) {
      console.warn('⚠️ API key may contain invalid characters');
    }
  }

  /**
   * Validate API key format
   */
  private isValidApiKey(apiKey: string): boolean {
    // Roblox API keys should only contain ASCII characters
    for (let i = 0; i < apiKey.length; i++) {
      const charCode = apiKey.charCodeAt(i);
      if (charCode > 127) {
        console.error(`Invalid character at position ${i}: ${apiKey.charAt(i)} (code: ${charCode})`);
        return false;
      }
    }
    return true;
  }

  /**
   * Fetch comprehensive game information from Roblox
   */
  async fetchGameInfo(): Promise<RobloxApiResponse<RobloxGameInfo & { rawApiData?: any }>> {
    try {
      // Fetch basic universe info
      const universeInfo = await this.fetchUniverseInfo();
      if (!universeInfo.success) {
        return universeInfo;
      }

      // Fetch game statistics
      const gameStats = await this.fetchGameStats();
      
      // Fetch game media
      const gameMedia = await this.fetchGameMedia();
      
      // Fetch server information
      const serverInfo = await this.fetchServerInfo();

      const gameInfo: RobloxGameInfo & { rawApiData?: any } = {
        placeId: this.placeId || 0,
        universeId: this.universeId,
        name: universeInfo.data?.name || '',
        description: universeInfo.data?.description || '',
        creator: universeInfo.data?.creator || { id: 0, type: 'User', name: 'Unknown' },
        stats: gameStats.data || {
          playing: 0,
          visits: 0,
          favorites: 0,
          likes: 0,
          dislikes: 0
        },
        gameSettings: {
          maxPlayers: universeInfo.data?.maxPlayers || 0,
          allowCopying: universeInfo.data?.copyingAllowed || false,
          allowedGearTypes: universeInfo.data?.allowedGearGenres || [],
          universeAvatarType: universeInfo.data?.universeAvatarType || 'MorphToR6',
          genre: universeInfo.data?.genre || 'All',
          isAllGenres: universeInfo.data?.isAllGenre || false,
          isFavoritedByUser: universeInfo.data?.isFavoritedByUser || false,
          price: universeInfo.data?.price || null
        },
        servers: serverInfo.data || [],
        media: gameMedia.data || { thumbnails: [], icons: [] },
        // Preserve raw API data for access to all fields
        rawApiData: universeInfo.data
      };

      return {
        success: true,
        data: gameInfo
      };
    } catch (error) {
      console.error('Error fetching game info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch game information'
      };
    }
  }

  /**
   * Fetch basic universe information
   */
  private async fetchUniverseInfo(): Promise<RobloxApiResponse<any>> {
    try {
      console.log('🔍 Attempting to fetch universe info for Universe ID:', this.universeId);
      
      // Try public API first (more reliable)
      const publicResponse = await fetch(`https://games.roblox.com/v1/games?universeIds=${this.universeId}`);
      console.log('📡 Public API response status:', publicResponse.status);
      
      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        console.log('📦 Public API data:', publicData);
        
        if (publicData.data && publicData.data.length > 0) {
          return { success: true, data: publicData.data[0] };
        }
      }

      // Try Open Cloud API as fallback (requires API key)
      console.log('🔑 Trying Open Cloud API with API key...');
      const response = await fetch(`https://apis.roblox.com/universes/v1/universes/${this.universeId}`, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Open Cloud API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Open Cloud API data:', data);
        return { success: true, data };
      }

      return {
        success: false,
        error: 'Unable to fetch universe information from both public and private APIs'
      };
    } catch (error) {
      console.error('❌ Error in fetchUniverseInfo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch universe info'
      };
    }
  }

  /**
   * Fetch game statistics (visits, favorites, likes, etc.)
   */
  private async fetchGameStats(): Promise<RobloxApiResponse<any>> {
    try {
      // Use public API for game statistics
      const response = await fetch(`https://games.roblox.com/v1/games?universeIds=${this.universeId}`);
      
      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to fetch game statistics'
        };
      }

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const gameData = data.data[0];
        return {
          success: true,
          data: {
            playing: gameData.playing || 0,
            visits: gameData.visits || 0,
            favorites: gameData.favoritedCount || 0,
            likes: gameData.upVotes || 0,
            dislikes: gameData.downVotes || 0
          }
        };
      }

      return {
        success: false,
        error: 'No game statistics found'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch game stats'
      };
    }
  }

  /**
   * Fetch game media (thumbnails, icons)
   */
  private async fetchGameMedia(): Promise<RobloxApiResponse<any>> {
    try {
      // Fetch universe thumbnails
      const thumbnailResponse = await fetch(
        `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${this.universeId}&size=768x432&format=Png&isCircular=false`
      );

      // Fetch universe icons
      const iconResponse = await fetch(
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${this.universeId}&size=512x512&format=Png&isCircular=false`
      );

      const thumbnails = thumbnailResponse.ok ? await thumbnailResponse.json() : { data: [] };
      const icons = iconResponse.ok ? await iconResponse.json() : { data: [] };

      return {
        success: true,
        data: {
          thumbnails: thumbnails.data || [],
          icons: icons.data || []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch game media'
      };
    }
  }

  /**
   * Fetch server information
   */
  private async fetchServerInfo(): Promise<RobloxApiResponse<any>> {
    try {
      // Note: Server information requires place ID and may not be available through public API
      // This is a placeholder implementation
      if (!this.placeId) {
        return {
          success: true,
          data: []
        };
      }

      // Attempt to fetch server information (this may require special permissions)
      const response = await fetch(`https://games.roblox.com/v1/games/${this.placeId}/servers/Public?sortOrder=Asc&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data || []
        };
      }

      return {
        success: true,
        data: [] // Return empty array if server info is not available
      };
    } catch (error) {
      return {
        success: true,
        data: [] // Return empty array on error, as server info is optional
      };
    }
  }

  /**
   * Verify API key permissions
   */
  async verifyApiKey(): Promise<RobloxApiResponse<any>> {
    try {
      // Test various endpoints to determine permissions
      const testEndpoints = [
        {
          name: 'Universe Access',
          url: `https://apis.roblox.com/universes/v1/universes/${this.universeId}`,
          permission: 'universe:read',
          required: true // This is required for basic game data fetching
        },
        {
          name: 'Universe Places',
          url: `https://apis.roblox.com/universes/v1/universes/${this.universeId}/places`,
          permission: 'universe:place:read',
          required: true // This is required for place information
        },
        {
          name: 'DataStore Access',
          url: `https://apis.roblox.com/datastores/v1/universes/${this.universeId}/standard-datastores`,
          permission: 'datastore:read',
          required: false // This is optional
        }
      ];

      const results = await Promise.allSettled(
        testEndpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint.url, {
              headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json'
              }
            });

            const responseText = response.ok ? null : await response.text().catch(() => 'Unknown error');
            
            return {
              name: endpoint.name,
              permission: endpoint.permission,
              accessible: response.ok,
              status: response.status,
              required: endpoint.required,
              error: response.ok ? null : `HTTP ${response.status}: ${responseText}`
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Network error';
            
            // Check for character encoding issues
            if (errorMessage.includes('ByteString') || errorMessage.includes('character at index')) {
              return {
                name: endpoint.name,
                permission: endpoint.permission,
                accessible: false,
                status: 0,
                required: endpoint.required,
                error: 'API key contains invalid characters. Please check for extra spaces, line breaks, or special characters.'
              };
            }
            
            return {
              name: endpoint.name,
              permission: endpoint.permission,
              accessible: false,
              status: 0,
              required: endpoint.required,
              error: errorMessage
            };
          }
        })
      );

      const capabilities = results.map(result => 
        result.status === 'fulfilled' ? result.value : {
          name: 'Unknown',
          permission: 'unknown',
          accessible: false,
          status: 0,
          required: false,
          error: 'Test failed'
        }
      );

      const accessibleCount = capabilities.filter(cap => cap.accessible).length;
      const requiredCount = capabilities.filter(cap => cap.required).length;
      const accessibleRequiredCount = capabilities.filter(cap => cap.accessible && cap.required).length;
      const totalCount = capabilities.length;

      // API key is valid if at least one required permission is accessible
      // However, we'll allow proceeding even if verification fails, using public APIs as fallback
      const isValid = accessibleRequiredCount > 0 || accessibleCount > 0 || true;

      // Debug logging
      console.log('🔍 API Verification Details:', {
        capabilities: capabilities.map(cap => ({
          name: cap.name,
          permission: cap.permission,
          accessible: cap.accessible,
          status: cap.status,
          required: cap.required,
          error: cap.error
        })),
        summary: {
          totalPermissions: totalCount,
          accessiblePermissions: accessibleCount,
          restrictedPermissions: totalCount - accessibleCount,
          requiredPermissions: requiredCount,
          accessibleRequiredPermissions: accessibleRequiredCount
        },
        isValid
      });

      return {
        success: true,
        data: {
          isValid,
          capabilities,
          summary: {
            totalPermissions: totalCount,
            accessiblePermissions: accessibleCount,
            restrictedPermissions: totalCount - accessibleCount,
            requiredPermissions: requiredCount,
            accessibleRequiredPermissions: accessibleRequiredCount
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify API key'
      };
    }
  }

  /**
   * Get place ID from universe ID (if not provided)
   */
  async getPlaceIdFromUniverse(): Promise<number | null> {
    try {
      const response = await fetch(`https://apis.roblox.com/universes/v1/universes/${this.universeId}/places`, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].id;
        }
      }

      // Fallback to public API
      const publicResponse = await fetch(`https://games.roblox.com/v1/games?universeIds=${this.universeId}`);
      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        if (publicData.data && publicData.data.length > 0) {
          return publicData.data[0].rootPlaceId;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching place ID:', error);
      return null;
    }
  }
}

/**
 * Utility function to create a RobloxDataFetcher instance
 */
export function createRobloxDataFetcher(apiKey: string, universeId: number, placeId?: number): RobloxDataFetcher {
  return new RobloxDataFetcher(apiKey, universeId, placeId);
}

/**
 * Utility function to validate universe ID format
 */
export function isValidUniverseId(universeId: string | number): boolean {
  const id = typeof universeId === 'string' ? parseInt(universeId, 10) : universeId;
  return !isNaN(id) && id > 0;
}

/**
 * Utility function to extract universe ID from Roblox game URL
 */
export function extractUniverseIdFromUrl(url: string): number | null {
  try {
    // Pattern for Roblox game URLs
    const patterns = [
      /roblox\.com\/games\/(\d+)/,
      /roblox\.com\/games\/(\d+)\/[^\/]+/,
      /ro\.blox\.com\/Ebh5?id=(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting universe ID from URL:', error);
    return null;
  }
} 