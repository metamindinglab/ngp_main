import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Asset } from '@/types/asset';
import { addRemovableAsset } from '@/lib/removable-assets';

interface AssetsDatabase {
  version: string;
  lastUpdated: string;
  assets: Asset[];
}

const assetsPath = join(process.cwd(), 'data', 'assets.json');

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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const assetId = params.id;
    const updatedAsset = await request.json();
    console.log('Updating asset:', { assetId, updatedAsset });

    // Read the current assets database
    const content = await readFile(assetsPath, 'utf8');
    const data: AssetsDatabase = JSON.parse(content);

    // Find and update the asset in the assets array
    const assetIndex = data.assets.findIndex(asset => asset.id === assetId);
    
    if (assetIndex === -1) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Update the asset while preserving the ID and timestamps
    const updatedRecord = {
      ...data.assets[assetIndex],
      ...updatedAsset,
      id: assetId,
      updatedAt: new Date().toISOString(),
      createdAt: data.assets[assetIndex].createdAt // Preserve the original creation date
    };
    
    data.assets[assetIndex] = updatedRecord;
    data.lastUpdated = new Date().toISOString();

    // Write the updated data back to the file
    await writeFile(assetsPath, JSON.stringify(data, null, 2));

    return NextResponse.json({ 
      success: true,
      asset: updatedRecord 
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Read and parse the current database
    const content = await readFile(assetsPath, 'utf-8');
    const db = JSON.parse(content);

    // Find the asset
    const assetIndex = db.assets.findIndex((asset: any) => asset.id === id);
    if (assetIndex === -1) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Get the asset before removing it
    const asset = db.assets[assetIndex];

    // Add to removable assets database before deletion
    try {
      await addRemovableAsset({
        id: asset.id,
        robloxAssetId: asset.robloxAssetId || '',
        name: asset.name,
        replacedBy: '', // Empty string since it's being deleted, not replaced
        reason: 'Manually deleted by user'
      });
      console.log('Added deleted asset to removable assets database:', asset.id);
    } catch (error) {
      console.error('Error adding asset to removable database:', error);
      // Continue with deletion even if adding to removable database fails
    }

    // Remove the asset from the array
    db.assets.splice(assetIndex, 1);
    db.lastUpdated = new Date().toISOString();

    // Write the updated database back to the file
    await writeFile(assetsPath, JSON.stringify(db, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
} 