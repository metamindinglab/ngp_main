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
import { Eye, EyeOff, Copy, Key, RefreshCw } from 'lucide-react'

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
  // Database fields for API key management
  apiKey?: string
  apiKeyCreatedAt?: string
  apiKeyStatus?: string
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

  const handleGenerateApiKey = async (gameId: string) => {
    setGeneratingApiKey(gameId)
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate API key')
      }
      
      const updatedGame = await response.json()
      
      // Update the games list with the new API key
      setGames(games.map(game => 
        game.id === gameId ? { ...game, ...updatedGame } : game
      ))
      
      toast({
        title: "Success",
        description: "API key generated successfully",
      })
    } catch (error) {
      console.error('Error generating API key:', error)
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive"
      })
    } finally {
      setGeneratingApiKey(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Success",
        description: "API key copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const toggleApiKeyVisibility = (gameId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }))
  }

  const getApiKeyStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>
      default:
        return <Badge variant="secondary">Not Generated</Badge>
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
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
            <CardContent>
              <div className="space-y-3">
                <Badge>{game.genre}</Badge>
                
                <div className="text-sm">
                  <div>DAU: {formatNumber(game.metrics.dau)}</div>
                  <div>MAU: {formatNumber(game.metrics.mau)}</div>
                  <div>Day 1 Retention: {game.metrics.day1Retention}%</div>
                </div>
                
                <div className="text-sm">
                  <div>Owner: {game.owner.name}</div>
                  <div>Country: {game.owner.country}</div>
                </div>

                {/* API Key Management Section */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      <span className="text-sm font-medium">API Access</span>
                    </div>
                    {getApiKeyStatusBadge(game.apiKeyStatus)}
                  </div>
                  
                  {game.apiKey ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Input
                            type={showApiKeys[game.id] ? "text" : "password"}
                            value={game.apiKey}
                            readOnly
                            className="text-xs font-mono pr-16"
                          />
                          <div className="absolute right-1 top-1 flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleApiKeyVisibility(game.id)}
                            >
                              {showApiKeys[game.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(game.apiKey!)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {game.apiKeyCreatedAt && (
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(game.apiKeyCreatedAt).toLocaleDateString()}
                        </div>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleGenerateApiKey(game.id)}
                        disabled={generatingApiKey === game.id}
                      >
                        {generatingApiKey === game.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Regenerate Key
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleGenerateApiKey(game.id)}
                      disabled={generatingApiKey === game.id}
                    >
                      {generatingApiKey === game.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Key className="w-3 h-3 mr-1" />
                          Generate API Key
                        </>
                      )}
                    </Button>
                  )}
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