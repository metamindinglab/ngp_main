import { promises as fs } from 'fs';
import path from 'path';

interface RemovableAsset {
  id: string;
  robloxAssetId: string;
  name: string;
  replacedBy: string;
  dateMarkedRemovable: string;
  reason: string;
}

interface RemovableAssetsDatabase {
  removableAssets: RemovableAsset[];
  lastUpdated: string;
}

const REMOVABLE_ASSETS_PATH = path.join('/home/mml_admin/mml_roblox_asset_management/data', 'removable-assets.json');

export async function getRemovableAssets(): Promise<RemovableAssetsDatabase> {
  try {
    const content = await fs.readFile(REMOVABLE_ASSETS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty database
    return {
      removableAssets: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

export async function addRemovableAsset(asset: {
  id: string;
  robloxAssetId: string;
  name: string;
  replacedBy: string;
  reason?: string;
}): Promise<void> {
  const db = await getRemovableAssets();
  
  // Check if asset is already in the database
  const existingIndex = db.removableAssets.findIndex(a => a.id === asset.id);
  
  const newAsset: RemovableAsset = {
    ...asset,
    dateMarkedRemovable: new Date().toISOString(),
    reason: asset.reason || 'Replaced by newer version'
  };

  if (existingIndex >= 0) {
    db.removableAssets[existingIndex] = newAsset;
  } else {
    db.removableAssets.push(newAsset);
  }

  db.lastUpdated = new Date().toISOString();

  await fs.writeFile(
    REMOVABLE_ASSETS_PATH,
    JSON.stringify(db, null, 2),
    'utf-8'
  );
}

export async function removeFromRemovableAssets(assetId: string): Promise<void> {
  const db = await getRemovableAssets();
  
  db.removableAssets = db.removableAssets.filter(asset => asset.id !== assetId);
  db.lastUpdated = new Date().toISOString();

  await fs.writeFile(
    REMOVABLE_ASSETS_PATH,
    JSON.stringify(db, null, 2),
    'utf-8'
  );
}

export async function getRemovableAsset(assetId: string): Promise<RemovableAsset | null> {
  const db = await getRemovableAssets();
  return db.removableAssets.find(asset => asset.id === assetId) || null;
} 