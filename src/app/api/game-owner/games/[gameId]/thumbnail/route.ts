import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonAuthService } from '@/lib/json-auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate session and get user
    const user = await jsonAuthService.validateSession(sessionToken)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify game ownership
    const game = await prisma.game.findFirst({
      where: {
        id: params.gameId,
        gameOwnerId: user.gameOwnerId,
      },
    })

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found or unauthorized' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('thumbnail') as File
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Create thumbnails directory if it doesn't exist
    const publicDir = join(process.cwd(), 'public')
    const thumbnailsDir = join(publicDir, 'games', 'thumbnails')
    await writeFile(join(thumbnailsDir, '.keep'), '')

    // Generate unique filename
    const filename = `${game.id}-${Date.now()}.${file.type.split('/')[1]}`
    const thumbnailPath = join(thumbnailsDir, filename)

    // Save the file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(thumbnailPath, buffer)

    // Update game thumbnail in database
    await prisma.game.update({
      where: {
        id: game.id,
      },
      data: {
        thumbnail: `/games/thumbnails/${filename}`,
      },
    })

    return NextResponse.json({
      success: true,
      thumbnailUrl: `/games/thumbnails/${filename}`,
    })
  } catch (error) {
    console.error('Error uploading thumbnail:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 