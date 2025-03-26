export interface RobloxGame {
  id: string;
  name: string;
  description: string;
  robloxLink: string;
  thumbnail: string | null;
  genre: string;
  dates: {
    created: string;
    lastUpdated: string;
  };
  robloxInfo?: {
    placeId: number;
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
      maxPlayers: number;
      playing: number;
      fps: number;
      ping: number;
    }>;
    media: {
      images: Array<{
        id: string;
        robloxId: string | null;
        type: 'Image';
        approved: boolean;
        title: string;
        localPath: string;
        thumbnailUrl: string | null;
        width: number;
        height: number;
        uploadedAt: string;
      }>;
      videos: Array<{
        id: string;
        robloxId: string | null;
        type: 'Video';
        approved: boolean;
        title: string;
        localPath: string;
        thumbnailUrl: string | null;
        width: number;
        height: number;
        uploadedAt: string;
      }>;
    };
  };
}

export interface RobloxGamesDatabase {
  version: string;
  lastUpdated: string;
  games: RobloxGame[];
} 