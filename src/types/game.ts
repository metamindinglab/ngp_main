// Authorization types
export interface RobloxAuthorization {
  type: 'api_key' | 'oauth';
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  lastVerified?: string;
  status: 'active' | 'expired' | 'invalid' | 'unverified';
}

export interface GameMedia {
  id: string;
  type: string;
  title: string | null;
  localPath: string;
  thumbnailUrl: string | null;
}

export interface Game {
  id: string;
  name: string;
  robloxLink: string;
  genre: string;
  description: string;
  metrics: {
    dau: number;
    mau: number;
    day1Retention: number;
    topGeographicPlayers: {
      country: string;
      percentage: number;
    }[];
  };
  latestMetrics?: {
    dau: number;
    mau: number;
    day1Retention: number;
    topGeographicPlayers?: {
      country: string;
      percentage: number;
    }[];
  };
  dates: {
    created: string;
    lastUpdated: string;
    mgnJoined: string;
  };
  owner: {
    name: string;
    discordId: string;
    email: string;
    country: string;
    robloxId?: string;
  };
  robloxAuthorization?: {
    type: 'api_key' | 'oauth';
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    lastVerified?: string;
    status: 'active' | 'expired' | 'invalid' | 'unverified';
  };
  thumbnail?: string;
  thumbnailUrl?: string;
  media: GameMedia[];
  serverApiKey?: string;
  serverApiKeyCreatedAt?: string;
  serverApiKeyStatus?: string;
  enabledTemplates?: string[];
  assignedAds?: Array<{
    id: string;
    name: string;
    templateType: string;
    status: string;
    createdAt: string;
  }>;
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
    // Additional fields from enhanced integration
    subgenre?: string;
    subgenre2?: string;
    isActive?: boolean;
    dates?: {
      created: string;
      updated: string;
      lastFetched: string;
    };
    images?: Array<{
      id: string;
      type: string;
      title: string;
      url: string;
      targetId?: number;
      state?: string;
      version?: string;
    }>;
    media?: {
      images: Array<{
        id: string;
        type: string;
        title?: string;
        localPath: string;
        thumbnailUrl?: string;
      }>;
      videos: Array<{
        id: string;
        type: string;
        title?: string;
        localPath: string;
        thumbnailUrl?: string;
      }>;
    };
  };
} 