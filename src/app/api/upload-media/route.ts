import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';

const gamesPath = join(process.cwd(), 'data/games.json');
const mediaBasePath = '/home/mml_admin/mml_roblox_asset_management/public/media';

interface FormDataFile extends Blob {
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as FormDataFile;
    const type = formData.get('type') as string;
    const gameId = formData.get('gameId') as string;

    if (!file || !type || !gameId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create game-specific directory if it doesn't exist
    const gameDir = join(mediaBasePath, gameId);
    await mkdir(gameDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const safeFilename = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${safeFilename}`;
    const filepath = join(gameDir, filename);

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update game record with media information
    const gamesContent = await readFile(gamesPath, 'utf8');
    const gamesData = JSON.parse(gamesContent);
    const gameIndex = gamesData.games.findIndex((g: any) => g.id === gameId);

    if (gameIndex === -1) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Ensure media structure exists
    if (!gamesData.games[gameIndex].robloxInfo) {
      gamesData.games[gameIndex].robloxInfo = {};
    }
    if (!gamesData.games[gameIndex].robloxInfo.media) {
      gamesData.games[gameIndex].robloxInfo.media = {
        images: [],
        videos: []
      };
    }

    // Add media file information
    const mediaInfo = {
      id: `${type}_${timestamp}`,
      robloxId: null,
      type: type === 'image' ? 'Image' : 'Video',
      approved: true,
      title: originalName,
      localPath: `/media/${gameId}/${filename}`,
      thumbnailUrl: type === 'image' ? `/media/${gameId}/${filename}` : null,
      width: 768,
      height: 432,
      uploadedAt: new Date().toISOString()
    };

    if (type === 'image') {
      gamesData.games[gameIndex].robloxInfo.media.images.push(mediaInfo);
    } else {
      gamesData.games[gameIndex].robloxInfo.media.videos.push(mediaInfo);
    }

    // Update last modified date
    gamesData.games[gameIndex].dates.lastUpdated = new Date().toISOString();
    gamesData.lastUpdated = new Date().toISOString();

    // Save updated game data
    await writeFile(gamesPath, JSON.stringify(gamesData, null, 2));

    // Return success response with file details
    return NextResponse.json({
      success: true,
      file: mediaInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 