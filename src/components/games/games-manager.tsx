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
}

export function GamesManager() {
  const [games, setGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('_all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

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
      }
    }
    loadGames()
  }, [])

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
      } catch (error) {
        console.error('Error deleting game:', error)
      }
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
              <div className="space-y-2">
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
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleEditGame(game)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteGame(game.id)}>
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

            // Return the saved game so the dialog can use it
            return savedGame
          } catch (error) {
            console.error('Error saving game:', error)
            throw error
          }
        }}
        initialData={selectedGame || undefined}
      />
    </div>
  )
} 