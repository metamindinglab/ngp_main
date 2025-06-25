'use client'

import { useState, useEffect, useRef } from 'react'
import { Game } from '@/types/game'
import { getRobloxGameInfo, extractPlaceId } from '@/lib/roblox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Upload, X } from 'lucide-react'

interface GameDialogProps {
  open: boolean
  onClose: () => void
  onSave: (gameData: Game) => Promise<Game>
  initialData?: Game | null
}

const defaultGame: Game = {
  id: '',
  name: '',
  robloxLink: '',
  genre: '',
  description: '',
  metrics: {
    dau: 0,
    mau: 0,
    day1Retention: 0,
    topGeographicPlayers: []
  },
  dates: {
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    mgnJoined: new Date().toISOString()
  },
  owner: {
    name: '',
    discordId: '',
    email: '',
    country: ''
  },
  robloxAuthorization: {
    type: 'api_key',
    status: 'unverified'
  },
  thumbnail: ''
}

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  previewUrl: string;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function GameDialog({ open, onClose, onSave, initialData }: GameDialogProps) {
  const [formData, setFormData] = useState<Game>(defaultGame)
  const [showAuth, setShowAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchStatus, setFetchStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData(defaultGame)
    }
  }, [initialData])

  const handleInputChange = (field: keyof Game, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear fetch status when URL changes
    if (field === 'robloxLink') {
      setFetchStatus(null)
    }
  }

  const handleMetricsChange = (field: keyof Game['metrics'], value: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [field]: Number(value)
      }
    }))
  }

  const handleOwnerChange = (field: keyof Game['owner'], value: string) => {
    setFormData(prev => ({
      ...prev,
      owner: {
        ...prev.owner,
        [field]: value
      }
    }))
  }

  const handleAuthChange = (field: keyof NonNullable<Game['robloxAuthorization']>, value: string) => {
    setFormData(prev => ({
      ...prev,
      robloxAuthorization: {
        ...prev.robloxAuthorization!,
        [field]: value,
        status: 'unverified'
      }
    }))
  }

  const handleFetchGameInfo = async () => {
    if (!formData.robloxLink) {
      setFetchStatus('Please enter a Roblox game URL first')
      return
    }

    if (!formData.robloxAuthorization?.apiKey && !formData.robloxAuthorization?.clientId) {
      setFetchStatus('Please provide authorization credentials first')
      return
    }

    try {
      setIsLoading(true)
      setFetchStatus('Fetching game information...')

      const placeId = extractPlaceId(formData.robloxLink)
      if (!placeId) {
        setFetchStatus('Invalid Roblox game URL')
        return
      }

      const gameInfo = await getRobloxGameInfo(placeId.toString())
      
      const defaultGameSettings = {
        maxPlayers: 0,
        allowCopying: false,
        allowedGearTypes: [],
        universeAvatarType: 'MorphToR6',
        genre: 'All',
        isAllGenres: false,
        isFavoritedByUser: false,
        price: null
      }

      setFormData(prev => ({
        ...prev,
        name: gameInfo.name || prev.name,
        description: gameInfo.description || prev.description,
        genre: gameInfo.genre || prev.genre,
        robloxLink: gameInfo.robloxLink || prev.robloxLink,
        robloxInfo: {
          ...prev.robloxInfo,
          ...gameInfo.robloxInfo,
          placeId: gameInfo.robloxInfo?.placeId || placeId,
          universeId: gameInfo.robloxInfo?.universeId,
          creator: gameInfo.robloxInfo?.creator || {
            id: 0,
            type: 'User',
            name: 'Unknown'
          },
          stats: gameInfo.robloxInfo?.stats || {
            playing: 0,
            visits: 0,
            favorites: 0,
            likes: 0,
            dislikes: 0
          },
          gameSettings: gameInfo.robloxInfo?.gameSettings || defaultGameSettings,
          servers: gameInfo.robloxInfo?.servers || [],
          media: gameInfo.robloxInfo?.media || { images: [], videos: [] }
        },
        dates: {
          ...prev.dates,
          ...gameInfo.dates
        }
      }))

      setFetchStatus('Successfully fetched game information')
      // Auto-close the auth window after successful fetch
      setShowAuth(false)
    } catch (error) {
      console.error('Error fetching game info:', error)
      setFetchStatus(error instanceof Error ? error.message : 'Failed to fetch game information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (isImage || isVideo) {
        const mediaFile: MediaFile = {
          id: Math.random().toString(36).substring(7),
          file,
          type: isImage ? 'image' : 'video',
          previewUrl: URL.createObjectURL(file),
          uploadStatus: 'pending'
        };
        
        setMediaFiles(prev => [...prev, mediaFile]);
      }
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadFiles = async () => {
    // Always use the game ID (game_XXX format)
    const gameId = formData.id;
    if (!gameId || !gameId.startsWith('game_')) {
      console.error('Invalid game ID format:', gameId);
      return;
    }

    const uploadPromises = mediaFiles
      .filter(file => file.uploadStatus === 'pending')
      .map(async (mediaFile) => {
        try {
          setMediaFiles(prev => 
            prev.map(f => f.id === mediaFile.id ? { ...f, uploadStatus: 'uploading' } : f)
          );

          const formData = new FormData();
          formData.append('file', mediaFile.file);
          formData.append('type', mediaFile.type);
          formData.append('gameId', gameId);

          console.log('Uploading file for game:', gameId);
          const response = await fetch('/api/upload-media', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
          }

          const data = await response.json();
          console.log('Upload successful:', data);
          
          setMediaFiles(prev => 
            prev.map(f => f.id === mediaFile.id ? { ...f, uploadStatus: 'success' } : f)
          );

          // Update the formData with the new media info
          setFormData(prev => {
            const updatedGame = { ...prev };
            if (!updatedGame.robloxInfo) {
              updatedGame.robloxInfo = {
                placeId: Number(updatedGame.robloxLink.split('/').pop()) || 0,
                creator: {
                  id: 0,
                  type: 'User',
                  name: 'Unknown'
                },
                stats: {
                  playing: 0,
                  visits: 0,
                  favorites: 0,
                  likes: 0,
                  dislikes: 0
                },
                gameSettings: {
                  maxPlayers: 0,
                  allowCopying: false,
                  allowedGearTypes: [],
                  universeAvatarType: 'MorphToR6',
                  genre: 'All',
                  isAllGenres: false,
                  isFavoritedByUser: false,
                  price: null
                },
                servers: [],
                media: {
                  images: [],
                  videos: []
                }
              };
            }

            if (!updatedGame.robloxInfo.media) {
              updatedGame.robloxInfo.media = {
                images: [],
                videos: []
              };
            }

            if (mediaFile.type === 'image') {
              updatedGame.robloxInfo.media.images.push(data.file);
            } else {
              updatedGame.robloxInfo.media.videos.push(data.file);
            }

            return updatedGame;
          });

          return data;
        } catch (error) {
          console.error('Upload error:', error);
          setMediaFiles(prev => 
            prev.map(f => f.id === mediaFile.id ? { 
              ...f, 
              uploadStatus: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            } : f)
          );
          throw error;
        }
      });

    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Some uploads failed:', error);
    }
  };

  const removeFile = (id: string) => {
    setMediaFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={() => {
      // Reset form data when closing
      setFormData(initialData || defaultGame)
      setShowAuth(false)
      setFetchStatus(null)
      onClose()
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Game' : 'Add New Game'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Edit the game information below. You can update basic details, metrics, and owner information.'
              : 'Enter the game information below. You can fetch details automatically using the Roblox API or enter them manually.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="roblox">Roblox Data</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="owner">Owner Info</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="robloxLink">Roblox Game URL</Label>
              <div className="flex gap-2">
                <Input
                  id="robloxLink"
                  value={formData.robloxLink}
                  onChange={(e) => handleInputChange('robloxLink', e.target.value)}
                  placeholder="https://www.roblox.com/games/..."
                />
                <Button 
                  variant="outline" 
                  onClick={() => setShowAuth(!showAuth)}
                  className="min-w-[200px]"
                >
                  {showAuth ? 'Hide Authorization' : 'Show Authorization'}
                </Button>
              </div>
            </div>

            {showAuth && (
              <div className="space-y-4 border p-4 rounded-lg bg-muted/50">
                <div className="grid gap-2">
                  <Label htmlFor="authorizationType">Authorization Type</Label>
                  <Select
                    value={formData.robloxAuthorization?.type || 'api_key'}
                    onValueChange={(value) => handleAuthChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select authorization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="oauth">OAuth 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.robloxAuthorization?.type === 'api_key' ? (
                  <div className="grid gap-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Textarea
                      id="apiKey"
                      value={formData.robloxAuthorization?.apiKey || ''}
                      onChange={(e) => handleAuthChange('apiKey', e.target.value)}
                      placeholder="Enter your Roblox API key"
                      className="min-h-[100px] font-mono"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="clientId">Client ID</Label>
                      <Input
                        id="clientId"
                        type="password"
                        value={formData.robloxAuthorization?.clientId || ''}
                        onChange={(e) => handleAuthChange('clientId', e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="clientSecret">Client Secret</Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={formData.robloxAuthorization?.clientSecret || ''}
                        onChange={(e) => handleAuthChange('clientSecret', e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Button 
                  onClick={handleFetchGameInfo}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Fetching...' : 'Fetch Game Information'}
                </Button>

                {formData.robloxAuthorization?.status && (
                  <div className={`text-sm ${
                    formData.robloxAuthorization.status === 'active' ? 'text-green-600' :
                    formData.robloxAuthorization.status === 'invalid' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    Status: {formData.robloxAuthorization.status}
                    {formData.robloxAuthorization.lastVerified && ` (Last verified: ${new Date(formData.robloxAuthorization.lastVerified).toLocaleString()})`}
                  </div>
                )}
              </div>
            )}

            {fetchStatus && (
              <div className={`p-3 rounded-md ${
                fetchStatus.includes('successfully') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {fetchStatus}
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dau">Daily Active Users</Label>
                <Input
                  id="dau"
                  type="number"
                  value={formData.metrics.dau}
                  onChange={(e) => handleMetricsChange('dau', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mau">Monthly Active Users</Label>
                <Input
                  id="mau"
                  type="number"
                  value={formData.metrics.mau}
                  onChange={(e) => handleMetricsChange('mau', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="day1Retention">Day 1 Retention (%)</Label>
                <Input
                  id="day1Retention"
                  type="number"
                  value={formData.metrics.day1Retention}
                  onChange={(e) => handleMetricsChange('day1Retention', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roblox" className="space-y-4">
            {formData.robloxInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Place ID</Label>
                    <div className="mt-1 font-mono">{formData.robloxInfo.placeId}</div>
                  </div>
                  {formData.robloxInfo.universeId && (
                    <div>
                      <Label>Universe ID</Label>
                      <div className="mt-1 font-mono">{formData.robloxInfo.universeId}</div>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Creator</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div>{formData?.robloxInfo?.creator?.name || 'Unknown'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">ID</div>
                      <div>{formData?.robloxInfo?.creator?.id || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Type</div>
                      <div>{formData.robloxInfo.creator.type}</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Statistics</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Playing</div>
                      <div>{formData.robloxInfo.stats.playing.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Visits</div>
                      <div>{formData.robloxInfo.stats.visits.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Favorites</div>
                      <div>{formData.robloxInfo.stats.favorites.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {formData.robloxInfo.gameSettings && (
                  <div className="grid gap-2">
                    <Label>Game Settings</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Max Players</div>
                        <div>{formData.robloxInfo.gameSettings.maxPlayers}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Genre</div>
                        <div>{formData.robloxInfo.gameSettings.genre}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No Roblox data available. Use the authorization section to fetch game information.
              </div>
            )}
          </TabsContent>

          <TabsContent value="servers" className="space-y-4">
            {formData.robloxInfo?.servers && formData.robloxInfo.servers.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {formData.robloxInfo.servers.map((server, index) => (
                    <div key={server.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Server ID</div>
                          <div className="font-mono">{server.id}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Players</div>
                          <div>{server.playing} / {server.maxPlayers}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">FPS</div>
                          <div>{server.fps}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Ping</div>
                          <div>{server.ping}ms</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No server information available. Use the authorization section to fetch game information.
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Upload Media Files</Label>
                  <Button 
                    onClick={handleUploadFiles}
                    disabled={!mediaFiles.some(f => f.uploadStatus === 'pending')}
                  >
                    Upload Selected Files
                  </Button>
                </div>
                
                <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Images or Videos
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PNG, JPG, GIF, MP4, WebM
                  </p>
                </div>

                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mediaFiles.map((file) => (
                      <div key={file.id} className="border rounded-lg overflow-hidden relative">
                        {file.type === 'image' ? (
                          <img 
                            src={file.previewUrl} 
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <video 
                            src={file.previewUrl}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-3 space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="font-medium truncate">{file.file.name}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                          <div>
                            <Badge
                              variant={
                                file.uploadStatus === 'success' ? "default" :
                                file.uploadStatus === 'error' ? "destructive" :
                                file.uploadStatus === 'uploading' ? "secondary" :
                                "outline"
                              }
                            >
                              {file.uploadStatus === 'success' ? "Uploaded" :
                               file.uploadStatus === 'error' ? "Failed" :
                               file.uploadStatus === 'uploading' ? "Uploading..." :
                               "Pending"}
                            </Badge>
                          </div>
                          {file.error && (
                            <div className="text-sm text-red-500">{file.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.robloxInfo?.media && (
                <div className="space-y-4">
                  <Label>Uploaded Media</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formData.robloxInfo.media.images.map((image) => (
                      <div key={`${image.id}_${image.uploadedAt}`} className="border rounded-lg overflow-hidden">
                        <div className="relative">
                          <img 
                            src={image.localPath}
                            alt={image.title || 'Game image'} 
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              console.error('Failed to load image:', image.localPath);
                              e.currentTarget.src = '/placeholder-image.png';
                            }}
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                              variant={formData.thumbnail === image.localPath ? "default" : "secondary"}
                              size="sm"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  thumbnail: image.localPath
                                }));
                              }}
                            >
                              {formData.thumbnail === image.localPath ? "Current Thumbnail" : "Set as Thumbnail"}
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 space-y-1">
                          {image.title && (
                            <div className="font-medium">{image.title}</div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            Uploaded: {new Date(image.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.robloxInfo.media.videos.map((video) => (
                      <div key={`${video.id}_${video.uploadedAt}`} className="border rounded-lg overflow-hidden">
                        <video 
                          src={video.localPath}
                          className="w-full h-48 object-cover"
                          controls
                          onError={(e) => {
                            console.error('Failed to load video:', video.localPath);
                          }}
                        />
                        <div className="p-3 space-y-1">
                          <div className="font-medium">{video.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="owner" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={formData.owner.name}
                  onChange={(e) => handleOwnerChange('name', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="discordId">Discord ID</Label>
                <Input
                  id="discordId"
                  value={formData.owner.discordId}
                  onChange={(e) => handleOwnerChange('discordId', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.owner.email}
                  onChange={(e) => handleOwnerChange('email', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.owner.country}
                  onChange={(e) => handleOwnerChange('country', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={async () => {
              try {
                setIsLoading(true);
                // First save the game to get an ID if it's a new game
                const savedGame = await onSave(formData);
                
                // Update the form data with the saved game info
                setFormData(savedGame);
                
                // If there are pending media files, upload them using the saved game ID
                if (mediaFiles.some(f => f.uploadStatus === 'pending')) {
                  await handleUploadFiles();
                }

                // Close the dialog after everything is done
                onClose();
              } catch (error) {
                console.error('Error saving game or uploading media:', error);
              } finally {
                setIsLoading(false);
              }
            }} 
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 