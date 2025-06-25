import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const playlists = await prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ playlists })
  } catch (error) {
    console.error('Error reading playlists:', error)
    return NextResponse.json(
      { error: 'Failed to read playlists' },
      { status: 500 }
    )
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