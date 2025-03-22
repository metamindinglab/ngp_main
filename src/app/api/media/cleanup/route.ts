import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MEDIA_ROOT = process.env.MEDIA_STORAGE_PATH || path.join(process.cwd(), 'public', 'media');
const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || token !== process.env.NEXT_PUBLIC_MEDIA_CLEANUP_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metadataDir = path.join(MEDIA_ROOT, 'metadata');
    const errors: string[] = [];

    try {
      await fs.access(metadataDir);
    } catch {
      return NextResponse.json({ message: 'No metadata directory found' });
    }

    const files = await fs.readdir(metadataDir);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      try {
        const metadataPath = path.join(metadataDir, file);
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        const lastChecked = new Date(metadata.lastChecked).getTime();

        if (now - lastChecked > MAX_AGE) {
          // Delete the media file
          try {
            await fs.unlink(path.join(process.cwd(), 'public', metadata.localPath));
          } catch (error) {
            errors.push(`Failed to delete media file: ${metadata.localPath}`);
          }

          // Delete thumbnail if exists
          if (metadata.thumbnailPath) {
            try {
              await fs.unlink(path.join(process.cwd(), 'public', metadata.thumbnailPath));
            } catch (error) {
              errors.push(`Failed to delete thumbnail: ${metadata.thumbnailPath}`);
            }
          }

          // Delete metadata file
          await fs.unlink(metadataPath);
          deletedCount++;
        }
      } catch (error) {
        errors.push(`Failed to process ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: `Cleanup completed. Deleted ${deletedCount} files.`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Media cleanup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 