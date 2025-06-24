import { NextRequest, NextResponse } from 'next/server';
import { getAllAssets, createAsset, updateAsset, deleteAsset } from '@/lib/db/assets';
import { Asset } from '@prisma/client';

// Helper function to transform database asset to UI format
function transformDatabaseAssetToUI(dbAsset: any) {
  return {
    id: dbAsset.id,
    name: dbAsset.name,
    description: dbAsset.metadata?.description || '',
    type: dbAsset.type || '',
    assetType: dbAsset.type || '',  // For backward compatibility
    robloxAssetId: dbAsset.robloxId || '',
    thumbnail: dbAsset.metadata?.thumbnail || '',
    tags: dbAsset.metadata?.tags || [],
    createdAt: dbAsset.createdAt?.toISOString() || '',
    updatedAt: dbAsset.updatedAt?.toISOString() || '',
    lastUpdated: dbAsset.updatedAt?.toISOString() || '',
    // Additional metadata fields
    ...dbAsset.metadata
  };
}

export async function GET() {
  try {
    const assets = await getAllAssets();
    // Transform each asset to the UI format
    const transformedAssets = assets.map(transformDatabaseAssetToUI);
    return NextResponse.json({ assets: transformedAssets });
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
    const assetData = await request.json();
    
    // Transform UI data to database format
    const dbAssetData = {
      name: assetData.name,
      type: assetData.assetType || assetData.type,
      status: 'active',
      robloxId: assetData.robloxAssetId,
      creator: assetData.creator || null,
      metadata: {
        description: assetData.description,
        thumbnail: assetData.thumbnail || '',
        tags: Array.isArray(assetData.tags) ? assetData.tags : 
              typeof assetData.tags === 'string' ? assetData.tags.split(',').map((tag: string) => tag.trim()) : 
              [],
        // Include all other metadata fields
        characterType: assetData.characterType,
        appearance: assetData.appearance,
        personality: assetData.personality,
        defaultAnimations: assetData.defaultAnimations,
        suitableFor: assetData.suitableFor,
        marketingCapabilities: assetData.marketingCapabilities,
        difficulty: assetData.difficulty,
        maxPlayers: assetData.maxPlayers,
        gameplayDuration: assetData.gameplayDuration,
        customizableElements: assetData.customizableElements,
        url: assetData.url,
        duration: assetData.duration,
        dimensions: assetData.dimensions,
        fileFormat: assetData.fileFormat,
        fileSize: assetData.fileSize,
        category: assetData.category,
        image: assetData.image,
        previewImage: assetData.previewImage,
        compatibility: assetData.compatibility,
        brands: assetData.brands,
        size: assetData.size
      }
    };
    
    const newAsset = await createAsset(dbAssetData);
    
    // Transform back to UI format for response
    return NextResponse.json({ 
      success: true, 
      asset: transformDatabaseAssetToUI(newAsset) 
    });
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
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // Transform UI data to database format
    const dbUpdates = {
      name: updates.name,
      type: updates.assetType || updates.type,
      robloxId: updates.robloxAssetId,
      metadata: {
        description: updates.description,
        thumbnail: updates.thumbnail || '',
        tags: Array.isArray(updates.tags) ? updates.tags : 
              typeof updates.tags === 'string' ? updates.tags.split(',').map((tag: string) => tag.trim()) : 
              [],
        // Include all other metadata fields
        characterType: updates.characterType,
        appearance: updates.appearance,
        personality: updates.personality,
        defaultAnimations: updates.defaultAnimations,
        suitableFor: updates.suitableFor,
        marketingCapabilities: updates.marketingCapabilities,
        difficulty: updates.difficulty,
        maxPlayers: updates.maxPlayers,
        gameplayDuration: updates.gameplayDuration,
        customizableElements: updates.customizableElements,
        url: updates.url,
        duration: updates.duration,
        dimensions: updates.dimensions,
        fileFormat: updates.fileFormat,
        fileSize: updates.fileSize,
        category: updates.category,
        image: updates.image,
        previewImage: updates.previewImage,
        compatibility: updates.compatibility,
        brands: updates.brands,
        size: updates.size
      },
      updatedAt: new Date()
    };

    const updatedAsset = await updateAsset(id, dbUpdates);
    
    // Transform back to UI format for response
    return NextResponse.json({ 
      success: true, 
      asset: transformDatabaseAssetToUI(updatedAsset) 
    });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }
    
    await deleteAsset(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
} 