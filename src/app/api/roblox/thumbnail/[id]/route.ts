import { NextResponse } from 'next/server';

// Simple in-memory cache
const CACHE = new Map<string, { buffer: ArrayBuffer; timestamp: number; contentType: string }>();
const CACHE_TTL = 3600000; // 1 hour

async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        continue;
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error as Error;
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // Check cache first
  const cached = CACHE.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new NextResponse(cached.buffer, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  try {
    // Try to fetch the thumbnail from Roblox's API
    const response = await fetchWithRetry(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${id}&size=420x420&format=Png&isCircular=false`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch thumbnail: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data?.[0]?.imageUrl) {
      // Fetch the actual image
      const imageResponse = await fetchWithRetry(data.data[0].imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('Content-Type') || 'image/png';

      // Cache the result
      CACHE.set(id, {
        buffer: imageBuffer,
        timestamp: Date.now(),
        contentType
      });

      // Return the image with proper headers
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    throw new Error('No thumbnail URL found in response');
  } catch (error) {
    console.error('Error fetching thumbnail:', error);

    // Try fallback URL
    try {
      const fallbackUrl = `https://www.roblox.com/asset-thumbnail/image?assetId=${id}&width=420&height=420&format=png`;
      const fallbackResponse = await fetchWithRetry(fallbackUrl);
      
      if (fallbackResponse.ok) {
        const imageBuffer = await fallbackResponse.arrayBuffer();
        const contentType = fallbackResponse.headers.get('Content-Type') || 'image/png';

        // Cache the result
        CACHE.set(id, {
          buffer: imageBuffer,
          timestamp: Date.now(),
          contentType
        });

        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    } catch (fallbackError) {
      console.error('Fallback thumbnail fetch failed:', fallbackError);
    }

    return new NextResponse('Failed to load thumbnail', { status: 500 });
  }
} 