import { NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

interface PlaylistScheduleInput {
  id?: string;
  gameAdId: string;
  startDate: string;
  duration: number;
  selectedGames: string[];
}

interface PlaylistInput {
  name: string;
  description?: string | null;
  schedules: PlaylistScheduleInput[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await prisma.$queryRaw`
      SELECT p.*, 
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
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
                  'updatedAt', gd."updatedAt",
                  'game', (
                    SELECT jsonb_build_object(
                      'id', g.id,
                      'name', g.name,
                      'description', g.description,
                      'genre', g.genre,
                      'robloxLink', g."robloxLink",
                      'thumbnail', g.thumbnail
                    )
                    FROM "Game" g
                    WHERE g.id = gd."gameId"
                  )
                ))
                FROM "GameDeployment" gd
                WHERE gd."scheduleId" = ps.id
              ),
              'gameAd', (
                SELECT jsonb_build_object(
                  'id', ga.id,
                  'name', ga.name,
                  'type', ga.type
                )
                FROM "GameAd" ga
                WHERE ga.id = ps."gameAdId"
              )
            )
          ) FILTER (WHERE ps.id IS NOT NULL),
          '[]'::json
        ) as schedules
      FROM "Playlist" p
      LEFT JOIN "PlaylistSchedule" ps ON ps."playlistId" = p.id
      WHERE p.id = ${params.id}
      GROUP BY p.id
    ` as any[]
    
    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }
    
    const playlist = result[0]
    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error reading playlist:', error)
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as PlaylistInput
    
    // Use a transaction for all operations
    const result = await prisma.$transaction(async (tx) => {
      // Update the basic playlist info
      await tx.$executeRaw`
        UPDATE "Playlist"
        SET name = ${body.name},
            description = ${body.description},
            "updatedAt" = NOW()
        WHERE id = ${params.id}
      `

      // Get existing schedules
      const existingSchedules = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "PlaylistSchedule"
        WHERE "playlistId" = ${params.id}
      `

      // Create a set of existing schedule IDs for faster lookup
      const existingScheduleIds = new Set(existingSchedules.map(s => s.id))

      // Process each schedule in the request
      for (const schedule of body.schedules) {
        if (schedule.id && existingScheduleIds.has(schedule.id)) {
          // Update existing schedule
          await tx.$executeRaw`
            UPDATE "PlaylistSchedule"
            SET "gameAdId" = ${schedule.gameAdId},
                "startDate" = ${new Date(schedule.startDate)},
                duration = ${schedule.duration},
                status = 'scheduled',
                "updatedAt" = NOW()
            WHERE id = ${schedule.id}
          `

          // Delete existing deployments
          await tx.$executeRaw`
            DELETE FROM "GameDeployment"
            WHERE "scheduleId" = ${schedule.id}
          `

          // Create new deployments
          for (const gameId of schedule.selectedGames) {
            const deploymentId = randomUUID()
            await tx.$executeRaw`
              INSERT INTO "GameDeployment" (
                id, "scheduleId", "gameId", status, "createdAt", "updatedAt"
              ) VALUES (
                ${deploymentId}, ${schedule.id}, ${gameId}, 'pending', NOW(), NOW()
              )
            `
          }
        } else {
          // Create new schedule
          const scheduleId = schedule.id || randomUUID()
          await tx.$executeRaw`
            INSERT INTO "PlaylistSchedule" (
              id, "playlistId", "gameAdId", "startDate", duration, status, "createdAt", "updatedAt"
            ) VALUES (
              ${scheduleId}, ${params.id}, ${schedule.gameAdId}, ${new Date(schedule.startDate)},
              ${schedule.duration}, 'scheduled', NOW(), NOW()
            )
          `

          // Create deployments for new schedule
          for (const gameId of schedule.selectedGames) {
            const deploymentId = randomUUID()
            await tx.$executeRaw`
              INSERT INTO "GameDeployment" (
                id, "scheduleId", "gameId", status, "createdAt", "updatedAt"
              ) VALUES (
                ${deploymentId}, ${scheduleId}, ${gameId}, 'pending', NOW(), NOW()
              )
            `
          }
        }
      }

      // Delete schedules that are no longer in the request
      const newScheduleIds = new Set(body.schedules.map(s => s.id).filter(Boolean))
      for (const { id } of existingSchedules) {
        if (!newScheduleIds.has(id)) {
          await tx.$executeRaw`
            DELETE FROM "PlaylistSchedule"
            WHERE id = ${id}
          `
        }
      }

      // Return the updated playlist with all its relations
      return await tx.$queryRaw`
        SELECT p.*, 
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
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
                    'updatedAt', gd."updatedAt",
                    'game', (
                      SELECT jsonb_build_object(
                        'id', g.id,
                        'name', g.name,
                        'description', g.description,
                        'genre', g.genre,
                        'robloxLink', g."robloxLink",
                        'thumbnail', g.thumbnail
                      )
                      FROM "Game" g
                      WHERE g.id = gd."gameId"
                    )
                  ))
                  FROM "GameDeployment" gd
                  WHERE gd."scheduleId" = ps.id
                ),
                'gameAd', (
                  SELECT jsonb_build_object(
                    'id', ga.id,
                    'name', ga.name,
                    'type', ga.type
                  )
                  FROM "GameAd" ga
                  WHERE ga.id = ps."gameAdId"
                )
              )
            ) FILTER (WHERE ps.id IS NOT NULL),
            '[]'::json
          ) as schedules
        FROM "Playlist" p
        LEFT JOIN "PlaylistSchedule" ps ON ps."playlistId" = p.id
        WHERE p.id = ${params.id}
        GROUP BY p.id
      `
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating playlist:', error)
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$executeRaw`
      DELETE FROM "Playlist"
      WHERE id = ${params.id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 })
  }
} 