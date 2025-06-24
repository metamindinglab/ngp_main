export interface Asset {
  id: string;
  name: string;
  description: string;
  type: string;  // Our system's asset type (e.g., 'image', 'animation')
  assetType: string;  // Roblox's asset type (e.g., 'Decal', 'Animation')
  robloxAssetId: string;
  thumbnail?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;

  // Character specific fields
  characterType?: string;
  appearance?: {
    gender: string;
    style: string[];
    hairStyle: string;
    hairColor: string;
    height: string;
    features: string[];
  };
  personality?: string[];
  defaultAnimations?: string[];
  suitableFor?: {
    brands: string[];
    products: string[];
    gameTypes: string[];
  };
  marketingCapabilities?: string[];

  // Clothing specific fields
  image?: string;
  previewImage?: string;
  compatibility?: string[];
  brands?: string[];
  size?: string[];

  // Minigame specific fields
  difficulty?: string;
  maxPlayers?: number;
  gameplayDuration?: string;
  customizableElements?: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
  }>;

  // Media specific fields
  url?: string;
  duration?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  fileFormat?: string;
  fileSize?: number;
  category?: string;
} 