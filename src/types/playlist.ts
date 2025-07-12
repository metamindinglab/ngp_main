import { Game } from './game'
import { GameAd } from './gameAd'

export interface PlaylistSchedule {
  id: string;
  playlistId: string;
  gameAdId: string;
  startDate: string;  // ISO string
  duration: number;   // in days
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  deployments: GameDeployment[];
  gameAd: GameAd;
}

export interface GameDeployment {
  id: string;
  scheduleId: string;
  gameId: string;
  status: 'pending' | 'deployed' | 'failed' | 'removed';
  createdAt: string;
  updatedAt: string;
  game: Game;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  createdBy: string | null;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
  schedules: PlaylistSchedule[];
}

// Type for the form when creating/editing a playlist
export interface PlaylistFormData {
  name: string;
  description: string;
  schedules: {
    id?: string;  // Optional because it will be undefined for new schedules
    gameAdId: string;
    startDate: string;  // ISO string
    duration: number;
    selectedGames: string[];  // Array of game IDs
  }[];
} 