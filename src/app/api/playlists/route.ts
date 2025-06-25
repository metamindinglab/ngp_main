import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { addCorsHeaders, handleAuth, applyRateLimit, addRateLimitHeaders, handleOptions } from '../middleware'

const prisma = new PrismaClient()

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is an authenticated request from a Roblox game
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (apiKey) {
      // Handle authentication for external Roblox games
      const auth = await handleAuth(request)
      if (!auth.isValid) {
        const response = NextResponse.json({ error: auth.error }, { status: 401 })
        return addCorsHeaders(response)
      }

      // Apply rate limiting for authenticated requests
      const rateLimit = applyRateLimit(apiKey)
      
      if (!rateLimit.allowed) {
        const response = NextResponse.json(
          { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
          { status: 429 }
        )
        addRateLimitHeaders(response, rateLimit)
        return addCorsHeaders(response)
      }
    }

    const playlists = await prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assets: true, // Include associated assets for Roblox games
        games: true   // Include associated games
      }
    })
    
    const response = NextResponse.json({ 
      success: true,
      playlists 
    })

    // Add rate limit headers if this was an authenticated request
    if (apiKey) {
      const rateLimit = applyRateLimit(apiKey)
      addRateLimitHeaders(response, rateLimit)
    }

    return addCorsHeaders(response)
  } catch (error) {
    console.error('Error reading playlists:', error)
    const response = NextResponse.json(
      { error: 'Failed to read playlists' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const playlist = await prisma.playlist.create({
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type || 'standard',
        createdBy: body.createdBy || null,
        metadata: body.metadata || {}
      }
    })
    
    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error creating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      )
    }
    
    const playlist = await prisma.playlist.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        type: updates.type,
        createdBy: updates.createdBy,
        metadata: updates.metadata || {},
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ success: true, playlist })
  } catch (error) {
    console.error('Error updating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      )
    }
    
    await prisma.playlist.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    )
  }
} 