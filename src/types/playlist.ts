import { Game } from './game'
import { GameAd } from './gameAd'

export interface PlaylistSchedule {
  id: string;
  gameAdId: string;
  startDate: string;  // ISO string
  duration: number;   // in days
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface GameDeployment {
  id: string;
  gameId: string;
  scheduleId: string;
  deploymentStatus: 'pending' | 'deployed' | 'failed' | 'removed';
  deployedAt?: string;
  removedAt?: string;
  errorMessage?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  schedules: PlaylistSchedule[];
  deployments: GameDeployment[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

// Type for the form when creating/editing a playlist
export interface PlaylistFormData {
  name: string;
  description: string;
  schedules: {
    gameAdId: string;
    startDate: string;
    duration: number;
    selectedGames: string[];  // Array of game IDs
  }[];
} 