// Base interface for all game objects
export interface BaseGameObject {
  id: string;
  type: 'display' | 'minigame' | 'npc';
  name: string;
  description?: string;
}

// Display object for images and videos
export interface DisplayObject extends BaseGameObject {
  type: 'display';
  assetId: string;
  assetType: 'image' | 'video';
  position?: {
    x: number;
    y: number;
    z: number;
  };
}

// Mini-game object that combines with display
export interface MiniGameObject extends BaseGameObject {
  type: 'minigame';
  miniGameAssetId: string;
  displayAssetId: string;
  maxPlayers: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  customizableElements?: {
    id: string;
    name: string;
    type: string;
    assetId: string;
  }[];
}

// Animated NPC object with multiple components
export interface NPCObject extends BaseGameObject {
  type: 'npc';
  characterAssetId: string;
  appearance: {
    clothingAssetId?: string;
    shoesAssetId?: string;
    handItemAssetId?: string;
  };
  animations: {
    defaultEmoteId?: string;
    customEmotes?: {
      [key: string]: string; // emote name -> asset id
    };
  };
  position?: {
    x: number;
    y: number;
    z: number;
  };
  behavior?: {
    type: 'static' | 'patrolling' | 'interactive';
    interactionRadius?: number;
    patrolPoints?: { x: number; y: number; z: number }[];
  };
}

// Union type for all game objects
export type GameObject = DisplayObject | MiniGameObject | NPCObject;

// Response types for API endpoints
export interface AuthResponse {
  sessionToken: string;
  gameId: string;
  gameName: string;
}

export interface GameObjectsResponse {
  objects: GameObject[];
}

export interface ErrorResponse {
  error: string;
} 