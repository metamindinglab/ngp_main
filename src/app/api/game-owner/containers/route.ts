import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

// Define the types based on the schema
type AdContainerType = 'DISPLAY' | 'NPC' | 'MINIGAME'
type AdContainerStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'

const AdContainerStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE'
} as const

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Validation schemas
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

const containerSchema = z.object({
  gameId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(['DISPLAY', 'NPC', 'MINIGAME']),
  position: positionSchema,
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
})

// Default placeholder assets by container type
const PLACEHOLDER_ASSETS = {
  DISPLAY: { robloxAssetId: "rbxassetid://default_billboard" },
  NPC: { robloxAssetId: "rbxassetid://default_npc" },
  MINIGAME: { robloxAssetId: "rbxassetid://default_trigger" }
}

// Get all containers for a game owner
export async function GET(request: NextRequest) {
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

    const containers = await prisma.adContainer.findMany({
      where: {
        game: {
          gameOwnerId: user.id
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        position: true,
        status: true,
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
            type: true,
            assets: true
          }
        }
      }
    })

    // Enhance response with placeholder assets
    const enhancedContainers = containers.map(container => ({
      ...container,
      placeholderAsset: PLACEHOLDER_ASSETS[container.type as AdContainerType]
    }))

    return NextResponse.json({ success: true, containers: enhancedContainers })
  } catch (error) {
    console.error('Error fetching containers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch containers' },
      { status: 500 }
    )
  }
}

// Create a new container
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // Validate input
    const validationResult = containerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Verify game ownership
    const game = await prisma.game.findFirst({
      where: {
        id: body.gameId,
        gameOwnerId: user.id
      }
    })

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found or unauthorized' },
        { status: 404 }
      )
    }

    // Create container
    const container = await prisma.adContainer.create({
      data: {
        gameId: body.gameId,
        name: body.name,
        description: body.description,
        type: body.type as AdContainerType,
        position: body.position,
        status: body.status || AdContainerStatus.ACTIVE
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        position: true,
        status: true,
        game: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Add placeholder asset information
    const response = {
      success: true,
      container,
      placeholderAsset: PLACEHOLDER_ASSETS[container.type as AdContainerType]
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating container:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create container' },
      { status: 500 }
    )
  }
}

// Update a container
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Container ID is required' },
        { status: 400 }
      )
    }

    // Validate input
    const validationResult = containerSchema.partial().safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Verify container ownership
    const existingContainer = await prisma.adContainer.findFirst({
      where: {
        id: body.id,
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

    // Update container
    const container = await prisma.adContainer.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        type: body.type as AdContainerType,
        position: body.position,
        status: body.status as AdContainerStatus
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        position: true,
        status: true,
        game: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Add placeholder asset information
    const response = {
      success: true,
      container,
      placeholderAsset: PLACEHOLDER_ASSETS[container.type as AdContainerType]
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating container:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update container' },
      { status: 500 }
    )
  }
}

// Delete a container
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Container ID is required' },
        { status: 400 }
      )
    }

    // Verify container ownership
    const container = await prisma.adContainer.findFirst({
      where: {
        id,
        game: {
          gameOwnerId: user.id
        }
      }
    })

    if (!container) {
      return NextResponse.json(
        { success: false, error: 'Container not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete container
    await prisma.adContainer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting container:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete container' },
      { status: 500 }
    )
  }
} 