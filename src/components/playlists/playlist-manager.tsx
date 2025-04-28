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
import { PlaylistDialog } from './playlist-dialog'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { MMLLogo } from "@/components/ui/mml-logo"

// Add color constants
const COLORS = {
  primary: '#2563eb',    // Blue
  secondary: '#16a34a',  // Green
  accent: '#9333ea',     // Purple
  destructive: '#dc2626', // Red
  muted: '#64748b',      // Slate
};

export function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load playlists
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        // Check cache first
        const cachedData = sessionStorage.getItem('playlistsData');
        const cachedTimestamp = sessionStorage.getItem('playlistsDataTimestamp');
        const now = Date.now();
        
        // Use cached data if it's less than 30 seconds old
        if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp)) < 30000) {
          setPlaylists(JSON.parse(cachedData));
          return;
        }

        const response = await fetch('/api/playlists')
        const data = await response.json()
        
        // Cache the data
        sessionStorage.setItem('playlistsData', JSON.stringify(data.playlists));
        sessionStorage.setItem('playlistsDataTimestamp', now.toString());
        
        setPlaylists(data.playlists)
      } catch (error) {
        console.error('Error loading playlists:', error)
      }
    }

    // Initial load
    loadPlaylists()

    // Set up polling with a 30-second interval
    const intervalId = setInterval(loadPlaylists, 30000);

    return () => {
      clearInterval(intervalId);
    };
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
        return 'text-green-600 bg-green-100 border border-green-200'
      case 'inactive':
        return 'text-gray-600 bg-gray-100 border border-gray-200'
      default:
        return 'text-gray-600 bg-gray-100 border border-gray-200'
    }
  }

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>Playlist Manager</h1>
          <div className="flex gap-4">
            <Input
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 border-gray-200 focus:border-primary focus:ring-primary transition-colors"
            />
            <Button
              onClick={() => {
                setSelectedPlaylist(null)
                setIsDialogOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:scale-[1.02]"
            >
              Create New Playlist
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map(playlist => (
            <Card 
              key={playlist.id}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4"
              style={{ borderLeftColor: playlist.status === 'active' ? COLORS.secondary : COLORS.muted }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {playlist.name}
                    </CardTitle>
                    <CardDescription>{playlist.description}</CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(playlist.status)} transition-all duration-300 group-hover:scale-105`}>
                    {playlist.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600 font-medium">Created:</span>
                    <span className="text-gray-900">{formatDistanceToNow(new Date(playlist.createdAt))} ago</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600 font-medium">Last updated:</span>
                    <span className="text-gray-900">{formatDistanceToNow(new Date(playlist.updatedAt))} ago</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600 font-medium">Scheduled ads:</span>
                    <span className="text-gray-900">{playlist.schedules.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600 font-medium">Game deployments:</span>
                    <span className="text-gray-900">{playlist.deployments.length}</span>
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
                  className="border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 hover:scale-105"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  className="border-2 border-destructive bg-white text-destructive hover:bg-destructive hover:text-white transition-all duration-300 hover:scale-105"
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
    </div>
  )
} 