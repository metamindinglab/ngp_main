import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { addCorsHeaders, handleAuth, applyRateLimit, addRateLimitHeaders, handleOptions } from '../middleware'
import { randomUUID } from 'crypto'

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
        schedules: {
          include: {
            gameAd: true,
            deployments: {
              include: {
                game: true
              }
            }
          }
        }
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

interface PlaylistScheduleInput {
  gameAdId: string
  startDate: string
  duration: number
  selectedGames: string[]
}

interface PlaylistInput {
  name: string
  description?: string | null
  type?: string
  createdBy?: string | null
  metadata?: any
  schedules: PlaylistScheduleInput[]
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as PlaylistInput
    const playlistId = randomUUID()
    
    // Create playlist with schedules and deployments using a transaction
    const playlist = await prisma.$transaction(async (tx) => {
      // Create the playlist first
      const newPlaylist = await tx.playlist.create({
        data: {
          id: playlistId,
          name: body.name,
          description: body.description || null,
          type: body.type || 'standard',
          createdBy: body.createdBy || null,
          metadata: body.metadata || {},
          updatedAt: new Date()
        }
      })

      // Create schedules and deployments
      if (body.schedules.length > 0) {
        for (const schedule of body.schedules) {
          const scheduleId = randomUUID()
          await tx.$executeRaw`
            INSERT INTO "PlaylistSchedule" (
              id, "playlistId", "gameAdId", "startDate", duration, "endDate", status, "createdAt", "updatedAt"
            ) VALUES (
              ${scheduleId}, ${playlistId}, ${schedule.gameAdId}, ${new Date(schedule.startDate)}, 
              ${schedule.duration}, ${new Date(new Date(schedule.startDate).getTime() + (Number(schedule.duration || 0) * 24 * 60 * 60 * 1000))}, 'SCHEDULED', NOW(), NOW()
            )
          `

          // Create deployments for new schedule
          for (const gameId of schedule.selectedGames) {
            const deploymentId = randomUUID()
            await tx.$executeRaw`
              INSERT INTO "GameDeployment" (
                id, "scheduleId", "gameId", status, "createdAt", "updatedAt"
              ) VALUES (
                ${deploymentId}, ${scheduleId}, ${gameId}, 'PENDING', NOW(), NOW()
              )
            `
          }
        }
      }

      // Return the complete playlist with schedules and deployments
      return await tx.$queryRaw`
        SELECT p.*, 
          json_agg(DISTINCT jsonb_build_object(
            'id', ps.id,
            'playlistId', ps."playlistId",
            'gameAdId', ps."gameAdId",
            'startDate', ps."startDate",
            'duration', ps.duration,
            'status', ps.status,
            'createdAt', ps."createdAt",
            'updatedAt', ps."updatedAt",
            'deployments', (
              SELECT json_agg(jsonb_build_object(
                'id', gd.id,
                'gameId', gd."gameId",
                'status', gd.status,
                'createdAt', gd."createdAt",
                'updatedAt', gd."updatedAt"
              ))
              FROM "GameDeployment" gd
              WHERE gd."scheduleId" = ps.id
            )
          )) as schedules
        FROM "Playlist" p
        LEFT JOIN "PlaylistSchedule" ps ON ps."playlistId" = p.id
        WHERE p.id = ${playlistId}
        GROUP BY p.id
      `
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