import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    // Try to fetch the thumbnail from Roblox's API
    const response = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${id}&size=420x420&format=Png&isCircular=false`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch thumbnail: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].imageUrl) {
      // Fetch the actual image
      const imageResponse = await fetch(data.data[0].imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      // Return the image with proper headers
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': imageResponse.headers.get('Content-Type') || 'image/png',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    throw new Error('No thumbnail URL found in response');
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return new NextResponse('Failed to load thumbnail', { status: 500 });
  }
} 