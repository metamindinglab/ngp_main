'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGameOwnerAuth } from '@/components/game-owner/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Copy, Key, RefreshCw, Cloud, Server, Upload, X, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRef } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { MetricsImport } from '../components/MetricsImport'
import { MetricsOverview } from '../components/MetricsOverview'

interface GameData {
  id: string
  name: string
  description: string
  genre: string
  robloxLink: string
  thumbnail: string
  media?: any[] // Added for uploaded media files
  robloxInfo?: { // Added for Roblox images
    images: any[]
  }
}

export default function GameManagePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useGameOwnerAuth()
  const [game, setGame] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const [mediaFiles, setMediaFiles] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({})
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/game-owner/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && params.gameId) {
      fetchGame()
    }
  }, [user, params.gameId])

  const fetchGame = async () => {
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch(`/api/game-owner/games/${params.gameId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.success) {
        setGame(data.game)
      } else {
        setError(data.error || 'Failed to load game')
      }
    } catch (error) {
      setError('Failed to load game')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof GameData, value: string) => {
    if (game) {
      setGame({ ...game, [field]: value })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!game) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch(`/api/game-owner/games/${params.gameId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: game.name,
          description: game.description,
          genre: game.genre,
          robloxLink: game.robloxLink,
          thumbnail: game.thumbnail,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Game updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update game')
      }
    } catch (error) {
      setError('Failed to update game')
    } finally {
      setSaving(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-lg text-muted-foreground">Game not found</p>
          <Button onClick={() => router.push('/game-owner')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.push('/game-owner')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Button>
          <h1 className="text-2xl font-bold">{game.name}</h1>
          {success && (
            <Badge variant="default" className="ml-4 bg-green-500/10 text-green-500">
              {success}
            </Badge>
          )}
          {error && (
            <Badge variant="destructive" className="ml-4">
              {error}
            </Badge>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your game's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Game Name</Label>
                <Input
                  id="name"
                  value={game.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={game.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={game.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="robloxLink">Roblox Game Link</Label>
                <Input
                  id="robloxLink"
                  value={game.robloxLink}
                  onChange={(e) => handleInputChange('robloxLink', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>
                Manage your game's media files and images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Manual Thumbnail URL */}
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={game.thumbnail}
                    onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                    placeholder="Enter thumbnail URL"
                  />
                </div>

                {/* Uploaded Media Files */}
                {game.media && game.media.length > 0 && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-lg mb-2">Uploaded Media Files</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Media files associated with your game
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {game.media.map((media) => (
                          <div key={media.id} className="group rounded-lg border overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
                            {media.type === 'image' && media.localPath && (
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={media.localPath}
                                  alt={media.title || 'Game media'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  }}
                                />
                              </div>
                            )}
                            <div className="p-4">
                              <h4 className="font-medium text-foreground">{media.title || 'Untitled'}</h4>
                              <p className="text-sm text-muted-foreground capitalize">{media.type}</p>
                              {media.localPath && (
                                <p className="text-xs text-gray-500 mt-1 truncate">{media.localPath}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Roblox Images (if available) */}
                {game.robloxInfo?.images && game.robloxInfo.images.length > 0 && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-lg mb-2">Roblox Images</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Images fetched from Roblox API
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {game.robloxInfo.images.map((image: any, index: number) => (
                          <div key={image.id || index} className="group rounded-lg border overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
                            <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                              <img
                                src={image.url}
                                alt={image.title || 'Roblox image'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                            </div>
                            <div className="p-4">
                              <h4 className="font-medium text-sm text-gray-900">{image.title || `Image ${index + 1}`}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {image.type} • {image.state}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No Media Message */}
                {(!game.media || game.media.length === 0) && 
                 (!game.robloxInfo?.images || game.robloxInfo.images.length === 0) && (
                  <div className="text-center py-8 border-t">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Media Files</h3>
                    <p className="text-muted-foreground mb-4">
                      No media files have been uploaded for this game yet.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Import Metrics</h3>
              <p className="text-sm text-muted-foreground">
                Import your game metrics from Roblox CSV files. Download these files from your Roblox Developer Dashboard.
              </p>
            </div>

            <MetricsImport gameId={params.gameId as string} />

            <div>
              <h3 className="text-lg font-medium">Metrics Overview</h3>
              <p className="text-sm text-muted-foreground">
                View your imported game metrics and analytics
              </p>
            </div>

            <MetricsOverview gameId={params.gameId as string} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 