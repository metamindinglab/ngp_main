export type AssetType = 
  | 'signage' 
  | 'billboard'
  | 'image' 
  | 'video'
  | 'kol_character'
  | 'hat'
  | 'clothing'
  | 'item'
  | 'shoes'
  | 'animation'
  | 'audio'
  | 'minigame';

export interface Asset {
  id: string;
  name: string;
  description: string;
  assetType: AssetType;
  previewUrl: string;
  robloxAssetId?: string;
  properties?: Record<string, any>;
}

export type GameAdTemplateType = 
  | 'multimedia_display'
  | 'dancing_npc'
  | 'minigame_ad';

export interface GameAdTemplate {
  id: GameAdTemplateType;
  name: string;
  description: string;
  thumbnail: string;
  requiredAssetTypes: AssetType[];
}

export interface GameAd {
  id: string;
  name: string;
  templateType: GameAdTemplateType;
  createdAt: string;
  updatedAt: string;
  assets: {
    assetType: AssetType;
    assetId: string;
  }[];
}

export const GAME_AD_TEMPLATES: GameAdTemplate[] = [
  {
    id: 'multimedia_display',
    name: 'Multi-media Display Ad',
    description: 'Create an engaging multi-media display combining signage and media assets',
    thumbnail: '/templates/multimedia-display.png',
    requiredAssetTypes: ['signage', 'billboard', 'image', 'video']
  },
  {
    id: 'dancing_npc',
    name: 'Dancing NPC Ad',
    description: 'Create an interactive NPC character with customizable appearance and animations',
    thumbnail: '/templates/dancing-npc.png',
    requiredAssetTypes: ['kol_character', 'hat', 'clothing', 'item', 'shoes', 'animation', 'audio']
  },
  {
    id: 'minigame_ad',
    name: 'Mini-game Ad',
    description: 'Create an interactive mini-game experience with brand integration',
    thumbnail: '/templates/minigame-ad.png',
    requiredAssetTypes: ['minigame', 'image']
  }
]; 