import { NextRequest, NextResponse } from 'next/server'

const CLOUD_API_BASE = 'https://apis.roblox.com'
const GAMES_API_BASE = 'https://games.roblox.com'
const UNIVERSES_API_BASE = 'https://games.roblox.com'
const ANALYTICS_API_BASE = 'https://apis.roblox.com'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const apiKey = request.headers.get('x-api-key')
    const searchParams = new URL(request.url).searchParams
    
    // Remove API prefix from path
    const cleanPath = path.replace(/^(games|cloud|universes|analytics)\//, '')
    
    // Determine which base URL to use based on the original path
    let baseUrl
    if (path.startsWith('cloud/')) {
      baseUrl = CLOUD_API_BASE
    } else if (path.startsWith('universes/')) {
      baseUrl = UNIVERSES_API_BASE
      // Add v1 if not present in cleanPath
      if (!cleanPath.startsWith('v1/') && !cleanPath.startsWith('v2/')) {
        baseUrl += '/v1'
      }
    } else if (path.startsWith('analytics/')) {
      baseUrl = ANALYTICS_API_BASE
    } else {
      // For games API
      baseUrl = GAMES_API_BASE
      // Add version if not present
      if (!cleanPath.startsWith('v1/') && !cleanPath.startsWith('v2/')) {
        baseUrl += '/v1'
      }
    }

    // Construct the full URL, preserving query parameters
    const url = new URL(cleanPath, baseUrl + '/')
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value)
    })
    
    console.log('Proxying request to:', {
      originalPath: path,
      cleanPath,
      finalUrl: url.toString(),
      baseUrl,
      headers: apiKey ? 'Using API key' : 'No API key'
    })

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }

    // Add API key if provided and if using Cloud or Analytics API
    if (apiKey && (path.startsWith('cloud/') || path.startsWith('analytics/'))) {
      headers['x-api-key'] = apiKey
    }

    // Forward the request to Roblox API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    // Get the response data
    let data
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // If the response wasn't ok, throw an error with details
    if (!response.ok) {
      console.error('Roblox API error:', {
        url: url.toString(),
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data
      })
      return NextResponse.json(
        { 
          error: 'Failed to fetch data from Roblox',
          details: typeof data === 'string' ? data : JSON.stringify(data),
          url: url.toString()
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying Roblox API request:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      'Access-Control-Max-Age': '86400',
    },
  })
} 