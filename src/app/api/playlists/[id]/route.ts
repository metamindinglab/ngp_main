import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id }
    })
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }
    
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
    const body = await request.json()
    
    const playlist = await prisma.playlist.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        createdBy: body.createdBy,
        metadata: body.metadata || {},
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json(playlist)
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
    await prisma.playlist.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 })
  }
} 