import { NextResponse } from 'next/server';

// Simple in-memory rate limiting
const REQUESTS = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000) {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to fetch from ${url} (attempt ${i + 1}/${retries})`);
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Log response status
      console.log(`Response status: ${response.status}`);

      if (response.status === 429) {
        console.log(`Rate limited on attempt ${i + 1}, waiting ${delay * Math.pow(2, i)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        continue;
      }

      // Clone the response before reading it
      const responseToRead = response.clone();
      let responseBody;
      try {
        responseBody = await responseToRead.json();
        console.log('Response body:', responseBody);
      } catch (e) {
        console.error('Error parsing response:', e);
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

async function getAssetDetails(assetId: string) {
  // Try the economy API first
  console.log('Trying economy API...');
  try {
    const assetResponse = await fetchWithRetry(
      `https://economy.roblox.com/v2/assets/${assetId}/details`,
      {
        method: 'GET'
      }
    );

    if (assetResponse.ok) {
      const assetData = await assetResponse.json();
      console.log('Economy API response:', assetData);

      if (assetData.AssetId) {
        // Also fetch the thumbnail URL
        const thumbnailResponse = await fetch(
          `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        let thumbnailUrl = null;
        if (thumbnailResponse.ok) {
          const thumbnailData = await thumbnailResponse.json();
          if (thumbnailData.data?.[0]?.imageUrl) {
            thumbnailUrl = thumbnailData.data[0].imageUrl;
          }
        }

        return {
          assetId: assetData.AssetId,
          name: assetData.Name,
          description: assetData.Description,
          assetType: assetData.AssetTypeId,
          creator: assetData.Creator,
          thumbnailUrl,
          previewUrl: thumbnailUrl
        };
      }
    }
  } catch (error) {
    console.error('Economy API error:', error);
  }

  // If economy API fails, try the marketplace API
  console.log('Trying marketplace API...');
  try {
    const marketplaceResponse = await fetchWithRetry(
      `https://www.roblox.com/marketplace/productinfo?assetId=${assetId}`,
      {
        method: 'GET'
      }
    );

    if (marketplaceResponse.ok) {
      const marketplaceData = await marketplaceResponse.json();
      console.log('Marketplace API response:', marketplaceData);

      if (marketplaceData.AssetId) {
        // Also fetch the thumbnail URL
        const thumbnailResponse = await fetch(
          `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        let thumbnailUrl = null;
        if (thumbnailResponse.ok) {
          const thumbnailData = await thumbnailResponse.json();
          if (thumbnailData.data?.[0]?.imageUrl) {
            thumbnailUrl = thumbnailData.data[0].imageUrl;
          }
        }

        return {
          assetId: marketplaceData.AssetId,
          name: marketplaceData.Name,
          description: marketplaceData.Description,
          assetType: marketplaceData.AssetTypeId,
          thumbnailUrl,
          previewUrl: thumbnailUrl
        };
      }
    }
  } catch (error) {
    console.error('Marketplace API error:', error);
  }

  return null;
}

async function getCatalogDetails(catalogId: string) {
  // Try the catalog v1 API
  console.log('Trying catalog API...');
  try {
    const catalogResponse = await fetchWithRetry(
      `https://catalog.roblox.com/v1/catalog/items/${catalogId}/details`,
      {
        method: 'GET'
      }
    );

    if (catalogResponse.ok) {
      const catalogData = await catalogResponse.json();
      console.log('Catalog API response:', catalogData);
      return catalogData;
    }
  } catch (error) {
    console.error('Catalog API error:', error);
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`Received request for ID: ${params.id}`);

  // Validate ID format
  if (!params.id || !/^\d+$/.test(params.id)) {
    return NextResponse.json(
      { error: 'Invalid ID format' },
      { status: 400 }
    );
  }

  // Rate limiting check
  const now = Date.now();
  const requestKey = params.id;
  const requestData = REQUESTS.get(requestKey) || { count: 0, timestamp: now };

  if (now - requestData.timestamp > RATE_LIMIT_WINDOW) {
    requestData.count = 1;
    requestData.timestamp = now;
  } else if (requestData.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429 }
    );
  } else {
    requestData.count++;
  }
  REQUESTS.set(requestKey, requestData);

  try {
    // First try to get catalog details
    const catalogDetails = await getCatalogDetails(params.id);
    
    // If we got catalog details and it has an assetId, get the asset details
    if (catalogDetails?.assetId) {
      const assetDetails = await getAssetDetails(catalogDetails.assetId.toString());
      if (assetDetails) {
        return NextResponse.json({
          catalogId: parseInt(params.id),
          ...assetDetails
        });
      }
    }

    // If catalog lookup failed or didn't have an assetId, try direct asset lookup
    const assetDetails = await getAssetDetails(params.id);
    if (assetDetails) {
      return NextResponse.json(assetDetails);
    }

    // If both lookups failed, return 404
    console.log('All API attempts failed');
    return NextResponse.json(
      { error: 'Asset not found. Please check the ID and try again.' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching details:', error);
    let errorMessage = 'Failed to verify asset. Please try again later.';
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Could not connect to Roblox servers. Please check your connection and try again.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limited by Roblox servers. Please wait a moment and try again.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error while connecting to Roblox servers. Please try again.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 