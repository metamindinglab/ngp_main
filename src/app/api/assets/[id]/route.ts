import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Asset } from '@/types/asset';

interface AssetsDatabase {
  version: string;
  lastUpdated: string;
  assets: Asset[];
}

const assetsPath = join(process.cwd(), 'data/assets.json');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const content = await readFile(assetsPath, 'utf8');
    const data: AssetsDatabase = JSON.parse(content);
    
    const asset = data.assets.find(a => a.id === params.id);
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error reading asset:', error);
    return NextResponse.json(
      { error: 'Failed to read asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const content = await readFile(assetsPath, 'utf8');
    const data: AssetsDatabase = JSON.parse(content);
    
    const assetIndex = data.assets.findIndex(a => a.id === params.id);
    
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