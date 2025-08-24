import { NextRequest, NextResponse } from 'next/server'

// Enhanced in-memory cache with better management
const thumbnailCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 15 * 60 * 1000 // Increased to 15 minutes
const RATE_LIMIT_COOLDOWN = 30 * 1000 // Reduced to 30 seconds
const MAX_CACHE_SIZE = 200 // Increased cache size

let lastRateLimitTime = 0
let rateLimitCount = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assetIds = searchParams.get('assetIds')
    const size = searchParams.get('size') || '420x420'
    const format = searchParams.get('format') || 'Png'
    const isCircular = searchParams.get('isCircular') || 'false'

    if (!assetIds) {
      return NextResponse.json({ error: 'assetIds parameter is required' }, { status: 400 })
    }

    // Create cache key
    const cacheKey = `${assetIds}_${size}_${format}_${isCircular}`
    
    // Check cache first (with better hit ratio)
    const cached = thumbnailCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Cache hit for asset ${assetIds}`)
      return NextResponse.json(cached.data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=900', // 15 minutes browser cache
        },
      })
    }

    // Smart rate limit check - gradually reduce cooldown
    const timeSinceRateLimit = Date.now() - lastRateLimitTime
    if (timeSinceRateLimit < RATE_LIMIT_COOLDOWN) {
      // If we've been rate limited recently, check if we should try again
      const progressiveDelay = Math.max(5000, RATE_LIMIT_COOLDOWN - timeSinceRateLimit)
      if (progressiveDelay > 5000) {
        console.log(`In rate limit cooldown, ${Math.round(progressiveDelay/1000)}s remaining`)
        return returnCachedFallbackOrTry(assetIds, cacheKey)
      }
    }

    // Construct the Roblox API URL
    const robloxUrl = `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds}&size=${size}&format=${format}&isCircular=${isCircular}`

    try {
      const response = await fetch(robloxUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'MML-Network/1.0',
          'Accept': 'application/json',
        },
        // Increased timeout
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })

      if (response.status === 429) {
        console.log('Rate limited by Roblox API, entering cooldown')
        lastRateLimitTime = Date.now()
        rateLimitCount++
        return returnCachedFallbackOrTry(assetIds, cacheKey)
      }

      if (!response.ok) {
        throw new Error(`Roblox API error: ${response.status}`)
      }

      const data = await response.json()

      // Reset rate limit counter on success
      rateLimitCount = 0

      // Cache the successful response with enhanced cleanup
      thumbnailCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      })

      // Enhanced cache cleanup
      if (thumbnailCache.size > MAX_CACHE_SIZE) {
        cleanupCache()
      }

      return NextResponse.json(data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=900', // 15 minutes browser cache
        },
      })

    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        console.log('Request timed out, returning cached or fallback')
        return returnCachedFallbackOrTry(assetIds, cacheKey)
      }
      throw error
    }

  } catch (error) {
    console.error('Error fetching Roblox thumbnails:', error)
    const { searchParams } = new URL(request.url)
    const assetIds = searchParams.get('assetIds') || '0'
    return returnCachedFallbackOrTry(assetIds, `${assetIds}_${searchParams.get('size') || '420x420'}_${searchParams.get('format') || 'Png'}_${searchParams.get('isCircular') || 'false'}`)
  }
}

// Enhanced fallback that tries to return cached data first
function returnCachedFallbackOrTry(assetIds: string, cacheKey: string) {
  // Try to return stale cached data first (up to 1 hour old)
  const staleCache = thumbnailCache.get(cacheKey)
  if (staleCache && Date.now() - staleCache.timestamp < 60 * 60 * 1000) {
    console.log(`Returning stale cache for asset ${assetIds}`)
    return NextResponse.json(staleCache.data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300', // 5 minutes for stale data
      },
    })
  }

  // Return fallback response as last resort
  return NextResponse.json({
    data: [{
      targetId: parseInt(assetIds) || 0,
      state: "Completed",
      imageUrl: null, // This will trigger the fallback UI
      version: "1"
    }]
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache', // Don't cache fallback responses
    },
    status: 200 // Return 200 so the frontend handles it gracefully
  })
}

// Enhanced cache cleanup
function cleanupCache() {
  const now = Date.now()
  const entriesToDelete: string[] = []
  
  for (const [key, value] of thumbnailCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      entriesToDelete.push(key)
    }
  }
  
  // Remove expired entries
  entriesToDelete.forEach(key => thumbnailCache.delete(key))
  
  // If still too large, remove oldest entries
  if (thumbnailCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(thumbnailCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    const toRemove = sortedEntries.slice(0, thumbnailCache.size - MAX_CACHE_SIZE)
    toRemove.forEach(([key]) => thumbnailCache.delete(key))
  }
  
  console.log(`Cache cleanup: ${entriesToDelete.length} expired, ${thumbnailCache.size} remaining`)
} 
