export type AssetType = 'kol_character' | 'hat' | 'clothing' | 'item' | 'audio' | 'animation' | 'shoes' | 'multi_display';

// Asset in the assets.json database
export interface AssetData {
  id: string
  name: string
  description?: string
  assetType: AssetType
  robloxAssetId: string
  previewUrl?: string
  properties?: Record<string, any>
}

// Asset in a game ad
export interface Asset {
  assetType: AssetType
  assetId: string
  robloxAssetId: string
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
  assets: Asset[];
}

export const GAME_AD_TEMPLATES: GameAdTemplate[] = [
  {
    id: 'multimedia_display',
    name: 'Multi-media Display Ad',
    description: 'Create an engaging multi-media display combining signage and media assets',
    thumbnail: '/templates/multimedia-display.png',
    requiredAssetTypes: ['multi_display', 'audio']
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
    requiredAssetTypes: ['multi_display', 'audio']
  }
]; 