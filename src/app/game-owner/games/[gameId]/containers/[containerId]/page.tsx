'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Container } from '@/types/container'
import { ArrowLeft, Save, Download } from 'lucide-react'
import Link from 'next/link'
import { useGameOwnerAuth } from '@/components/game-owner/auth/auth-context'

export default function ContainerConfigPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useGameOwnerAuth()
  const [container, setContainer] = useState<Container | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/game-owner/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    fetchContainer()
  }, [params.containerId])

  const fetchContainer = async () => {
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch(`/api/game-owner/containers/${params.containerId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setContainer(data.container)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch container',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch container',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!container) return

    setSaving(true)
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      const response = await fetch(`/api/game-owner/containers/${params.containerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          name: container.name,
          description: container.description,
          type: container.type,
          position: container.position,
          status: container.status
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Container updated successfully',
        })
        // Wait for the toast to be visible before navigating
        setTimeout(() => {
          router.back()
        }, 1000)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update container',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update container',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!container) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Container not found</h3>
            <p className="text-gray-600 mb-4">
              The container you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configure Container</h1>
              <p className="text-sm text-gray-600">Manage your ad container settings</p>
            </div>
          </div>
          <Badge variant={container.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {container.status}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the container's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Container Name</Label>
                <Input
                  id="name"
                  value={container.name}
                  onChange={(e) => setContainer({ ...container, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={container.description || ''}
                  onChange={(e) => setContainer({ ...container, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={container.type}
                  onValueChange={(value: 'DISPLAY' | 'NPC' | 'MINIGAME') =>
                    setContainer({ ...container, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISPLAY">Display</SelectItem>
                    <SelectItem value="NPC">NPC</SelectItem>
                    <SelectItem value="MINIGAME">Mini Game</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={container.status}
                  onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE') =>
                    setContainer({ ...container, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Position */}
          <Card>
            <CardHeader>
              <CardTitle>Position</CardTitle>
              <CardDescription>Set the container's position in the game world</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="x">X Position</Label>
                  <Input
                    id="x"
                    type="number"
                    value={container.position.x}
                    onChange={(e) =>
                      setContainer({
                        ...container,
                        position: { ...container.position, x: parseFloat(e.target.value) }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="y">Y Position</Label>
                  <Input
                    id="y"
                    type="number"
                    value={container.position.y}
                    onChange={(e) =>
                      setContainer({
                        ...container,
                        position: { ...container.position, y: parseFloat(e.target.value) }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="z">Z Position</Label>
                  <Input
                    id="z"
                    type="number"
                    value={container.position.z}
                    onChange={(e) =>
                      setContainer({
                        ...container,
                        position: { ...container.position, z: parseFloat(e.target.value) }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Ad */}
          {container.currentAd && (
            <Card>
              <CardHeader>
                <CardTitle>Current Ad</CardTitle>
                <CardDescription>Currently displayed advertisement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{container.currentAd.name}</p>
                    <p className="text-sm text-gray-600">{container.currentAd.type}</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Downloads */}
          <Card>
            <CardHeader>
              <CardTitle>Downloads</CardTitle>
              <CardDescription>Get this container as a plug-and-play model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full sm:w-auto" size="sm">
                <Link href={`/api/game-owner/download/container/${container.id}`} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download container (.rbxmx)
                </Link>
              </Button>
              <div className="text-xs text-gray-600">
                <span className="mr-1">Or static (no auth):</span>
                <Link
                  href={`/downloads/containers/MMLContainer_${container.type}.rbxmx`}
                  className="underline"
                  target="_blank"
                >
                  MMLContainer_{container.type}.rbxmx
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 