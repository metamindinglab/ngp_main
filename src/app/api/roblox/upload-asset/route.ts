import { NextRequest, NextResponse } from 'next/server';
import {
  SystemAssetType,
  getRobloxAssetType,
  getContentType,
  getValidExtensions
} from '@/types/asset-types';

// You'll need to add your Roblox API credentials to your environment variables
const ROBLOX_API_KEY = process.env.NEXT_PUBLIC_ROBLOX_API_KEY;
const ROBLOX_CREATOR_ID = process.env.ROBLOX_CREATOR_ID;
const ROBLOX_GROUP_ID = process.env.ROBLOX_GROUP_ID;

const ASSET_API_URL = 'https://apis.roblox.com/assets/v1/assets';

async function handleAnimationUpload(
  file: File,
  name: string,
  description: string,
  robloxAssetType: string,
  extension: string,
  apiKey: string
) {
  const arrayBuffer = await file.arrayBuffer();
  const contentType = getContentType(extension);
  
  // Generate boundary and create manual multipart form data for animations
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  
  const requestJson = JSON.stringify({
    assetType: robloxAssetType,
    displayName: name,
    description: description,
    creationContext: {
      creator: ROBLOX_GROUP_ID ? {
        groupId: parseInt(ROBLOX_GROUP_ID || '0')
      } : {
        userId: parseInt(ROBLOX_CREATOR_ID || '0')
      }
    }
  });

  const parts = [];
  parts.push(
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="request"\r\n' +
    'Content-Type: application/json\r\n\r\n' +
    `${requestJson}\r\n`
  );

  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="fileContent"; filename="${file.name}"\r\n` +
    `Content-Type: ${contentType}\r\n\r\n`
  );

  const encoder = new TextEncoder();
  const header = encoder.encode(parts.join(''));
  const footer = encoder.encode(`\r\n--${boundary}--\r\n`);

  const body = new Uint8Array(header.length + arrayBuffer.byteLength + footer.length);
  body.set(header, 0);
  body.set(new Uint8Array(arrayBuffer), header.length);
  body.set(footer, header.length + arrayBuffer.byteLength);

  return {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Accept': 'application/json',
      'x-api-key': apiKey
    },
    body: body
  };
}

async function handleRegularUpload(
  file: File,
  name: string,
  description: string,
  robloxAssetType: string,
  systemAssetType: SystemAssetType,
  apiKey: string
) {
  const formData = new FormData();
  
  const requestJson = JSON.stringify({
    assetType: robloxAssetType,
    displayName: name,
    description: description,
    creationContext: {
      creator: ROBLOX_GROUP_ID ? {
        groupId: parseInt(ROBLOX_GROUP_ID || '0')
      } : {
        userId: parseInt(ROBLOX_CREATOR_ID || '0')
      }
    }
  });

  formData.append('request', requestJson);
  formData.append('fileContent', file);

  return {
    headers: {
      'x-api-key': apiKey
    },
    body: formData
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check API credentials first
    if (!ROBLOX_API_KEY || !ROBLOX_CREATOR_ID) {
      console.error('Missing Roblox API credentials');
      return NextResponse.json(
        { error: 'Roblox API credentials not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const systemAssetType = formData.get('systemAssetType') as SystemAssetType;
    const robloxAssetType = getRobloxAssetType(systemAssetType);

    console.log('Received upload request:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      name,
      description,
      systemAssetType,
      robloxAssetType
    });

    // Validate required fields
    if (!file || !name || !description || !systemAssetType) {
      console.log('Missing required fields:', {
        hasFile: !!file,
        hasName: !!name,
        hasDescription: !!description,
        hasSystemAssetType: !!systemAssetType
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const validExtensions = getValidExtensions(systemAssetType);
    
    if (!validExtensions.includes(extension)) {
      return NextResponse.json(
        { error: `Invalid file type. Expected one of: ${validExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle the upload based on asset type
    const requestConfig = systemAssetType === 'Animation' && extension === '.fbx'
      ? await handleAnimationUpload(file, name, description, robloxAssetType, extension, ROBLOX_API_KEY)
      : await handleRegularUpload(file, name, description, robloxAssetType, systemAssetType, ROBLOX_API_KEY);

    console.log('Sending request to Roblox:', {
      url: ASSET_API_URL,
      assetType: robloxAssetType,
      fileName: file.name,
      fileSize: file.size,
      isAnimation: systemAssetType === 'Animation' && extension === '.fbx'
    });

    // Make request to Roblox
    const response = await fetch(ASSET_API_URL, {
      method: 'POST',
      ...requestConfig
    });

    const responseText = await response.text();
    console.log('Roblox API response:', {
      status: response.status,
      body: responseText
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Roblox API error: ${responseText}` },
        { status: response.status }
      );
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json({
        success: true,
        assetId: data.assetId,
        operationId: data.operationId,
        path: data.path,
        assetType: systemAssetType
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid response from Roblox API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in upload-asset route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 