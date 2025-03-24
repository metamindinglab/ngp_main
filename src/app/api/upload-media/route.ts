import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';

// Configure body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const gamesPath = join(process.cwd(), 'data/games.json');
const mediaBasePath = '/home/mml_admin/mml_roblox_asset_management/public/media';

interface FormDataFile extends Blob {
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    // Ensure the request is multipart/form-data
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }

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

    // Validate game ID format
    if (!gameId.startsWith('game_')) {
      return NextResponse.json(
        { error: 'Invalid game ID format' },
        { status: 400 }
      );
    }

    // Create game-specific directory if it doesn't exist
    const gameDir = join(mediaBasePath, gameId);
    await mkdir(gameDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const safeFilename = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${safeFilename}`;
    const filepath = join(gameDir, filename);

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Read and parse the games.json file
    const gamesContent = await readFile(gamesPath, 'utf8');
    const gamesData = JSON.parse(gamesContent);
    
    // Find the game by ID
    const gameIndex = gamesData.games.findIndex((g: any) => g.id === gameId);
    if (gameIndex === -1) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Initialize robloxInfo and media structure if they don't exist
    if (!gamesData.games[gameIndex].robloxInfo) {
      gamesData.games[gameIndex].robloxInfo = {
        placeId: Number(gamesData.games[gameIndex].robloxLink.split('/').pop()) || 0,
        creator: {
          id: 0,
          type: 'User',
          name: 'Unknown'
        },
        stats: {
          playing: 0,
          visits: 0,
          favorites: 0,
          likes: 0,
          dislikes: 0
        },
        gameSettings: {
          maxPlayers: 0,
          allowCopying: false,
          allowedGearTypes: [],
          universeAvatarType: 'MorphToR6',
          genre: 'All',
          isAllGenres: false,
          isFavoritedByUser: false,
          price: null
        },
        servers: [],
        media: {
          images: [],
          videos: []
        }
      };
    }
    if (!gamesData.games[gameIndex].robloxInfo.media) {
      gamesData.games[gameIndex].robloxInfo.media = {
        images: [],
        videos: []
      };
    }

    // Create media info object
    const mediaInfo = {
      id: `${type}_${timestamp}_${Math.random().toString(36).substring(2, 9)}`,
      robloxId: null,
      type: type === 'image' ? 'Image' : 'Video',
      approved: true,
      title: originalName,
      // Use relative path for web access
      localPath: `/media/${gameId}/${filename}`,
      thumbnailUrl: type === 'image' ? `/media/${gameId}/${filename}` : null,
      width: 768,
      height: 432,
      uploadedAt: new Date().toISOString()
    };

    // Add media info to the appropriate array
    if (type === 'image') {
      gamesData.games[gameIndex].robloxInfo.media.images.push(mediaInfo);
      // Only update thumbnail if it's not already set
      if (!gamesData.games[gameIndex].thumbnail) {
        gamesData.games[gameIndex].thumbnail = mediaInfo.localPath;
      }
    } else {
      gamesData.games[gameIndex].robloxInfo.media.videos.push(mediaInfo);
    }

    // Update timestamps
    gamesData.games[gameIndex].dates.lastUpdated = new Date().toISOString();
    gamesData.lastUpdated = new Date().toISOString();

    // Write updated data back to games.json
    await writeFile(gamesPath, JSON.stringify(gamesData, null, 2));

    // Return success response with file info
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