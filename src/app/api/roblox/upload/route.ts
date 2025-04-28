import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import { join } from 'path';
import { createReadStream } from 'fs';
import fetch from 'node-fetch';
import { Blob } from 'node:buffer';

// Configure to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const ROBLOX_ASSET_TYPES = {
  AUDIO: 'Audio',
  IMAGE: 'Image',
  MODEL: 'Model',
  ANIMATION: 'Animation'
} as const;

const ALLOWED_FILE_TYPES = {
  'audio/mpeg': ROBLOX_ASSET_TYPES.AUDIO,
  'audio/wav': ROBLOX_ASSET_TYPES.AUDIO,
  'audio/ogg': ROBLOX_ASSET_TYPES.AUDIO,
  'image/png': ROBLOX_ASSET_TYPES.IMAGE,
  'image/jpeg': ROBLOX_ASSET_TYPES.IMAGE,
  'application/x-rbxm': ROBLOX_ASSET_TYPES.MODEL,
  'application/x-rbxmx': ROBLOX_ASSET_TYPES.MODEL
} as const;

type RobloxAssetType = typeof ROBLOX_ASSET_TYPES[keyof typeof ROBLOX_ASSET_TYPES];
type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES;

async function uploadToRoblox(file: formidable.Files['file'][0], assetType: RobloxAssetType, apiKey: string) {
  try {
    // Create form data for Roblox API
    const formData = new FormData();
    const fileStream = createReadStream(file.filepath);
    const chunks: Buffer[] = [];

    for await (const chunk of fileStream) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);
    const blob = new Blob([buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalFilename);
    
    // Determine the appropriate Roblox API endpoint based on asset type
    let endpoint = '';
    switch(assetType) {
      case ROBLOX_ASSET_TYPES.AUDIO:
        endpoint = 'https://apis.roblox.com/assets/v1/audio';
        break;
      case ROBLOX_ASSET_TYPES.IMAGE:
        endpoint = 'https://apis.roblox.com/assets/v1/image';
        break;
      case ROBLOX_ASSET_TYPES.MODEL:
        endpoint = 'https://apis.roblox.com/assets/v1/model';
        break;
      case ROBLOX_ASSET_TYPES.ANIMATION:
        endpoint = 'https://apis.roblox.com/assets/v1/animation';
        break;
      default:
        throw new Error('Unsupported asset type');
    }

    // Upload to Roblox
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading to Roblox:', error);
    throw error;
  }
}

// Helper function to determine asset type based on file and selected type
async function determineAssetType(file: formidable.Files['file'][0], selectedType: string): Promise<RobloxAssetType> {
  const mimeType = file.mimetype as AllowedMimeType;
  
  // If it's a .rbxm file, check if it's meant to be an animation
  if (mimeType === 'application/x-rbxm' && selectedType === 'ANIMATION') {
    return ROBLOX_ASSET_TYPES.ANIMATION;
  }
  
  // Otherwise use the mime type mapping
  return ALLOWED_FILE_TYPES[mimeType] || ROBLOX_ASSET_TYPES.MODEL;
}

export async function POST(request: NextRequest) {
  try {
    const form = formidable({
      uploadDir: join(process.cwd(), 'tmp'),
      keepExtensions: true,
    });

    // Parse the multipart form data
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(request, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0];
    const apiKey = fields.apiKey?.[0];
    const selectedType = fields.assetType?.[0] || 'MODEL';

    if (!file || !apiKey) {
      return NextResponse.json(
        { error: 'Missing file or API key' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.mimetype as AllowedMimeType;
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(fileType)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Determine the asset type based on file and selected type
    const assetType = await determineAssetType(file, selectedType);

    // Upload to Roblox
    const result = await uploadToRoblox(file, assetType, apiKey);

    return NextResponse.json({
      success: true,
      assetId: result.assetId,
      assetType: assetType
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
} 