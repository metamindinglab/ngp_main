import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Validation schemas
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

const containerUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  type: z.enum(['DISPLAY', 'NPC', 'MINIGAME']),
  position: positionSchema,
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
})

// Get container details
export async function GET(
  request: NextRequest,
  { params }: { params: { containerId: string } }
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

    // Verify JWT token
    let userId: string
    try {
      const decoded = verify(sessionToken, JWT_SECRET) as { userId: string }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.gameOwner.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get container with authorization check
    const container = await prisma.adContainer.findFirst({
      where: {
        id: params.containerId,
        game: {
          gameOwnerId: user.id
        }
      },
      include: {
        game: {
          select: {
            id: true,
            name: true
          }
        },
        currentAd: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    if (!container) {
      return NextResponse.json(
        { success: false, error: 'Container not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, container })
  } catch (error) {
    console.error('Error fetching container:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch container' },
      { status: 500 }
    )
  }
}

// Update container
export async function PUT(
  request: NextRequest,
  { params }: { params: { containerId: string } }
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

    // Verify JWT token
    let userId: string
    try {
      const decoded = verify(sessionToken, JWT_SECRET) as { userId: string }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.gameOwner.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get container to verify ownership
    const existingContainer = await prisma.adContainer.findFirst({
      where: {
        id: params.containerId,
        game: {
          gameOwnerId: user.id
        }
      }
    })

    if (!existingContainer) {
      return NextResponse.json(
        { success: false, error: 'Container not found or unauthorized' },
        { status: 404 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validationResult = containerUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Update container
    const updatedContainer = await prisma.adContainer.update({
      where: {
        id: params.containerId
      },
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        position: body.position,
        status: body.status
      },
      include: {
        game: {
          select: {
            id: true,
            name: true
          }
        },
        currentAd: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, container: updatedContainer })
  } catch (error) {
    console.error('Error updating container:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update container' },
      { status: 500 }
    )
  }
} 