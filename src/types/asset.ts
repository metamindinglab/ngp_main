export interface Asset {
  id: string;
  name: string;
  description: string;
  assetType: string;
  robloxAssetId: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
} 