import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to authenticate brand user
async function authenticateBrandUser(request: NextRequest) {
  try {
    const token = request.cookies.get('brandUserSessionToken')?.value
    
    if (!token) {
      return { isValid: false, error: 'No session token' }
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; type: string }
    
    if (decoded.type !== 'brand-user') {
      return { isValid: false, error: 'Invalid token type' }
    }

    const brandUser = await (prisma as any).brandUser.findUnique({
      where: { id: decoded.userId }
    })

    if (!brandUser || !brandUser.isActive) {
      return { isValid: false, error: 'User not found or inactive' }
    }

    return { isValid: true, userId: decoded.userId, user: brandUser }
  } catch (error) {
    return { isValid: false, error: 'Invalid token' }
  }
}

// GET - Fetch brand user's playlists
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Audit: persist GameDeployment.status as ACTIVE/COMPLETED based on schedule endDate
    await (prisma as any).$executeRaw`
      UPDATE "GameDeployment" gd
      SET status = CASE WHEN ps."endDate" IS NOT NULL AND ps."endDate" >= NOW() THEN 'ACTIVE' ELSE 'COMPLETED' END,
          "updatedAt" = NOW()
      FROM "PlaylistSchedule" ps
      WHERE gd."scheduleId" = ps.id
        AND (gd.status IS DISTINCT FROM CASE WHEN ps."endDate" IS NOT NULL AND ps."endDate" >= NOW() THEN 'ACTIVE' ELSE 'COMPLETED' END)
    `

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {
      brandUserId: auth.userId
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Fetch playlists with related data
    const playlists = await (prisma as any).playlist.findMany({
      where,
      include: {
        schedules: {
          include: {
            gameAd: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            deployments: {
              include: {
                game: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    thumbnail: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Compute non-persistent computedStatus for deployments based on schedule status and time window (Option A)
    const now = new Date()
    const transformed = playlists.map((pl: any) => ({
      ...pl,
      schedules: Array.isArray(pl.schedules) ? pl.schedules.map((ps: any) => {
        const start = new Date(ps.startDate)
        const end = new Date(start)
        end.setUTCDate(end.getUTCDate() + (ps.duration || 0))
        const scheduleStatus = String(ps.status || '').toUpperCase()
        const inWindow = now >= start && now < end
        const scheduleComputedStatus = scheduleStatus === 'ACTIVE' && inWindow
          ? 'ACTIVE'
          : (now < start ? 'SCHEDULED' : (now >= end ? 'COMPLETED' : scheduleStatus || 'SCHEDULED'))
        return {
          ...ps,
          computedStatus: scheduleComputedStatus,
          deployments: Array.isArray(ps.deployments) ? ps.deployments.map((gd: any) => {
            const original = String(gd.status || '').toUpperCase()
            const computed = scheduleComputedStatus === 'ACTIVE' ? 'ACTIVE'
              : (scheduleComputedStatus === 'SCHEDULED' ? 'PENDING'
              : (scheduleComputedStatus === 'COMPLETED' ? 'COMPLETED' : original || 'PENDING'))
            return { ...gd, computedStatus: computed }
          }) : []
        }
      }) : []
    }))

    return NextResponse.json({ success: true, playlists: transformed })
  } catch (error) {
    console.error('Error fetching GAP playlists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new playlist
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type, schedules } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Create playlist with schedules in a transaction
    const playlist = await prisma.$transaction(async (tx) => {
      const playlistId = randomUUID()
      
      // Create the playlist
      const newPlaylist = await (tx as any).playlist.create({
        data: {
          id: playlistId,
          name,
          description: description || null,
          type: type || 'standard',
          brandUserId: auth.userId,
          metadata: {},
          updatedAt: new Date()
        }
      })

      // Create schedules if provided
      if (schedules && schedules.length > 0) {
        for (const schedule of schedules) {
          const scheduleId = randomUUID()
          
          // Create schedule
          await (tx as any).playlistSchedule.create({
            data: {
              id: scheduleId,
              playlistId,
              gameAdId: schedule.gameAdId,
              startDate: new Date(schedule.startDate),
              duration: schedule.duration,
              endDate: new Date(new Date(schedule.startDate).getTime() + (Number(schedule.duration || 0) * 24 * 60 * 60 * 1000)),
              status: 'SCHEDULED',
              updatedAt: new Date()
            }
          })

          // Create deployments for selected games (dedupe and skip duplicates)
          if (schedule.selectedGames && schedule.selectedGames.length > 0) {
            const uniqueGameIds = Array.from(new Set(schedule.selectedGames))
            const data = uniqueGameIds.map((gameId: string) => ({
              id: randomUUID(),
              scheduleId,
              gameId,
              status: 'PENDING',
              updatedAt: new Date()
            }))
            await (tx as any).gameDeployment.createMany({ data, skipDuplicates: true })
          }
        }
      }

      // Return the complete playlist with relations
      return await (tx as any).playlist.findUnique({
        where: { id: playlistId },
        include: {
          schedules: {
            include: {
              gameAd: {
                select: {
                  id: true,
                  name: true,
                  type: true
                }
              },
              deployments: {
                include: {
                  game: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      thumbnail: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      playlist
    })
  } catch (error) {
    console.error('Error creating GAP playlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 