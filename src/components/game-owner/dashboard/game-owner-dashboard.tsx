'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGameOwnerAuth } from '@/components/game-owner/auth/auth-context'
import { Gamepad2, Users, TrendingUp, Key, Settings, LogOut, Eye, Copy, RefreshCw, ArrowLeft, ArrowDownToLine, Plus, Trash, LayoutTemplate, ChevronUp, ChevronDown, Download } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Game } from '@/types/game'
import { ContainerManagement } from '../containers/container-management'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GameManager } from '../games/game-manager'
import { AdBrowser } from '../ads/ad-browser'
import { IntegrationGuide } from '../integration/integration-guide'
import { useGameOwnerGames } from '@/hooks/use-game-owner-games'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/components/ui/use-toast'
import { Container } from '@/types/container'

interface GameWithDetails extends Game {
  serverApiKey: string | undefined
  serverApiKeyStatus: string
  enabledTemplates: string[]
  assignedAds?: Array<{
    id: string
    name: string
    templateType: string
    status: string
    createdAt: string
  }>
}

interface DashboardStats {
  totalGames: number
  activeApiKeys: number
  totalAssignedAds: number
}

export function GameOwnerDashboard() {
  const { user, logout, isLoading } = useGameOwnerAuth()
  const router = useRouter()
  const { games, loading: loadingGames, error } = useGameOwnerGames() as { games: GameWithDetails[], loading: boolean, error: any }
  const [selectedImage, setSelectedImage] = useState<{[key: string]: string}>({})
  const [containers, setContainers] = useState<Container[]>([])
  const [loadingContainers, setLoadingContainers] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalGames: 0,
    activeApiKeys: 0,
    totalAssignedAds: 0,
  })
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({})
  const [showIntegrationCode, setShowIntegrationCode] = useState<{[key: string]: boolean}>({})
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/game-owner/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    fetchContainers()
  }, [])

  const fetchContainers = async () => {
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch('/api/game-owner/containers', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setContainers(data.containers)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch containers',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch containers',
        variant: 'destructive',
      })
    } finally {
      setLoadingContainers(false)
    }
  }

  useEffect(() => {
    if (games) {
      setStats({
        totalGames: games.length,
        activeApiKeys: games.filter(game => game.serverApiKeyStatus === 'active').length,
        totalAssignedAds: games.reduce((total, game) => total + (game.assignedAds?.length || 0), 0)
      })
    }
  }, [games])

  const handleBackToMain = async () => {
    setShowLogoutDialog(true)
  }

  const handleConfirmLogout = async () => {
    try {
      await logout()
      setShowLogoutDialog(false)
      window.location.href = '/'
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    // You could add a toast notification here
  }

  const generateApiKey = async (gameId: string) => {
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.serverApiKey) {
        // Refresh the games data by re-fetching
        window.location.reload()
        toast({
          title: 'Success',
          description: 'API key generated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate API key',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error generating API key:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate API key',
        variant: 'destructive',
      })
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: 'Copied!',
      description: 'Integration code copied to clipboard',
    })
  }

  const handleDownloadContainer = async (containerId: string, containerName: string) => {
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch(`/api/game-owner/download/container/${containerId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to download container')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `MMLContainer_${containerName.replace(/[^a-zA-Z0-9]/g, '_')}.rbxmx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success!',
        description: `Container "${containerName}" downloaded successfully`,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download container',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadGame = async (gameId: string, gameName: string) => {
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch(`/api/game-owner/download/game/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to download game package')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `MMLNetwork_${gameName.replace(/[^a-zA-Z0-9]/g, '_')}.rbxm`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success!',
        description: `Game package for "${gameName}" downloaded successfully`,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download game package',
        variant: 'destructive',
      })
    }
  }

  const getIntegrationCode = (container: Container) => {
    const gameId = container.game.id
    const containerId = container.id
    const { x, y, z } = container.position

    return `-- Place this code in a Script under ServerScriptService
local MMLAds = game:GetService("MMLAds")

-- Initialize the ad container
local container = MMLAds:InitializeContainer({
    containerId = "${containerId}",
    gameId = "${gameId}",
    position = Vector3.new(${x}, ${y}, ${z})
})

-- Start displaying ads
container:Start()`
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
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Game Owner System?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to logout and leave the Game Owner system. Any unsaved changes will be lost. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout}>
              Logout and Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                onClick={handleBackToMain}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Back to Main Menu</span>
              </Button>
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
                onClick={handleBackToMain}
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

        {/* Tabs */}
        <Tabs defaultValue="games" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="containers">Ad Containers</TabsTrigger>
              <TabsTrigger value="integration">Integration Guide</TabsTrigger>
            </TabsList>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <TabsContent value="games" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Your Games</h2>
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
                            src={selectedImage[game.id] || game.thumbnail || (game.media && game.media[0]?.localPath) || '/placeholder.svg'}
                            alt={game.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Failed to load image:', selectedImage[game.id] || game.thumbnail || (game.media && game.media[0]?.localPath));
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
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
                            {((game.metrics?.day1Retention || 0) * 100).toFixed(1)}%
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
                                title="Toggle visibility"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyApiKey(game.serverApiKey!)}
                                title="Copy API key"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateApiKey(game.id)}
                                title="Regenerate API key"
                                className="text-orange-600 hover:text-orange-700"
                              >
                                <RefreshCw className="h-4 w-4" />
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
                        {game.robloxLink && game.robloxLink !== '#' && (
                          <Link 
                            href={game.robloxLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button 
                              variant="outline" 
                              size="sm"
                            >
                              View Game in Roblox
                            </Button>
                          </Link>
                        )}
                        <Link href={`/game-owner/games/${game.id}/manage`}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </Link>
                        {game.serverApiKey && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadGame(game.id, game.name)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Package
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="containers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Ad Containers</h2>
              <Button variant="default" onClick={() => router.push('/game-owner/containers/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Container
              </Button>
            </div>

            {loadingContainers ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-600">Loading containers...</p>
                </CardContent>
              </Card>
            ) : containers.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {containers.map(container => (
                  <Card key={container.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{container.name}</CardTitle>
                          <CardDescription className="mt-1">
                            Game: {container.game.name}
                          </CardDescription>
                        </div>
                        <Badge variant={container.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {container.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-gray-500">Type</div>
                            <div className="mt-1">{container.type}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Position (Auto-detected)</div>
                            <div className="mt-1 text-gray-600">
                              {container.position?.x !== undefined ? (
                                `${container.position.x}, ${container.position.y}, ${container.position.z}`
                              ) : (
                                <span className="text-amber-600 text-sm">
                                  Place container in game to detect position
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {container.currentAd && (
                          <div>
                            <div className="text-sm font-medium text-gray-500">Current Ad</div>
                            <div className="mt-1 flex items-center space-x-2">
                              <span>{container.currentAd.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {container.currentAd.type}
                              </Badge>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-500">Integration Code (Optional)</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowIntegrationCode(prev => ({
                                ...prev,
                                [container.id]: !prev[container.id]
                              }))}
                            >
                              {showIntegrationCode[container.id] ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Hide Code
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Show Code
                                </>
                              )}
                            </Button>
                          </div>
                          {showIntegrationCode[container.id] && (
                            <div className="relative">
                              <pre className="bg-gray-50 p-3 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                {getIntegrationCode(container)}
                              </pre>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => handleCopyCode(getIntegrationCode(container))}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/game-owner/games/${container.game.id}/containers/${container.id}`)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownloadContainer(container.id, container.name)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Container
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <LayoutTemplate className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No containers found</h3>
                  <p className="text-gray-600">
                    You haven't set up any ad containers yet. Create one to start displaying ads in your game.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <IntegrationGuide 
              gameApiKey={games.find(g => g.serverApiKey)?.serverApiKey}
              containers={containers.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                position: c.position
              }))}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 