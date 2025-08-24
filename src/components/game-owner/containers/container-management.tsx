import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Settings, Trash, Download } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Game } from '@/types/game'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface Container {
  id: string
  name: string
  description: string | null
  type: string
  position: {
    x: number
    y: number
    z: number
  }
  status: string
  game: {
    id: string
    name: string
  }
  currentAd: {
    id: string
    name: string
    type: string
  } | null
}

interface ContainerFormData {
  gameId: string
  name: string
  description: string
  type: string
  position: {
    x: number
    y: number
    z: number
  }
}

interface ContainerManagementProps {
  games: Game[]
}

export function ContainerManagement({ games }: ContainerManagementProps) {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<ContainerFormData>({
    gameId: '',
    name: '',
    description: '',
    type: 'DISPLAY',
    position: {
      x: 0,
      y: 0,
      z: 0
    }
  })

  const { toast } = useToast()

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
      console.log('Container data:', data) // Debug log
      if (data.success) {
        setContainers(data.containers)
        console.log('Containers set:', data.containers) // Debug log
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch containers',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching containers:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch containers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch('/api/game-owner/containers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Container created successfully',
        })
        fetchContainers()
        // Reset form
        setFormData({
          gameId: '',
          name: '',
          description: '',
          type: 'DISPLAY',
          position: {
            x: 0,
            y: 0,
            z: 0
          }
        })
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Register New Ad Container</CardTitle>
          <CardDescription>
            Create a new container to display ads in your game
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="game">Game</Label>
              <Select
                value={formData.gameId}
                onValueChange={(value) =>
                  setFormData({ ...formData, gameId: value })
                }
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

            <div className="space-y-2">
              <Label htmlFor="name">Container Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter container name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select container type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISPLAY">Display Ad</SelectItem>
                  <SelectItem value="NPC">NPC Ad</SelectItem>
                  <SelectItem value="MINIGAME">Mini-game Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationX">X Location</Label>
                <Input
                  id="locationX"
                  type="number"
                  value={formData.position.x}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position: {
                        ...formData.position,
                        x: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationY">Y Location</Label>
                <Input
                  id="locationY"
                  type="number"
                  value={formData.position.y}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position: {
                        ...formData.position,
                        y: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationZ">Z Location</Label>
                <Input
                  id="locationZ"
                  type="number"
                  value={formData.position.z}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position: {
                        ...formData.position,
                        z: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                />
              </div>
            </div>

            <Button type="submit">Create Container</Button>
          </form>
        </CardContent>
      </Card>

      {/* Container List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Ad Containers</h2>
          <Button onClick={() => fetchContainers()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : containers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No containers found. Create one above to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {containers.map((container) => {
              console.log('Rendering container:', container) // Debug log
              const integrationCode = getIntegrationCode(container)
              console.log('Integration code:', integrationCode) // Debug log
              return (
                <div key={container.id} className="bg-white rounded-lg shadow p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{container.name}</h3>
                      <p className="text-sm text-gray-600">Game: {container.game.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={container.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {container.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Type</span>
                      <p className="text-sm text-gray-600">{container.type}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Position</span>
                      <p className="text-sm text-gray-600">{container.position.x}, {container.position.y}, {container.position.z}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Integration Code</Label>
                    <div className="relative">
                      <pre className="bg-gray-50 p-3 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                        {integrationCode}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyCode(integrationCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/game-owner/games/${container.game.id}/containers/${container.id}`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Link>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        // TODO: Implement remove functionality
                      }}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 