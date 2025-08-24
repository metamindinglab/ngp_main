import { NextResponse } from 'next/server';

const MAX_RETRIES = 3; // Increased from 1 to 3
const INITIAL_RETRY_DELAY = 1000; // Increased from 500ms to 1s
const MAX_RETRY_DELAY = 5000; // Increased from 2s to 5s
const FETCH_TIMEOUT = 10000; // Increased from 8s to 10s

// Cache successful responses in memory with LRU
const CACHE_TTL = 24 * 3600000; // Increased to 24 hours
const MAX_CACHE_SIZE = 2000; // Increased from 1000 to 2000
const thumbnailCache = new Map<string, { data: ArrayBuffer; timestamp: number; contentType: string }>();

// Queue for rate limiting
type QueueItem = {
  assetId: string;
  resolve: (value: Response) => void;
  reject: (error: Error) => void;
};

const queue: QueueItem[] = [];
let isProcessingQueue = false;

// Process queue with rate limiting
async function processQueue() {
  if (isProcessingQueue || queue.length === 0) return;
  isProcessingQueue = true;

  try {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;

      try {
        const response = await fetchThumbnail(item.assetId);
        item.resolve(response);
      } catch (error) {
        if (error instanceof Error) {
          item.reject(error);
        } else {
          item.reject(new Error('Unknown error'));
        }
      }

      // Wait between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } finally {
    isProcessingQueue = false;
  }
}

// Add request to queue
function queueRequest(assetId: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    queue.push({ assetId, resolve, reject });
    processQueue();
  });
}

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

async function fetchThumbnail(assetId: string): Promise<Response> {
  const thumbnailUrl = await getThumbnailUrl(assetId);
  const response = await fetchWithExponentialBackoff(thumbnailUrl, true);
  
  // Cache the successful response
  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('Content-Type') || 'image/png';
  thumbnailCache.set(assetId, {
    data: buffer,
    timestamp: Date.now(),
    contentType
  });

  return new Response(buffer, {
    headers: { 'Content-Type': contentType }
  });
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
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetchWithTimeout(url, {
        cache: 'no-store',
        headers: {
          'Accept': expectImage ? 'image/png,image/*' : 'application/json',
          'User-Agent': 'Roblox Asset Manager/1.0',
          'Referer': 'https://www.roblox.com/'
        }
      });

      if (response.ok) {
        if (expectImage) {
          const contentType = response.headers.get('Content-Type');
          if (!contentType?.startsWith('image/')) {
            throw new Error(`Invalid content type: ${contentType}`);
          }
        }
        return response;
      }

      if (response.status === 404) {
        // Return a default placeholder image for 404s
        return getFallbackImage();
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        const delay = Math.min(retryAfter * 1000, MAX_RETRY_DELAY);
        console.log(`Rate limited. Waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        continue;
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (attempt === retries) {
        return getFallbackImage();
      }

      const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
      console.log(`Waiting ${delay}ms before retry ${attempt + 1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  return getFallbackImage();
}

async function getFallbackImage(): Promise<Response> {
  // Return a placeholder image from your public directory
  const placeholderUrl = '/placeholder.svg';
  try {
    const response = await fetch(new URL(placeholderUrl, process.env.NEXT_PUBLIC_APP_URL));
    return response;
  } catch {
    // If even the placeholder fails, return an empty transparent PNG
    const transparentPixel = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    return new Response(transparentPixel, {
      headers: { 'Content-Type': 'image/png' }
    });
  }
}

async function getThumbnailUrl(assetId: string): Promise<string> {
  try {
    // Try the v1 API first
    const response = await fetchWithExponentialBackoff(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png`,
      false
    );
    const data = await response.json();
    
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
      headers: { 'Content-Type': cached.contentType }
    });
  }

  try {
    // Queue the request to handle rate limiting
    const response = await queueRequest(assetId);
    return response;
  } catch (error) {
    console.error(`Failed to fetch thumbnail for asset ID: ${assetId}`, error);
    return getFallbackImage();
  }
} 