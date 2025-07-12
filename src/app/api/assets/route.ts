import { NextRequest, NextResponse } from 'next/server';
import { getAllAssets, createAsset, updateAsset, deleteAsset } from '@/lib/db/assets';
import { Asset } from '@prisma/client';
import { addCorsHeaders, handleAuth, applyRateLimit, addRateLimitHeaders, handleOptions } from '../middleware';

// Helper function to transform database asset to UI format
function transformDatabaseAssetToUI(dbAsset: any) {
  // Ensure metadata is an object, not a string
  const metadata = typeof dbAsset.metadata === 'string' ? 
    JSON.parse(dbAsset.metadata) : 
    (dbAsset.metadata || {});
    
  return {
    id: dbAsset.id,
    name: dbAsset.name,
    description: metadata.description || '',
    type: dbAsset.type || '',
    assetType: dbAsset.type || '',  // For backward compatibility
    robloxAssetId: dbAsset.robloxId || '',
    thumbnail: metadata.thumbnail || '',
    tags: metadata.tags || [],
    createdAt: dbAsset.createdAt?.toISOString() || '',
    updatedAt: dbAsset.updatedAt?.toISOString() || '',
    lastUpdated: dbAsset.updatedAt?.toISOString() || '',
    // Additional metadata fields
    ...metadata
  };
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is an authenticated request from a Roblox game
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (apiKey) {
      // Handle authentication for external Roblox games
      const auth = await handleAuth(request)
      if (!auth.isValid) {
        const response = NextResponse.json({ error: auth.error }, { status: 401 })
        return addCorsHeaders(response)
      }

      // Apply rate limiting for authenticated requests
      const rateLimit = applyRateLimit(apiKey)
      
      if (!rateLimit.allowed) {
        const response = NextResponse.json(
          { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
          { status: 429 }
        )
        addRateLimitHeaders(response, rateLimit)
        return addCorsHeaders(response)
      }
    }

    const assets = await getAllAssets();
    // Transform each asset to the UI format
    const transformedAssets = assets.map(transformDatabaseAssetToUI);
    
    const response = NextResponse.json({ 
      success: true,
      assets: transformedAssets 
    });

    // Add rate limit headers if this was an authenticated request
    if (apiKey) {
      const rateLimit = applyRateLimit(apiKey)
      addRateLimitHeaders(response, rateLimit)
    }

    return addCorsHeaders(response)
  } catch (error) {
    console.error('Error reading assets:', error);
    const response = NextResponse.json(
      { error: 'Failed to read assets' },
      { status: 500 }
    );
    return addCorsHeaders(response)
  }
}

export async function POST(request: NextRequest) {
  try {
    const assetData = await request.json();
    
    // Transform UI data to database format
    const dbAssetData = {
      id: assetData.id || `asset_${Date.now()}`,
      name: assetData.name,
      type: assetData.assetType || assetData.type,
      status: 'active',
      robloxId: assetData.robloxAssetId,
      creator: assetData.creator || null,
      updatedAt: new Date(),
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