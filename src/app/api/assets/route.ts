import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface Asset {
  id: string;
  name: string;
  type: string;
  description: string;
  thumbnail: string;
  robloxAssetId: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetsDatabase {
  version: string;
  lastUpdated: string;
  assets: Asset[];
}

const assetsPath = join(process.cwd(), 'data/assets.json');

// Initialize data file if it doesn't exist
async function initDataFile() {
  try {
    await readFile(assetsPath, 'utf8');
  } catch {
    // Create data directory if it doesn't exist
    await mkdir(join(process.cwd(), 'data'), { recursive: true });
    // Create initial data file
    const initialData: AssetsDatabase = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      assets: []
    };
    await writeFile(assetsPath, JSON.stringify(initialData, null, 2));
  }
}

export async function GET() {
  try {
    await initDataFile();
    const content = await readFile(assetsPath, 'utf8');
    const data: AssetsDatabase = JSON.parse(content);
    return NextResponse.json({ assets: data.assets });
  } catch (error) {
    console.error('Error reading assets:', error);
    return NextResponse.json(
      { error: 'Failed to read assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDataFile();
    const asset = await request.json();
    const content = await readFile(assetsPath, 'utf8');
    const data: AssetsDatabase = JSON.parse(content);
    
    // Generate next asset ID
    const existingIds = data.assets.map((asset: Asset): number => parseInt(asset.id.replace('asset_', '')) || 0);
    const nextId = Math.max(...existingIds, 0) + 1;
    const assetId = `asset_${nextId.toString().padStart(3, '0')}`;
    
    const newAsset: Asset = {
      id: assetId,
      name: asset.name,
      type: asset.type,
      description: asset.description,
      thumbnail: asset.thumbnail,
      robloxAssetId: asset.robloxAssetId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.assets.push(newAsset);
    data.lastUpdated = new Date().toISOString();
    
    await writeFile(assetsPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, asset: newAsset });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initDataFile();
    const { id, ...updates } = await request.json();
    const content = await readFile(assetsPath, 'utf8');
    const data: AssetsDatabase = JSON.parse(content);
    
    const assetIndex = data.assets.findIndex((asset: Asset): boolean => asset.id === id);
    if (assetIndex === -1) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    data.assets[assetIndex] = {
      ...data.assets[assetIndex],
      ...updates,
      id, // Preserve the original ID
      updatedAt: new Date().toISOString()
    };
    data.lastUpdated = new Date().toISOString();
    
    await writeFile(assetsPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, asset: data.assets[assetIndex] });
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initDataFile();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }
    
    const content = await readFile(assetsPath, 'utf8');
    const data: AssetsDatabase = JSON.parse(content);
    
    const assetIndex = data.assets.findIndex((asset: Asset): boolean => asset.id === id);
    if (assetIndex === -1) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    data.assets.splice(assetIndex, 1);
    data.lastUpdated = new Date().toISOString();
    
    await writeFile(assetsPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
} 