'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GameDialog } from './game-dialog'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, Copy, Key, RefreshCw, Cloud, Server } from 'lucide-react'

interface Game {
  id: string
  name: string
  robloxLink: string
  genre: string
  description: string
  metrics: {
    dau: number
    mau: number
    day1Retention: number
    topGeographicPlayers: {
      country: string
      percentage: number
    }[]
  }
  dates: {
    created: string
    lastUpdated: string
    mgnJoined: string
  }
  thumbnail: string
  owner: {
    name: string
    discordId: string
    email: string
    country: string
  }
  // Roblox Cloud API authorization (stored in JSON field)
  robloxAuthorization?: {
    type: 'api_key' | 'oauth'
    apiKey?: string
    clientId?: string
    clientSecret?: string
    lastVerified?: string
    status: 'active' | 'expired' | 'invalid' | 'unverified'
  }
  // Server API key fields
  serverApiKey?: string
  serverApiKeyCreatedAt?: string
  serverApiKeyStatus?: string
}

export function GamesManager() {
  const [games, setGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('_all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({})
  const [generatingApiKey, setGeneratingApiKey] = useState<string | null>(null)
  const { toast } = useToast()

  // Load games data
  useEffect(() => {
    const loadGames = async () => {
      try {
        const response = await fetch('/api/games')
        const data = await response.json()
        setGames(data.games)
        setFilteredGames(data.games)
      } catch (error) {
        console.error('Error loading games:', error)
        toast({
          title: "Error",
          description: "Failed to load games",
          variant: "destructive"
        })
      }
    }
    loadGames()
  }, [toast])

  // Filter games based on search term and genre
  useEffect(() => {
    let filtered = games
    
    if (searchTerm) {
      filtered = filtered.filter(game => 
        game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedGenre && selectedGenre !== '_all') {
      filtered = filtered.filter(game => game.genre === selectedGenre)
    }
    
    setFilteredGames(filtered)
  }, [searchTerm, selectedGenre, games])

  // Get unique genres for filter
  const genres = Array.from(new Set(games.map(game => game.genre)))

  const handleAddGame = () => {
    setSelectedGame(null)
    setIsDialogOpen(true)
  }

  const handleEditGame = (game: Game) => {
    setSelectedGame(game)
    setIsDialogOpen(true)
  }

  const handleDeleteGame = async (gameId: string) => {
    if (confirm('Are you sure you want to delete this game?')) {
      try {
        await fetch(`/api/games/${gameId}`, { method: 'DELETE' })
        setGames(games.filter(game => game.id !== gameId))
        toast({
          title: "Success",
          description: "Game deleted successfully"
        })
      } catch (error) {
        console.error('Error deleting game:', error)
        toast({
          title: "Error",
          description: "Failed to delete game",
          variant: "destructive"
        })
      }
    }
  }

  // Removed old handleGenerateApiKey - now using generateServerApiKey

  const copyToClipboard = async (text: string, type?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to Clipboard",
        description: `${type || 'Text'} has been copied to your clipboard.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const toggleApiKeyVisibility = (gameId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }))
  }

  // Removed old getApiKeyStatusBadge - now using getServerApiKeyStatus

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const generateServerApiKey = async (gameId: string) => {
    try {
      setGeneratingApiKey(gameId)
      
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate server API key')
      }
      
      const data = await response.json()
      
      // Update the game in our local state
      setGames(prevGames => 
        prevGames.map(game => 
          game.id === gameId 
            ? { 
                ...game, 
                serverApiKey: data.serverApiKey,
                serverApiKeyCreatedAt: data.serverApiKeyCreatedAt,
                serverApiKeyStatus: data.serverApiKeyStatus
              }
            : game
        )
      )
      
      toast({
        title: "Server API Key Generated",
        description: "New server API key has been generated successfully.",
      })
      
    } catch (error) {
      console.error('Error generating server API key:', error)
      toast({
        title: "Error",
        description: "Failed to generate server API key. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingApiKey(null)
    }
  }

  const getServerApiKeyStatus = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      case 'revoked':
        return <Badge variant="secondary">Revoked</Badge>
      default:
        return <Badge variant="outline">Not Generated</Badge>
    }
  }

  const getRobloxAuthStatus = (auth?: Game['robloxAuthorization']) => {
    if (!auth || !auth.apiKey) {
      return <Badge variant="outline">Not Configured</Badge>
    }
    
    switch (auth.status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>
      case 'unverified':
        return <Badge variant="secondary">Unverified</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Games Manager</h1>
        <Button onClick={handleAddGame}>Add New Game</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Genres</SelectItem>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map(game => (
          <Card key={game.id} className="flex flex-col">
            <CardHeader>
              <div className="aspect-video relative mb-4">
                <img
                  src={game.thumbnail}
                  alt={game.name}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
              <CardTitle>{game.name}</CardTitle>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Game Information */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Genre:</strong> {game.genre}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {game.description}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Owner:</strong> {game.owner.name} ({game.owner.email})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Link:</strong>{' '}
                  <a
                    href={game.robloxLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View on Roblox
                  </a>
                </p>
              </div>

              {/* Roblox Cloud API Authorization */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cloud className="h-4 w-4 text-blue-500" />
                  <h4 className="font-semibold text-sm">Roblox Cloud API Authorization</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  API key for fetching game information FROM Roblox Cloud API
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    {getRobloxAuthStatus(game.robloxAuthorization)}
                  </div>
                  {game.robloxAuthorization?.apiKey && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Last verified: {game.robloxAuthorization.lastVerified ? new Date(game.robloxAuthorization.lastVerified).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Server API Access */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="h-4 w-4 text-green-500" />
                  <h4 className="font-semibold text-sm">Server API Access for MML Game Network</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  API key for your game to connect TO our server
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Status:</span>
                      {getServerApiKeyStatus(game.serverApiKeyStatus)}
                    </div>
                    {game.serverApiKeyCreatedAt && (
                      <span className="text-xs text-gray-500">
                        Created: {new Date(game.serverApiKeyCreatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {game.serverApiKey && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type={showApiKeys[game.id] ? 'text' : 'password'}
                          value={game.serverApiKey}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleApiKeyVisibility(game.id)}
                        >
                          {showApiKeys[game.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(game.serverApiKey!, 'Server API key')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateServerApiKey(game.id)}
                      disabled={generatingApiKey === game.id}
                      className="flex items-center gap-2"
                    >
                      {generatingApiKey === game.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      {game.serverApiKey ? 'Regenerate' : 'Generate'} Server API Key
                    </Button>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Metrics</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">DAU</p>
                    <p className="font-semibold">{game.metrics.dau.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">MAU</p>
                    <p className="font-semibold">{game.metrics.mau.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Day 1 Retention</p>
                    <p className="font-semibold">{game.metrics.day1Retention}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => handleEditGame(game)} className="flex-1">
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteGame(game.id)} className="flex-1">
                  Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <GameDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedGame(null)
        }}
        onSave={async (gameData) => {
          try {
            const method = selectedGame ? 'PUT' : 'POST'
            const url = selectedGame ? `/api/games/${selectedGame.id}` : '/api/games'
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...gameData,
                // Preserve the ID for updates
                id: selectedGame?.id || gameData.id
              })
            })

            if (!response.ok) {
              throw new Error(`Failed to save game: ${response.statusText}`)
            }
            
            const savedGame = await response.json()
            
            // Update the games list
            if (selectedGame) {
              setGames(games.map(g => g.id === selectedGame.id ? savedGame : g))
            } else {
              setGames([...games, savedGame])
            }

            toast({
              title: "Success",
              description: `Game ${selectedGame ? 'updated' : 'created'} successfully`
            })

            // Return the saved game so the dialog can use it
            return savedGame
          } catch (error) {
            console.error('Error saving game:', error)
            toast({
              title: "Error",
              description: "Failed to save game",
              variant: "destructive"
            })
            throw error
          }
        }}
        initialData={selectedGame || undefined}
      />
    </div>
  )
} 