import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'assets.json');

export async function GET() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error loading assets:', error);
    return NextResponse.json(
      { error: 'Failed to load assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'assets.json');
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContents);
    const newAsset = await request.json();

    // Generate a unique ID
    const id = Date.now().toString();
    const asset = {
      id,
      ...newAsset,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add the new asset
    data.assets.push(asset);

    // Write back to the file
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'assets.json');
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContents);
    const updatedAsset = await request.json();

    // Find and update the asset
    const index = data.assets.findIndex((a: any) => a.id === updatedAsset.id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    data.assets[index] = {
      ...data.assets[index],
      ...updatedAsset,
      updatedAt: new Date().toISOString(),
    };

    // Write back to the file
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

    return NextResponse.json(data.assets[index]);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    const jsonPath = path.join(process.cwd(), 'data', 'assets.json');
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContents);

    // Filter out the asset to delete
    data.assets = data.assets.filter((a: any) => a.id !== id);

    // Write back to the file
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
} 