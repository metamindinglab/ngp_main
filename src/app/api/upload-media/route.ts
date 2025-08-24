import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const gamesPath = join(process.cwd(), 'data/games.json');
const mediaBasePath = '/home/mml_admin/mml_roblox_asset_management/public/media';

interface FormDataFile extends Blob {
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const gameId = formData.get('gameId') as string;

    if (!file || !type || !gameId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Create media directory if it doesn't exist
    const mediaDir = join(process.cwd(), 'public', 'media');
    try {
      await writeFile(join(mediaDir, '.keep'), '');
    } catch (error) {
      console.error('Error creating media directory:', error);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = join(mediaDir, fileName);
    const publicPath = `/media/${fileName}`;

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create GameMedia record
    const media = await prisma.gameMedia.create({
      data: {
        id: uuidv4(),
        type,
        title: file.name,
        localPath: publicPath,
        thumbnailUrl: type === 'image' ? publicPath : null,
        gameId,
        approved: true,
        updatedAt: new Date()
      }
    });

    // Update game's thumbnail if it's an image and the game doesn't have a thumbnail yet
    if (type === 'image') {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { thumbnail: true }
      });

      if (!game?.thumbnail) {
        await prisma.game.update({
          where: { id: gameId },
          data: { thumbnail: publicPath }
        });
      }
    }

    return NextResponse.json({ file: media });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
} 