import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Playlist, PlaylistFormData } from '@/types/playlist'

const DATA_FILE = path.join(process.cwd(), 'data', 'playlists.json')

// Load playlists from file
async function loadPlaylists(): Promise<Playlist[]> {
  const data = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(data).playlists
}

// Save playlists to file
async function savePlaylists(playlists: Playlist[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify({ playlists }, null, 2))
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playlists = await loadPlaylists()
    const playlist = playlists.find(p => p.id === params.id)

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error loading playlist:', error)
    return NextResponse.json(
      { error: 'Failed to load playlist' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData: PlaylistFormData = await request.json()
    
    // Validate required fields
    if (!formData.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Load existing playlists
    const playlists = await loadPlaylists()
    const playlistIndex = playlists.findIndex(p => p.id === params.id)

    if (playlistIndex === -1) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    // Update playlist
    const updatedPlaylist: Playlist = {
      ...playlists[playlistIndex],
      name: formData.name,
      description: formData.description,
      schedules: formData.schedules.map((schedule, index) => ({
        id: schedule.gameAdId.startsWith('schedule_') 
          ? schedule.gameAdId 
          : `schedule_${Date.now()}_${index}`,
        gameAdId: schedule.gameAdId,
        startDate: schedule.startDate,
        duration: schedule.duration,
        status: 'scheduled'
      })),
      deployments: formData.schedules.flatMap((schedule, scheduleIndex) => 
        schedule.selectedGames.map((gameId, gameIndex) => ({
          id: `deployment_${Date.now()}_${scheduleIndex}_${gameIndex}`,
          gameId,
          scheduleId: schedule.gameAdId.startsWith('schedule_')
            ? schedule.gameAdId
            : `schedule_${Date.now()}_${scheduleIndex}`,
          deploymentStatus: 'pending' as const,
          deployedAt: undefined,
          removedAt: undefined,
          errorMessage: undefined
        }))
      ),
      updatedAt: new Date().toISOString()
    }

    // Replace the old playlist
    playlists[playlistIndex] = updatedPlaylist

    // Save to file
    await savePlaylists(playlists)

    return NextResponse.json(updatedPlaylist)
  } catch (error) {
    console.error('Error updating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Load existing playlists
    const playlists = await loadPlaylists()
    const playlistIndex = playlists.findIndex(p => p.id === params.id)

    if (playlistIndex === -1) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    // Remove the playlist
    playlists.splice(playlistIndex, 1)

    // Save to file
    await savePlaylists(playlists)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    )
  }
} 