import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';

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
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Process file upload logic here
    // For now, just return success
    return NextResponse.json({ 
      success: true,
      message: 'File uploaded successfully',
      fileName: file.name
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 