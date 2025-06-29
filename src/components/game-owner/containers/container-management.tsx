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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Game } from '@/types/game'

interface ContainerFormData {
  gameId: string
  name: string
  description: string
  type: string
  locationX: number
  locationY: number
  locationZ: number
}

interface Container {
  id: string
  name: string
  description: string | null
  type: string
  locationX: number
  locationY: number
  locationZ: number
  status: string
  game: {
    id: string
    name: string
  }
  currentAd: {
    id: string
    name: string
    type: string
    status: string
  } | null
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
    locationX: 0,
    locationY: 0,
    locationZ: 0,
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchContainers()
  }, [])

  const fetchContainers = async () => {
    try {
      const response = await fetch('/api/game-owner/containers')
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
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/game-owner/containers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          locationX: 0,
          locationY: 0,
          locationZ: 0,
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
    switch (container.type) {
      case 'DISPLAY':
        return `local adContainer = game:GetService("MMLAds"):GetContainer("${container.id}")
adContainer:DisplayAd()`
      case 'NPC':
        return `local npcAd = game:GetService("MMLAds"):GetNPCAd("${container.id}")
npcAd:Spawn(Vector3.new(${container.locationX}, ${container.locationY}, ${container.locationZ}))`
      case 'MINIGAME':
        return `local miniGameAd = game:GetService("MMLAds"):GetMiniGame("${container.id}")
miniGameAd:Initialize()`
      default:
        return ''
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
                  value={formData.locationX}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      locationX: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationY">Y Location</Label>
                <Input
                  id="locationY"
                  type="number"
                  value={formData.locationY}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      locationY: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationZ">Z Location</Label>
                <Input
                  id="locationZ"
                  type="number"
                  value={formData.locationZ}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      locationZ: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <Button type="submit">Create Container</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ad Containers</CardTitle>
          <CardDescription>
            Manage your registered ad containers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading containers...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Ad</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Integration Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.map((container) => (
                  <TableRow key={container.id}>
                    <TableCell className="font-medium">
                      {container.name}
                      {container.description && (
                        <div className="text-sm text-gray-500">
                          {container.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{container.game.name}</TableCell>
                    <TableCell>{container.type}</TableCell>
                    <TableCell>
                      X: {container.locationX}
                      <br />
                      Y: {container.locationY}
                      <br />
                      Z: {container.locationZ}
                    </TableCell>
                    <TableCell>
                      {container.currentAd ? (
                        <>
                          {container.currentAd.name}
                          <div className="text-sm text-gray-500">
                            {container.currentAd.type} -{' '}
                            {container.currentAd.status}
                          </div>
                        </>
                      ) : (
                        'No ad assigned'
                      )}
                    </TableCell>
                    <TableCell>{container.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            getIntegrationCode(container)
                          )
                          toast({
                            title: 'Copied!',
                            description: 'Integration code copied to clipboard',
                          })
                        }}
                      >
                        Copy Code
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 