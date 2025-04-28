// Our system's asset types
export const SystemAssetTypes = {
  Animation: 'Animation',
  Audio: 'Audio',
  Decal: 'Decal',
  Model: 'Model',
  Video: 'Video',
  Shoes: 'Shoes',
  Image: 'Image',
  Clothing: 'Clothing'
} as const;

// Roblox's asset types
export const RobloxAssetTypes = {
  Animation: 'Animation',
  Audio: 'Audio',
  Decal: 'Decal',
  Model: 'Model',
  VideoFrame: 'VideoFrame',
  Shirt: 'Shirt',
  Pants: 'Pants',
  Image: 'Image'
} as const;

export type SystemAssetType = keyof typeof SystemAssetTypes;
export type RobloxAssetType = keyof typeof RobloxAssetTypes;

// Mapping from our system types to Roblox types
export const SystemToRobloxAssetTypeMap: Record<SystemAssetType, RobloxAssetType> = {
  Animation: 'Animation',
  Audio: 'Audio',
  Decal: 'Decal',
  Model: 'Model',
  Video: 'VideoFrame',
  Shoes: 'Model',
  Image: 'Image',
  Clothing: 'Model'
};

// Content type mapping for different file types
export const ContentTypeMap: Record<string, string> = {
  '.fbx': 'model/fbx',
  '.rbxm': 'application/octet-stream',
  '.rbx': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4'
};

// Map system asset types to accepted file extensions
export const SystemAssetFileTypes: Record<SystemAssetType, string[]> = {
  Animation: ['.fbx', '.rbxm'],
  Audio: ['.mp3', '.ogg'],
  Decal: ['.png', '.jpg', '.jpeg'],
  Model: ['.rbxm', '.rbx'],
  Video: ['.mp4'],
  Shoes: ['.rbxm', '.rbx'],
  Image: ['.png', '.jpg', '.jpeg'],
  Clothing: ['.rbxm', '.rbx']
};

// Helper functions
export function getRobloxAssetType(systemType: SystemAssetType): RobloxAssetType {
  return SystemToRobloxAssetTypeMap[systemType];
}

export function getContentType(extension: string): string {
  return ContentTypeMap[extension.toLowerCase()] || 'application/octet-stream';
}

export function getValidExtensions(systemType: SystemAssetType): string[] {
  return SystemAssetFileTypes[systemType] || [];
}

export function validateFileExtension(filename: string, systemType: SystemAssetType): boolean {
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  return getValidExtensions(systemType).includes(extension);
} 