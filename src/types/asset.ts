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
} 