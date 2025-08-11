import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SystemAssetType,
  RobloxAssetType,
  getRobloxAssetType,
  getContentType,
  validateFileExtension,
  getValidExtensions
} from '@/types/asset-types';
import { addRemovableAsset } from '@/lib/removable-assets';

// You'll need to add your Roblox API credentials to your environment variables
const ROBLOX_API_KEY = process.env.NEXT_PUBLIC_ROBLOX_API_KEY;
const ROBLOX_CREATOR_ID = process.env.ROBLOX_CREATOR_ID;
const ROBLOX_GROUP_ID = process.env.ROBLOX_GROUP_ID;

const ASSET_API_URL = 'https://apis.roblox.com/assets/v1/assets';

async function pollOperationStatus(operationPath: string, apiKey: string): Promise<any> {
  let attempts = 0;
  const maxAttempts = 40;
  const pollInterval = 7000;

  // Extract operation ID from path if full path is provided
  const operationId = operationPath.split('/').pop();
  if (!operationId) {
    throw new Error('Invalid operation path');
  }

  while (attempts < maxAttempts) {
    console.log(`Checking operation status (attempt ${attempts + 1}/${maxAttempts})`);
    
    // Use the full operation path from the API response
    const headers: HeadersInit = {
      'x-api-key': apiKey || ''
    };

    // The operation status endpoint is at the root of the API URL
    const statusResponse = await fetch(`https://apis.roblox.com/assets/v1/operations/${operationId}`, {
      headers
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Failed to check operation status:', {
        status: statusResponse.status,
        error: errorText,
        operationId,
        url: `https://apis.roblox.com/assets/v1/operations/${operationId}`
      });
      throw new Error(`Failed to check operation status: ${errorText}`);
    }

    const status = await statusResponse.json();
    console.log('Operation status:', status);
    
    if (status.done === true) {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new Error('Asset operation timed out');
}

export async function POST(request: NextRequest) {
  try {
    // Check API credentials first
    if (!ROBLOX_API_KEY || !ROBLOX_CREATOR_ID) {
      console.error('Missing Roblox API credentials:', {
        hasApiKey: !!ROBLOX_API_KEY,
        hasCreatorId: !!ROBLOX_CREATOR_ID
      });
      return NextResponse.json(
        { error: 'Roblox API credentials not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const assetType = formData.get('assetType') as SystemAssetType;
    const oldAssetId = formData.get('existingAssetId') as string;

    if (!file || !name || !description || !assetType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If we have an old asset ID, mark it as removable in our database
    if (oldAssetId) {
      try {
        await addRemovableAsset({
          id: oldAssetId,
          robloxAssetId: formData.get('oldRobloxAssetId') as string || '',
          name: formData.get('oldName') as string || name,
          replacedBy: 'pending' // Will be updated once new asset is created
        });
        console.log('Added old asset to removable assets database:', oldAssetId);
      } catch (error) {
        console.error('Error adding asset to removable database:', error);
        // Continue with new asset creation even if marking old asset fails
      }
    }

    // Convert the file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create form data for the Roblox API
    const robloxFormData = new FormData();
    const requestData = {
      assetType: getRobloxAssetType(assetType),
      displayName: name,
      description: description,
      creationContext: {
        creator: ROBLOX_GROUP_ID ? {
          groupId: parseInt(ROBLOX_GROUP_ID)
        } : {
          userId: parseInt(ROBLOX_CREATOR_ID)
        }
      }
    };

    robloxFormData.append('request', JSON.stringify(requestData));

      // Handle different asset types appropriately
  if (assetType === 'Animation') {
    // For animations, preserve the original file type and extension
    const animBlob = new Blob([buffer], { type: file.type });
    robloxFormData.append('fileContent', animBlob, file.name);
    robloxFormData.append('type', file.type);
  } else {
    const contentType = getContentType(getRobloxAssetType(assetType));
    const blob = new Blob([buffer], { type: contentType });
    robloxFormData.append('fileContent', blob, file.name);
    robloxFormData.append('type', contentType);
  }

    console.log('Creating new asset on Roblox:', {
      name,
      assetType,
      oldAssetId: oldAssetId || 'none',
      requestData,
      contentType: assetType === 'Animation' ? file.type : getContentType(getRobloxAssetType(assetType))
    });

    // Always create a new asset
    const response = await fetch(ASSET_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ROBLOX_API_KEY,
      },
      body: robloxFormData,
    });

    const responseText = await response.text();
    console.log('Raw Roblox API response:', responseText);

    if (!response.ok) {
      console.error('Roblox API error:', {
        status: response.status,
        error: responseText,
        headers: Object.fromEntries(response.headers.entries())
      });
      return NextResponse.json(
        { error: `Failed to create new asset on Roblox: ${responseText}` },
        { status: response.status }
      );
    }

    const result = JSON.parse(responseText);
    console.log('Parsed Roblox API response:', result);

    // If we get an operation path, we need to poll for completion
    if (result.path) {
      try {
        const status = await pollOperationStatus(result.path, ROBLOX_API_KEY);
        // After successful upload, update the replacedBy field in removable assets
        if (oldAssetId && status.response?.assetId) {
          try {
            await addRemovableAsset({
              id: oldAssetId,
              robloxAssetId: formData.get('oldRobloxAssetId') as string || '',
              name: formData.get('oldName') as string || name,
              replacedBy: status.response.assetId
            });
          } catch (error) {
            console.error('Error updating replacedBy in removable database:', error);
          }
        }
        return NextResponse.json({
          success: true,
          assetId: status.response?.assetId,
          assetType: assetType,
          operation: 'created',
          oldAssetId: oldAssetId || null
        });
      } catch (error) {
        console.error('Operation status polling failed:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to check operation status" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      assetId: result.assetId,
      assetType: assetType,
      operation: 'created',
      oldAssetId: oldAssetId || null
    });
  } catch (error) {
    console.error('Error creating new asset:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 