'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGameOwnerAuth } from '@/components/game-owner/auth/auth-context'
import { Gamepad2, Users, TrendingUp, Key, Settings, LogOut, Eye, Copy, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Game } from '@/types/game'

interface GameWithDetails extends Game {
  serverApiKey: string | undefined
  serverApiKeyStatus: string
  enabledTemplates: string[]
  assignedAds: Array<{
    id: string
    name: string
    templateType: string
    status: string
    createdAt: string
  }>
}

export function GameOwnerDashboard() {
  const { user, logout, isLoading } = useGameOwnerAuth()
  const router = useRouter()
  const [games, setGames] = useState<GameWithDetails[]>([])
  const [selectedImage, setSelectedImage] = useState<{[key: string]: string}>({})
  const [stats, setStats] = useState({
    totalGames: 0,
    activeApiKeys: 0,
    totalAssignedAds: 0
  })
  const [loadingGames, setLoadingGames] = useState(true)
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/game-owner/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchGames()
    }
  }, [user])

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/game-owner/games')
      const data = await response.json()

      if (data.success) {
        setGames(data.games || [])
        setStats(data.stats || { totalGames: 0, activeApiKeys: 0, totalAssignedAds: 0 })
      } else {
        console.error('Failed to fetch games:', data.error)
        setGames([])
        setStats({ totalGames: 0, activeApiKeys: 0, totalAssignedAds: 0 })
      }
    } catch (error) {
      console.error('Error fetching games:', error)
      setGames([])
      setStats({ totalGames: 0, activeApiKeys: 0, totalAssignedAds: 0 })
    } finally {
      setLoadingGames(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/game-owner/login')
  }

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    // You could add a toast notification here
  }

  const generateApiKey = async (gameId: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.serverApiKey) {
        // Refresh games to show new API key
        fetchGames()
      }
    } catch (error) {
      console.error('Error generating API key:', error)
    }
  }

  if (isLoading || loadingGames) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Back to Admin</span>
              </Link>
              <div className="flex items-center">
                <Gamepad2 className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Game Owner Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Gamepad2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGames}</div>
              <p className="text-xs text-gray-600">Games in your portfolio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
              <Key className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeApiKeys}</div>
              <p className="text-xs text-gray-600">Connected to MML Network</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Ads</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignedAds}</div>
              <p className="text-xs text-gray-600">Active ad campaigns</p>
            </CardContent>
          </Card>
        </div>

        {/* Games List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Your Games</h2>
            <Button variant="outline" onClick={fetchGames}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {games.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No games found</h3>
                <p className="text-gray-600">
                  It looks like you don't have any games registered in our system yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {games.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    {/* Game Images Gallery */}
                    <div className="relative mb-4">
                      {/* Main Image */}
                      <div className="aspect-video overflow-hidden rounded-lg">
                        <img
                          src={selectedImage[game.id] || game.thumbnail || (game.media && game.media[0]?.localPath) || '/games/default-game.png'}
                          alt={game.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load image:', selectedImage[game.id] || game.thumbnail || (game.media && game.media[0]?.localPath));
                            (e.target as HTMLImageElement).src = '/games/default-game.png';
                          }}
                        />
                      </div>
                      
                      {/* Additional Images Gallery */}
                      {game.media && game.media.length > 0 && (
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
                        <CardTitle className="text-lg">{game.name}</CardTitle>
                        <CardDescription className="mt-1">{game.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{game.genre}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Game Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {(game.metrics?.dau || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">DAU</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {(game.metrics?.mau || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">MAU</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-purple-600">
                          {game.metrics?.day1Retention || 0}%
                        </div>
                        <div className="text-xs text-gray-600">D1 Retention</div>
                      </div>
                    </div>

                    {/* API Key Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">API Access to MML Game Network</h4>
                        <Badge 
                          variant={game.serverApiKeyStatus === 'active' ? 'default' : 'secondary'}
                        >
                          {game.serverApiKeyStatus}
                        </Badge>
                      </div>
                      
                      {game.serverApiKey ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type={showApiKeys[game.id] ? 'text' : 'password'}
                              value={game.serverApiKey}
                              readOnly
                              className="flex-1 px-3 py-2 text-sm border rounded-md bg-gray-50"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowApiKeys(prev => ({
                                ...prev,
                                [game.id]: !prev[game.id]
                              }))}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyApiKey(game.serverApiKey!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateApiKey(game.id)}
                          className="w-full"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Generate API Key
                        </Button>
                      )}
                    </div>

                    {/* Enabled Templates */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-2">Enabled Ad Templates</h4>
                                             <div className="flex flex-wrap gap-2">
                         {(game.enabledTemplates || []).map((template) => (
                           <Badge key={template} variant="secondary" className="text-xs">
                             {template.replace(/_/g, ' ')}
                           </Badge>
                         ))}
                       </div>
                    </div>

                                         {/* Assigned Ads */}
                     {(game.assignedAds || []).length > 0 && (
                       <div className="border-t pt-4">
                         <h4 className="font-medium text-sm mb-2">
                           Assigned Ads ({(game.assignedAds || []).length})
                         </h4>
                         <div className="space-y-1">
                           {(game.assignedAds || []).slice(0, 3).map((ad) => (
                             <div key={ad.id} className="flex justify-between items-center text-sm">
                               <span className="text-gray-700">{ad.name}</span>
                               <Badge variant="outline" className="text-xs">
                                 {ad.templateType?.replace(/_/g, ' ') || 'Unknown'}
                               </Badge>
                             </div>
                           ))}
                           {(game.assignedAds || []).length > 3 && (
                             <div className="text-xs text-gray-500">
                               +{(game.assignedAds || []).length - 3} more ads
                             </div>
                           )}
                         </div>
                       </div>
                     )}

                    {/* Actions */}
                    <div className="border-t pt-4 flex space-x-2">
                      <Link 
                        href={game.robloxLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={game.robloxLink === '#' ? 'pointer-events-none opacity-50' : ''}
                      >
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={game.robloxLink === '#'}
                        >
                          View Game in Roblox
                        </Button>
                      </Link>
                      <Link href={`/game-owner/games/${game.id}/manage`}>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 