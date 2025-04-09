import { NextResponse } from 'next/server';

const MAX_RETRIES = 1;
const INITIAL_RETRY_DELAY = 500;
const MAX_RETRY_DELAY = 2000;
const FETCH_TIMEOUT = 8000; // Increased timeout

// Cache successful responses in memory with LRU
const CACHE_TTL = 3600000;
const MAX_CACHE_SIZE = 1000;
const thumbnailCache = new Map<string, { data: ArrayBuffer; timestamp: number; contentType: string }>();

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(thumbnailCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL) {
      thumbnailCache.delete(key);
    }
  });
  
  if (thumbnailCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(thumbnailCache.entries());
    const entriesToDelete = entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, thumbnailCache.size - MAX_CACHE_SIZE);
    entriesToDelete.forEach(([key]) => thumbnailCache.delete(key));
  }
}, 60000);

function getCachedThumbnail(assetId: string) {
  const cached = thumbnailCache.get(assetId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  thumbnailCache.delete(assetId);
  return null;
}

// Rate limiting with shorter window and higher limit for bursts
const RATE_LIMIT_WINDOW = 10000;
const MAX_REQUESTS_PER_WINDOW = 200;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(assetId: string): boolean {
  const now = Date.now();
  const requestInfo = requestCounts.get(assetId);

  if (!requestInfo || (now - requestInfo.timestamp) > RATE_LIMIT_WINDOW) {
    requestCounts.set(assetId, { count: 1, timestamp: now });
    return false;
  }

  if (requestInfo.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  requestInfo.count++;
  return false;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`Fetching URL: ${url}`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    console.log(`Response status: ${response.status} for URL: ${url}`);
    return response;
  } catch (error: unknown) {
    clearTimeout(id);
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

async function fetchWithExponentialBackoff(url: string, expectImage = false, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries + 1; i++) {
    try {
      const response = await fetchWithTimeout(url, {
        cache: 'no-store', // Disable cache to avoid stale responses
        headers: {
          'Accept': expectImage ? 'image/png,image/*' : 'application/json',
          'User-Agent': 'Roblox Asset Manager/1.0',
          'Referer': 'https://www.roblox.com/'
        }
      });

      // Log response headers for debugging
      console.log(`Response headers for ${url}:`, Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        if (expectImage) {
          const contentType = response.headers.get('Content-Type');
          if (!contentType?.startsWith('image/')) {
            console.error(`Invalid content type: ${contentType} for URL: ${url}`);
            throw new Error(`Invalid content type: ${contentType}`);
          }
        }
        return response;
      }

      if (response.status === 404 || response.status === 403) {
        throw new Error(`Asset error: ${response.status}`);
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : INITIAL_RETRY_DELAY;
        console.log(`Rate limited. Waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        lastError = error;
        console.error(`Attempt ${i + 1} failed:`, error.message);
        
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
      } else {
        lastError = new Error('Unknown error occurred');
      }

      if (i === retries) {
        throw lastError;
      }

      const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, i), MAX_RETRY_DELAY);
      console.log(`Waiting ${delay}ms before retry ${i + 1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

async function getThumbnailUrl(assetId: string): Promise<string> {
  try {
    // Try the v1 API first
    const response = await fetchWithExponentialBackoff(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png`,
      false
    );
    const data = await response.json();
    console.log('Thumbnail API response:', data);
    
    if (data.data?.[0]?.imageUrl) {
      return data.data[0].imageUrl;
    }
  } catch (error) {
    console.error('Error getting thumbnail URL:', error);
  }

  // Fallback to direct URL
  return `https://www.roblox.com/asset-thumbnail/image?assetId=${assetId}&width=420&height=420&format=png`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  console.log(`Processing thumbnail request for asset ID: ${assetId}`);

  // Check cache first
  const cached = getCachedThumbnail(assetId);
  if (cached) {
    console.log(`Cache hit for asset ID: ${assetId}`);
    return new NextResponse(cached.data, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Cache': 'HIT'
      },
    });
  }

  if (isRateLimited(assetId)) {
    console.log(`Rate limit exceeded for asset ID: ${assetId}`);
    return NextResponse.json({ 
      error: 'Rate limit exceeded'
    }, { 
      status: 429,
      headers: {
        'Retry-After': '10',
        'Cache-Control': 'no-cache'
      }
    });
  }

  try {
    // Get the thumbnail URL first
    const thumbnailUrl = await getThumbnailUrl(assetId);
    console.log(`Got thumbnail URL: ${thumbnailUrl}`);

    // Fetch the actual image
    const response = await fetchWithExponentialBackoff(thumbnailUrl, true);
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/png';
    
    // Cache the successful response
    thumbnailCache.set(assetId, {
      data: imageBuffer,
      timestamp: Date.now(),
      contentType
    });

    console.log(`Successfully fetched thumbnail for asset ID: ${assetId}`);
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Cache': 'MISS'
      },
    });

  } catch (error: unknown) {
    console.error(`Failed to fetch thumbnail for asset ID: ${assetId}`, error);
    const status = error instanceof Error && error.message.includes('429') ? 429 : 500;
    
    return NextResponse.json({ 
      error: 'Failed to fetch thumbnail',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status,
      headers: {
        'Cache-Control': 'no-cache',
        ...(status === 429 && { 'Retry-After': '10' })
      }
    });
  }
} 