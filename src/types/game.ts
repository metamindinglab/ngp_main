// Authorization types
export interface RobloxAuthorization {
  type: 'api_key' | 'oauth';
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  lastVerified?: string;
  status: 'active' | 'expired' | 'invalid' | 'unverified';
}

export interface Game {
  id: string;
  name: string;
  description: string;
  genre: string;
  robloxLink: string;
  thumbnail: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Basic metrics
  metrics: {
    dau: number;
    mau: number;
    day1Retention: number;
    topGeographicPlayers: {
      country: string;
      percentage: number;
    }[];
  };

  // Dates information
  dates: {
    created: string;
    lastUpdated: string;
    mgnJoined: string;
    lastRobloxSync?: string;
  };

  // Owner information
  owner: {
    name: string;
    discordId: string;
    email: string;
    country: string;
  };

  // Authorization for Roblox Cloud API (for fetching game info FROM Roblox)
  robloxAuthorization?: {
    type: 'api_key' | 'oauth';
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    lastVerified?: string;
    status: 'active' | 'expired' | 'invalid' | 'unverified';
  };

  // Server API key (for games to connect TO our server)
  serverApiKey?: string;
  serverApiKeyCreatedAt?: string;
  serverApiKeyStatus?: string;

  // Additional Roblox information
  robloxInfo?: {
    placeId: number;
    universeId?: number;
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
    servers?: {
      id: string;
      maxPlayers: number;
      playing: number;
      fps: number;
      ping: number;
    }[];
    badges?: {
      id: number;
      name: string;
      description: string;
      enabled: boolean;
      statistics: {
        pastDayAwarded: number;
        totalAwarded: number;
      };
    }[];
    gameSettings?: {
      maxPlayers: number;
      allowCopying: boolean;
      allowedGearTypes: string[];
      universeAvatarType: string;
      genre: string;
      isAllGenres: boolean;
      isFavoritedByUser: boolean;
      price: number | null;
    };
    socialLinks?: {
      type: string;
      url: string;
      title: string;
    }[];
    media?: {
      images: {
        id: string;
        robloxId: number;
        type: string;
        approved: boolean;
        title?: string;
        altText?: string;
        localPath: string;
        thumbnailUrl: string;
        width: number;
        height: number;
        uploadedAt: string;
      }[];
      videos: {
        id: string;
        robloxId: string;
        type: string;
        approved: boolean;
        title: string;
        localPath: string;
        thumbnailUrl?: string;
        duration?: number;
        uploadedAt: string;
      }[];
    };
  };
} 