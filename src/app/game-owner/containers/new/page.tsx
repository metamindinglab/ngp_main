'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useGameOwnerAuth } from '@/components/game-owner/auth/auth-context'
import { ArrowLeft, Plus } from 'lucide-react'
import { Game } from '@/types/game'

export default function NewContainerPage() {
  const router = useRouter()
  const { user, isLoading } = useGameOwnerAuth()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    gameId: '',
    name: '',
    description: '',
    type: '' as 'DISPLAY' | 'NPC' | 'MINIGAME' | '',
    position: {
      x: 0,
      y: 10,
      z: 0
    }
  })
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/game-owner/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch('/api/game-owner/games', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setGames(data.games)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch games',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch games',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.gameId || !formData.name || !formData.type) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch('/api/game-owner/containers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Container created successfully!',
        })
        router.push('/game-owner')
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create container',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create container',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/game-owner')}
            className="flex items-center text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Container</h1>
            <p className="text-sm text-gray-600">Add a new ad container to your game</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Container Details
            </CardTitle>
            <CardDescription>
              Configure your new ad container with the details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Game Selection */}
              <div className="space-y-2">
                <Label htmlFor="gameId" className="text-sm font-medium">
                  Game <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gameId}
                  onValueChange={(value) => setFormData({ ...formData, gameId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Container Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Container Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Plaza Display"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this container"
                  rows={3}
                />
              </div>

              {/* Container Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Container Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'DISPLAY' | 'NPC' | 'MINIGAME') =>
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select container type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISPLAY">
                      <div>
                        <div className="font-medium">Display</div>
                        <div className="text-sm text-gray-500">Billboard/screen advertisements</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="NPC">
                      <div>
                        <div className="font-medium">NPC</div>
                        <div className="text-sm text-gray-500">Interactive character ads</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="MINIGAME">
                      <div>
                        <div className="font-medium">Mini Game</div>
                        <div className="text-sm text-gray-500">Interactive game experiences</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Position */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Position (these are fallback coordinates - smart positioning will be used when possible)
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="x" className="text-xs text-gray-500">X</Label>
                    <Input
                      id="x"
                      type="number"
                      value={formData.position.x}
                      onChange={(e) => setFormData({
                        ...formData,
                        position: { ...formData.position, x: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="y" className="text-xs text-gray-500">Y</Label>
                    <Input
                      id="y"
                      type="number"
                      value={formData.position.y}
                      onChange={(e) => setFormData({
                        ...formData,
                        position: { ...formData.position, y: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="z" className="text-xs text-gray-500">Z</Label>
                    <Input
                      id="z"
                      type="number"
                      value={formData.position.z}
                      onChange={(e) => setFormData({
                        ...formData,
                        position: { ...formData.position, z: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  The download script will automatically position containers relative to spawn locations when possible.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/game-owner')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Container
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 