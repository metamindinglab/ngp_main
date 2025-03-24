import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Playlist, PlaylistFormData } from '@/types/playlist'

const DATA_FILE = path.join(process.cwd(), 'data', 'playlists.json')

// Initialize data file if it doesn't exist
async function initDataFile() {
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify({ playlists: [] }))
  }
}

// Load playlists from file
async function loadPlaylists(): Promise<Playlist[]> {
  await initDataFile()
  const data = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(data).playlists
}

// Save playlists to file
async function savePlaylists(playlists: Playlist[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify({ playlists }, null, 2))
}

export async function GET() {
  try {
    const playlists = await loadPlaylists()
    return NextResponse.json({ playlists })
  } catch (error) {
    console.error('Error loading playlists:', error)
    return NextResponse.json(
      { error: 'Failed to load playlists' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    // Create new playlist
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      schedules: formData.schedules.map((schedule, index) => ({
        id: `schedule_${Date.now()}_${index}`,
        gameAdId: schedule.gameAdId,
        startDate: schedule.startDate,
        duration: schedule.duration,
        status: 'scheduled'
      })),
      deployments: formData.schedules.flatMap((schedule, scheduleIndex) => 
        schedule.selectedGames.map((gameId, gameIndex) => ({
          id: `deployment_${Date.now()}_${scheduleIndex}_${gameIndex}`,
          gameId,
          scheduleId: `schedule_${Date.now()}_${scheduleIndex}`,
          deploymentStatus: 'pending' as const,
          deployedAt: undefined,
          removedAt: undefined,
          errorMessage: undefined
        }))
      ),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    }

    // Add the new playlist
    playlists.push(newPlaylist)

    // Save to file
    await savePlaylists(playlists)

    return NextResponse.json(newPlaylist)
  } catch (error) {
    console.error('Error creating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    )
  }
} 