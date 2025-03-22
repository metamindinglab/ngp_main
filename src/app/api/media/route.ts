import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Media storage configuration
const MEDIA_ROOT = process.env.MEDIA_STORAGE_PATH || path.join(process.cwd(), 'public', 'media');
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface MediaMetadata {
  id: string;
  originalUrl: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  localPath: string;
  thumbnailPath?: string;
  uploadedAt: string;
  lastChecked: string;
}

// Initialize storage directories
async function initializeStorage() {
  try {
    await fs.mkdir(path.join(MEDIA_ROOT, 'images'), { recursive: true });
    await fs.mkdir(path.join(MEDIA_ROOT, 'videos'), { recursive: true });
    await fs.mkdir(path.join(MEDIA_ROOT, 'thumbnails'), { recursive: true });
    await fs.mkdir(path.join(MEDIA_ROOT, 'metadata'), { recursive: true });
  } catch (error) {
    console.error('Failed to initialize storage directories:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, type, id } = await request.json();

    if (!url || !type || !id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Initialize storage if needed
    await initializeStorage();

    // Generate unique filename
    const fileExt = path.extname(url) || (type === 'image' ? '.png' : '.mp4');
    const filename = `${id}_${crypto.randomBytes(8).toString('hex')}${fileExt}`;
    const mediaDir = type === 'image' ? 'images' : 'videos';
    const localPath = path.join(MEDIA_ROOT, mediaDir, filename);

    // Download the file
    const response = await fetch(url, { 
      headers: {
        'Accept': '*/*',
      },
      redirect: 'follow',
      cache: 'no-cache'
    });

    if (!response.ok) {
      console.error(`Failed to download media: ${response.status} ${response.statusText}`);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Failed to download media: ${response.statusText}`);
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      const baseContentType = contentType.split(';')[0].toLowerCase();
      if (type === 'image' && !ALLOWED_IMAGE_TYPES.includes(baseContentType)) {
        console.error(`Invalid image type: ${contentType}`);
        return NextResponse.json(
          { error: `Invalid image type: ${contentType}` },
          { status: 400 }
        );
      }
      if (type === 'video' && !ALLOWED_VIDEO_TYPES.includes(baseContentType)) {
        console.error(`Invalid video type: ${contentType}`);
        return NextResponse.json(
          { error: `Invalid video type: ${contentType}` },
          { status: 400 }
        );
      }
    }

    // Get file size from headers or response
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_FILE_SIZE) {
      console.error(`File too large: ${contentLength} bytes`);
      return NextResponse.json(
        { error: `File too large: ${contentLength} bytes` },
        { status: 400 }
      );
    }

    // Download and save the file
    const buffer = await response.arrayBuffer();
    await fs.writeFile(localPath, Buffer.from(buffer));

    // Create metadata
    const metadata = {
      id,
      originalUrl: url,
      mimeType: contentType || (type === 'image' ? 'image/png' : 'video/mp4'),
      size: buffer.byteLength,
      localPath: path.join('/', 'media', mediaDir, filename),
      uploadedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    };

    // Save metadata
    const metadataPath = path.join(MEDIA_ROOT, 'metadata', `${id}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`Successfully downloaded media to ${localPath}`);
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 