'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGameOwnerAuth } from '@/components/game-owner/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface GameData {
  id: string
  name: string
  description: string
  genre: string
  robloxLink: string
  thumbnail: string
  metrics: {
    dau: number
    mau: number
    day1Retention: number
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/game-owner/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && params.id) {
      fetchGame()
    }
  }, [user, params.id])

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/game-owner/games/${params.id}`)
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!game) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/game-owner/games/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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

  const handleInputChange = (field: keyof GameData, value: string) => {
    if (!game) return
    setGame({ ...game, [field]: value })
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (error && !game) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Link href="/game-owner">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/game-owner" 
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Manage Game</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Game Information</CardTitle>
            <CardDescription>
              Update your game details and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {game && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Game Name *</Label>
                  <Input
                    id="name"
                    value={game.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={game.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
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
                  <Label htmlFor="robloxLink">Roblox Game URL</Label>
                  <Input
                    id="robloxLink"
                    type="url"
                    value={game.robloxLink}
                    onChange={(e) => handleInputChange('robloxLink', e.target.value)}
                    placeholder="https://www.roblox.com/games/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    type="url"
                    value={game.thumbnail}
                    onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 