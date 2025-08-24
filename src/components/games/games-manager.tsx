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
import { Eye, EyeOff, Copy, Key, RefreshCw, Cloud, Server, Plus, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Game, GameMedia } from '@/types/game'
import Link from 'next/link'
import { MMLLogo } from '@/components/ui/mml-logo'

// Add color constants
const COLORS = {
  primary: '#2563eb',    // Blue
  secondary: '#16a34a',  // Green
  accent: '#9333ea',     // Purple
  muted: '#64748b',      // Slate
};

export function GamesManager() {
  const [games, setGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({})
  const [generatingApiKey, setGeneratingApiKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{[key: string]: string}>({})
  const router = useRouter()
  const { toast } = useToast()

  // Load games data
  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoading(true)
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
      } finally {
        setIsLoading(false)
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
        game.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedGenre && selectedGenre !== 'all') {
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>
        <div className="mt-8 flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Link href="/" className="self-start transform hover:scale-105 transition-transform">
        <MMLLogo />
      </Link>

      <div className="mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Games Manager</h1>
          <Button 
            onClick={handleAddGame}
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Game
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map(genre => (
                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredGames.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No games found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game: Game) => (
              <Card 
                key={game.id} 
                className="hover:bg-accent/5 transition-all duration-300 border-l-4 transform hover:-translate-y-1 hover:shadow-lg"
                style={{ borderLeftColor: COLORS.primary }}
              >
                <CardHeader className="pb-3">
                  {/* Game Images Gallery */}
                  <div className="relative mb-4">
                    {/* Main Image */}
                    <div className="aspect-video overflow-hidden rounded-lg">
                      {game.thumbnail || (game.media && game.media.length > 0) ? (
                        <img
                          src={selectedImage[game.id] || game.thumbnail || (game.media && game.media[0]?.localPath) || '/placeholder.svg'}
                          alt={game.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">No thumbnail</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Additional Images Gallery */}
                    {game.media && game.media.length > 1 && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-2 overflow-x-auto bg-black/50 rounded-b-lg">
                        {game.media.map((media) => (
                          media.type === 'image' && (
                            <img
                              key={media.id}
                              src={media.localPath}
                              alt={media.title || 'Game image'}
                              className={`h-16 w-24 object-cover rounded cursor-pointer transition-all ${
                                selectedImage[game.id] === media.localPath ? 'ring-2 ring-white' : 'hover:opacity-80'
                              }`}
                              onClick={() => {
                                setSelectedImage(prev => ({
                                  ...prev,
                                  [game.id]: media.localPath
                                }))
                              }}
                            />
                          )
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold text-primary">{game.name}</CardTitle>
                      <CardDescription className="mt-1">{game.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{game.genre}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Owner Information */}
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Owner:</span>
                        <span className="font-medium text-foreground">{game.owner?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Country:</span>
                        <span className="font-medium text-foreground">{game.owner?.country || 'Unknown'}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    {game.metrics && (
                      <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
                        <div>
                          <div className="text-lg font-semibold text-blue-600">
                            {game.metrics.dau?.toLocaleString() || 0}
                          </div>
                          <div className="text-xs text-gray-600">DAU</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">
                            {game.metrics.mau?.toLocaleString() || 0}
                          </div>
                          <div className="text-xs text-gray-600">MAU</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-purple-600">
                            {game.metrics.day1Retention || 0}%
                          </div>
                          <div className="text-xs text-gray-600">D1 Retention</div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleEditGame(game)} 
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2"
                        onClick={() => router.push(`/dashboard/games/${game.id}`)}
                      >
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
          initialData={selectedGame || {
            id: '',
            name: '',
            description: '',
            genre: '',
            robloxLink: '',
            thumbnail: '',
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
              email: '',
              discordId: '',
              country: ''
            },
            robloxAuthorization: {
              type: 'api_key',
              status: 'unverified'
            },
            media: []
          }}
        />
      </div>
    </div>
  )
} 