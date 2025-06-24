import { NextRequest, NextResponse } from 'next/server';
import { Asset } from '@/types/asset';
import { addRemovableAsset } from '@/lib/removable-assets';
import { getAssetById, updateAsset, deleteAsset } from '@/lib/db/assets';

// Helper function to transform UI data to database format
function transformUIToDatabaseFormat(uiData: any) {
  return {
    name: uiData.name,
    type: uiData.type || uiData.assetType,
    robloxId: uiData.robloxAssetId,
    metadata: {
      description: uiData.description,
      tags: Array.isArray(uiData.tags) ? uiData.tags : 
            typeof uiData.tags === 'string' ? uiData.tags.split(',').map((tag: string) => tag.trim()) : 
            [],
      // Include all other metadata fields
      characterType: uiData.characterType,
      appearance: uiData.appearance,
      personality: uiData.personality,
      defaultAnimations: uiData.defaultAnimations,
      suitableFor: uiData.suitableFor,
      marketingCapabilities: uiData.marketingCapabilities,
      difficulty: uiData.difficulty,
      maxPlayers: uiData.maxPlayers,
      gameplayDuration: uiData.gameplayDuration,
      customizableElements: uiData.customizableElements,
      url: uiData.url,
      duration: uiData.duration,
      dimensions: uiData.dimensions,
      fileFormat: uiData.fileFormat,
      fileSize: uiData.fileSize,
      category: uiData.category,
      image: uiData.image,
      previewImage: uiData.previewImage,
      compatibility: uiData.compatibility,
      brands: uiData.brands,
      size: uiData.size,
      lastUpdated: uiData.lastUpdated
    }
  };
}

// Helper function to transform database data to UI format
function transformDatabaseToUIFormat(dbAsset: any) {
  return {
    id: dbAsset.id,
    name: dbAsset.name,
    description: dbAsset.metadata?.description || '',
    type: dbAsset.type || '',
    assetType: dbAsset.type || '',  // For backward compatibility
    robloxAssetId: dbAsset.robloxId || '',
    tags: dbAsset.metadata?.tags || [],
    createdAt: dbAsset.createdAt?.toISOString() || '',
    updatedAt: dbAsset.updatedAt?.toISOString() || '',
    lastUpdated: dbAsset.metadata?.lastUpdated || dbAsset.updatedAt?.toISOString() || '',
    // Include all other metadata fields
    ...dbAsset.metadata
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await getAssetById(params.id);
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(transformDatabaseToUIFormat(asset));
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

    // Check if asset exists
    const existingAsset = await getAssetById(assetId);
    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Transform the data to match Prisma schema
    const dbFormat = transformUIToDatabaseFormat(updatedAsset);

    // Update the asset using Prisma
    const updatedRecord = await updateAsset(assetId, {
      ...dbFormat,
      updatedAt: new Date()
    });

    // Transform the response back to UI format
    return NextResponse.json({ 
      success: true,
      asset: transformDatabaseToUIFormat(updatedRecord)
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

    // Check if asset exists and get its data
    const asset = await getAssetById(id);
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Add to removable assets database before deletion
    try {
      await addRemovableAsset({
        id: asset.id,
        robloxAssetId: asset.robloxId || '',
        name: asset.name,
        replacedBy: '', // Empty string since it's being deleted, not replaced
        reason: 'Manually deleted by user'
      });
      console.log('Added deleted asset to removable assets database:', asset.id);
    } catch (error) {
      console.error('Error adding asset to removable database:', error);
      // Continue with deletion even if adding to removable database fails
    }

    // Delete the asset using Prisma
    await deleteAsset(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
} 