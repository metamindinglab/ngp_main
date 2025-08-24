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

// GET - Fetch specific playlist
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        AND ps."playlistId" = ${params.id}
        AND (gd.status IS DISTINCT FROM CASE WHEN ps."endDate" IS NOT NULL AND ps."endDate" >= NOW() THEN 'ACTIVE' ELSE 'COMPLETED' END)
    `

    const playlist = await (prisma as any).playlist.findFirst({
      where: {
        id: params.id,
        brandUserId: auth.userId
      },
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

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Compute non-persistent computedStatus (Option A)
    const now = new Date()
    const transformed = {
      ...playlist,
      schedules: Array.isArray(playlist.schedules) ? playlist.schedules.map((ps: any) => {
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
    }

    return NextResponse.json({ success: true, playlist: transformed })
  } catch (error) {
    console.error('Error fetching GAP playlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update playlist
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type, schedules } = body

    // Check if playlist exists and belongs to user
    const existingPlaylist = await (prisma as any).playlist.findFirst({
      where: {
        id: params.id,
        brandUserId: auth.userId
      }
    })

    if (!existingPlaylist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Update playlist with schedules in a transaction
    const playlist = await prisma.$transaction(async (tx) => {
      // Update the playlist
      await (tx as any).playlist.update({
        where: { id: params.id },
        data: {
          name: name || existingPlaylist.name,
          description: description !== undefined ? description : existingPlaylist.description,
          type: type || existingPlaylist.type,
          updatedAt: new Date()
        }
      })

      // If schedules are provided, update them
      if (schedules) {
        // Get existing schedules
        const existingSchedules = await (tx as any).playlistSchedule.findMany({
          where: { playlistId: params.id }
        })

        const existingScheduleIds = new Set(existingSchedules.map((s: any) => s.id))
        const newScheduleIds = new Set(schedules.map((s: any) => s.id).filter(Boolean))

        // Process each schedule in the request
        for (const schedule of schedules) {
          if (schedule.id && existingScheduleIds.has(schedule.id)) {
            // Update existing schedule
            await (tx as any).playlistSchedule.update({
              where: { id: schedule.id },
              data: {
                gameAdId: schedule.gameAdId,
                startDate: new Date(schedule.startDate),
                duration: schedule.duration,
                endDate: new Date(new Date(schedule.startDate).getTime() + (Number(schedule.duration || 0) * 24 * 60 * 60 * 1000)),
                status: 'SCHEDULED',
                updatedAt: new Date()
              }
            })

            // Delete existing deployments and create new ones
            await (tx as any).gameDeployment.deleteMany({
              where: { scheduleId: schedule.id }
            })

            if (schedule.selectedGames && schedule.selectedGames.length > 0) {
              for (const gameId of schedule.selectedGames) {
                await (tx as any).gameDeployment.create({
                  data: {
                    id: randomUUID(),
                    scheduleId: schedule.id,
                    gameId,
                    status: 'PENDING',
                    updatedAt: new Date()
                  }
                })
              }
            }
          } else {
            // Create new schedule
            const scheduleId = schedule.id || randomUUID()
            await (tx as any).playlistSchedule.create({
              data: {
                id: scheduleId,
                playlistId: params.id,
                gameAdId: schedule.gameAdId,
                startDate: new Date(schedule.startDate),
                duration: schedule.duration,
                endDate: new Date(new Date(schedule.startDate).getTime() + (Number(schedule.duration || 0) * 24 * 60 * 60 * 1000)),
                status: 'SCHEDULED',
                updatedAt: new Date()
              }
            })

            // Create deployments for new schedule
            if (schedule.selectedGames && schedule.selectedGames.length > 0) {
              for (const gameId of schedule.selectedGames) {
                await (tx as any).gameDeployment.create({
                  data: {
                    id: randomUUID(),
                    scheduleId,
                    gameId,
                    status: 'PENDING',
                    updatedAt: new Date()
                  }
                })
              }
            }
          }
        }

        // Delete schedules that are no longer in the request
        for (const existingSchedule of existingSchedules) {
          if (!newScheduleIds.has(existingSchedule.id)) {
            await (tx as any).playlistSchedule.delete({
              where: { id: existingSchedule.id }
            })
          }
        }
      }

      // Return the updated playlist with relations
      return await (tx as any).playlist.findUnique({
        where: { id: params.id },
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
    console.error('Error updating GAP playlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateBrandUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Check if playlist exists and belongs to user
    const existingPlaylist = await (prisma as any).playlist.findFirst({
      where: {
        id: params.id,
        brandUserId: auth.userId
      }
    })

    if (!existingPlaylist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Delete the playlist (cascading deletes will handle schedules and deployments)
    await (prisma as any).playlist.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Playlist deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting GAP playlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 