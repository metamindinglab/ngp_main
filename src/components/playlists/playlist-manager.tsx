'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Playlist } from '@/types/playlist'
import { PlaylistDialog } from './playlist-dialog'
import { formatDistanceToNow } from 'date-fns'

export function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load playlists
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const response = await fetch('/api/playlists')
        const data = await response.json()
        setPlaylists(data.playlists)
      } catch (error) {
        console.error('Error loading playlists:', error)
      }
    }
    loadPlaylists()
  }, [])

  const handleDeletePlaylist = async (playlistId: string) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      try {
        await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE' })
        setPlaylists(playlists.filter(playlist => playlist.id !== playlistId))
      } catch (error) {
        console.error('Error deleting playlist:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'inactive':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Playlist Manager</h1>
        <div className="flex gap-4">
          <Input
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button
            onClick={() => {
              setSelectedPlaylist(null)
              setIsDialogOpen(true)
            }}
          >
            Create New Playlist
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlaylists.map(playlist => (
          <Card key={playlist.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{playlist.name}</CardTitle>
                  <CardDescription>{playlist.description}</CardDescription>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(playlist.status)}`}>
                  {playlist.status}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Created {formatDistanceToNow(new Date(playlist.createdAt))} ago</div>
                <div>Last updated {formatDistanceToNow(new Date(playlist.updatedAt))} ago</div>
                <div>{playlist.schedules.length} scheduled ads</div>
                <div>{playlist.deployments.length} game deployments</div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPlaylist(playlist)
                  setIsDialogOpen(true)
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeletePlaylist(playlist.id)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <PlaylistDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedPlaylist(null)
        }}
        initialData={selectedPlaylist}
        onSave={async (playlistData) => {
          try {
            const method = selectedPlaylist ? 'PUT' : 'POST'
            const url = selectedPlaylist 
              ? `/api/playlists/${selectedPlaylist.id}` 
              : '/api/playlists'
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(playlistData)
            })

            if (!response.ok) {
              throw new Error('Failed to save playlist')
            }

            const savedPlaylist = await response.json()
            
            if (selectedPlaylist) {
              setPlaylists(playlists => 
                playlists.map(p => p.id === selectedPlaylist.id ? savedPlaylist : p)
              )
            } else {
              setPlaylists(playlists => [...playlists, savedPlaylist])
            }
            
            setIsDialogOpen(false)
            setSelectedPlaylist(null)
          } catch (error) {
            console.error('Error saving playlist:', error)
          }
        }}
      />
    </div>
  )
} 