import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface Playlist {
  id: string
  name: string
  description: string
  games: string[]
  createdAt: string
  updatedAt: string
}

interface PlaylistsDatabase {
  version: string
  lastUpdated: string
  playlists: Playlist[]
}

const playlistsPath = join(process.cwd(), 'data/playlists.json')

// Initialize data file if it doesn't exist
async function initDataFile() {
  try {
    await readFile(playlistsPath, 'utf8')
  } catch {
    // Create data directory if it doesn't exist
    await mkdir(join(process.cwd(), 'data'), { recursive: true })
    // Create initial data file
    const initialData: PlaylistsDatabase = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      playlists: []
    }
    await writeFile(playlistsPath, JSON.stringify(initialData, null, 2))
  }
}

export async function GET() {
  try {
    await initDataFile()
    const content = await readFile(playlistsPath, 'utf8')
    const data: PlaylistsDatabase = JSON.parse(content)
    return NextResponse.json({ playlists: data.playlists })
  } catch (error) {
    console.error('Error reading playlists:', error)
    return NextResponse.json(
      { error: 'Failed to read playlists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDataFile()
    const playlist = await request.json()
    const content = await readFile(playlistsPath, 'utf8')
    const data: PlaylistsDatabase = JSON.parse(content)
    
    // Generate next playlist ID
    const existingIds = data.playlists.map((playlist: Playlist): number => parseInt(playlist.id.replace('playlist_', '')) || 0)
    const nextId = Math.max(...existingIds, 0) + 1
    const playlistId = `playlist_${nextId.toString().padStart(3, '0')}`
    
    const newPlaylist: Playlist = {
      id: playlistId,
      name: playlist.name,
      description: playlist.description,
      games: playlist.games || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    data.playlists.push(newPlaylist)
    data.lastUpdated = new Date().toISOString()
    
    await writeFile(playlistsPath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true, playlist: newPlaylist })
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
    await initDataFile()
    const { id, ...updates } = await request.json()
    const content = await readFile(playlistsPath, 'utf8')
    const data: PlaylistsDatabase = JSON.parse(content)
    
    const playlistIndex = data.playlists.findIndex((playlist: Playlist): boolean => playlist.id === id)
    if (playlistIndex === -1) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }
    
    data.playlists[playlistIndex] = {
      ...data.playlists[playlistIndex],
      ...updates,
      id, // Preserve the original ID
      updatedAt: new Date().toISOString()
    }
    data.lastUpdated = new Date().toISOString()
    
    await writeFile(playlistsPath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true, playlist: data.playlists[playlistIndex] })
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
    await initDataFile()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      )
    }
    
    const content = await readFile(playlistsPath, 'utf8')
    const data: PlaylistsDatabase = JSON.parse(content)
    
    const playlistIndex = data.playlists.findIndex((playlist: Playlist): boolean => playlist.id === id)
    if (playlistIndex === -1) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }
    
    data.playlists.splice(playlistIndex, 1)
    data.lastUpdated = new Date().toISOString()
    
    await writeFile(playlistsPath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    )
  }
} 