'use client'

import React from 'react'
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
import { PlaylistDialog } from '@/components/playlists/playlist-dialog'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, Calendar, Users, Play, Loader2 } from 'lucide-react'

// Color constants for GAP theme
const COLORS = {
  primary: '#2563eb',    // Blue
  secondary: '#16a34a',  // Green
  accent: '#9333ea',     // Purple
  destructive: '#dc2626', // Red
  muted: '#64748b',      // Slate
}

export function GAPPlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch playlists from GAP API
  const fetchPlaylists = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.append('search', searchTerm)

      const response = await fetch(`/api/gap/playlists?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch playlists')
      }

      const data = await response.json()
      if (data.success) {
        setPlaylists(data.playlists || [])
      } else {
        throw new Error(data.error || 'Failed to fetch playlists')
      }
    } catch (error) {
      console.error('Error loading playlists:', error)
      toast({
        title: 'Error',
        description: 'Failed to load playlists. Please try again.',
        variant: 'destructive'
      })
      setPlaylists([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load playlists on component mount and when search term changes
  useEffect(() => {
    fetchPlaylists()
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchPlaylists()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) {
      return
    }

    try {
      setIsDeleting(playlistId)
      const response = await fetch(`/api/gap/playlists/${playlistId}`, { 
        method: 'DELETE' 
      })

      if (!response.ok) {
        throw new Error('Failed to delete playlist')
      }

      const data = await response.json()
      if (data.success) {
        setPlaylists(playlists => playlists.filter(playlist => playlist.id !== playlistId))
        toast({
          title: 'Success',
          description: 'Playlist deleted successfully!',
        })
      } else {
        throw new Error(data.error || 'Failed to delete playlist')
      }
    } catch (error) {
      console.error('Error deleting playlist:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete playlist. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredPlaylists = playlists.filter(playlist => 
    (playlist.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const totalPlaylists = playlists.length
  const activePlaylists = playlists.filter(p => (p.schedules || []).length > 0).length
  const totalSchedules = playlists.reduce((sum, p) => sum + (p.schedules || []).length, 0)
  const totalDeployments = playlists.reduce((sum, p) => 
    sum + (p.schedules || []).reduce((scheduleSum, s) => 
      scheduleSum + (s.deployments || []).length, 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading playlists...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Playlist Manager</h1>
          <p className="text-gray-600">Create and manage advertisement playlists for your campaigns</p>
        </div>
        <Button
          onClick={() => {
            setSelectedPlaylist(null)
            setIsDialogOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Playlist
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlaylists}</div>
            <p className="text-xs text-muted-foreground">All created playlists</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Playlists</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlaylists}</div>
            <p className="text-xs text-muted-foreground">Playlists with schedules</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchedules}</div>
            <p className="text-xs text-muted-foreground">Scheduled ad campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Game Deployments</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeployments}</div>
            <p className="text-xs text-muted-foreground">Total game deployments</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Playlists Grid */}
      {filteredPlaylists.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Play className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No playlists found</h3>
              <p className="text-gray-600 mt-1">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first playlist to get started'}
              </p>
            </div>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setSelectedPlaylist(null)
                  setIsDialogOpen(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Playlist
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map(playlist => (
            <Card 
              key={playlist.id}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-blue-500"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                      {playlist.name || 'Unnamed Playlist'}
                    </CardTitle>
                    <CardDescription>{playlist.description || 'No description'}</CardDescription>
                  </div>
                  <Badge className={`${getStatusColor((playlist.schedules?.length || 0) > 0 ? 'active' : 'inactive')}`}>
                    {(playlist.schedules?.length || 0) > 0 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600 font-medium">Created:</span>
                    <span className="text-gray-900">
                      {playlist.createdAt ? `${formatDistanceToNow(new Date(playlist.createdAt))} ago` : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600 font-medium">Schedules:</span>
                    <span className="text-gray-900">{(playlist.schedules || []).length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600 font-medium">Deployments:</span>
                    <span className="text-gray-900">
                      {(playlist.schedules || []).reduce((total, schedule) => total + (schedule.deployments || []).length, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPlaylist(playlist)
                    setIsDialogOpen(true)
                  }}
                  className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  disabled={isDeleting === playlist.id}
                  className="border-2 border-red-300 bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300"
                >
                  {isDeleting === playlist.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Playlist Dialog */}
      <PlaylistDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedPlaylist(null)
        }}
        initialData={selectedPlaylist}
        onSave={async (playlistData) => {
          try {
            setIsCreating(true)
            const method = selectedPlaylist ? 'PUT' : 'POST'
            const url = selectedPlaylist 
              ? `/api/gap/playlists/${selectedPlaylist.id}` 
              : '/api/gap/playlists'
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(playlistData)
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || `Failed to save playlist (${response.status})`)
            }

            const data = await response.json()
            if (data.success) {
              const savedPlaylist = data.playlist
              
              if (selectedPlaylist) {
                setPlaylists(playlists => 
                  playlists.map(p => p.id === selectedPlaylist.id ? savedPlaylist : p)
                )
                toast({
                  title: 'Success',
                  description: 'Playlist updated successfully!',
                })
              } else {
                setPlaylists(playlists => [savedPlaylist, ...playlists])
                toast({
                  title: 'Success',
                  description: 'Playlist created successfully!',
                })
              }
              
              setIsDialogOpen(false)
              setSelectedPlaylist(null)
            } else {
              throw new Error(data.error || 'Failed to save playlist')
            }
          } catch (error) {
            console.error('Error saving playlist:', error)
            toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Failed to save playlist. Please try again.',
              variant: 'destructive'
            })
            throw error // Re-throw to let the dialog handle it
          } finally {
            setIsCreating(false)
          }
        }}
      />
    </div>
  )
} 