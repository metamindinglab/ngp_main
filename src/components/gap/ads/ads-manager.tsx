'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, DialogFooter, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Play, 
  Pause,
  MoreHorizontal,
  Target,
  Calendar,
  TrendingUp,
  Loader2
} from 'lucide-react'

interface GameAd {
  id: string
  name: string
  type: 'display' | 'video' | 'interactive' | 'multimedia_display' | 'dancing_npc' | 'minigame_ad'
  status: 'active' | 'paused' | 'draft'
  impressions: number
  clicks: number
  ctr: number
  createdAt: string
  updatedAt: string
  games?: Array<{
    id: string
    name: string
    thumbnail: string | null
  }>
  assets?: any[]
}

export function GAPAdsManager() {
  const [ads, setAds] = useState<GameAd[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAd, setSelectedAd] = useState<GameAd | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newAd, setNewAd] = useState({
    name: '',
    type: 'display' as const,
    description: ''
  })
  const { toast } = useToast()

  // Fetch ads from API
  const fetchAds = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.append('search', searchTerm)
      if (statusFilter !== 'all') queryParams.append('status', statusFilter)
      if (typeFilter !== 'all') queryParams.append('type', typeFilter)

      const response = await fetch(`/api/gap/ads?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch ads')
      }

      const data = await response.json()
      if (data.success) {
        setAds(data.ads)
      } else {
        throw new Error(data.error || 'Failed to fetch ads')
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
      toast({
        title: 'Error',
        description: 'Failed to load ads. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load ads on component mount and when filters change
  useEffect(() => {
    fetchAds()
  }, [searchTerm, statusFilter, typeFilter])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchAds()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleCreateAd = async () => {
    if (!newAd.name || !newAd.type) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch('/api/gap/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAd),
      })

      if (!response.ok) {
        throw new Error('Failed to create ad')
      }

      const data = await response.json()
      if (data.success) {
        setAds([data.ad, ...ads])
        setNewAd({ name: '', type: 'display', description: '' })
        setShowCreateDialog(false)
        toast({
          title: 'Success',
          description: 'Ad created successfully!',
        })
      } else {
        throw new Error(data.error || 'Failed to create ad')
      }
    } catch (error) {
      console.error('Error creating ad:', error)
      toast({
        title: 'Error',
        description: 'Failed to create ad. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteAd = async () => {
    if (!selectedAd) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/gap/ads/${selectedAd.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete ad')
      }

      const data = await response.json()
      if (data.success) {
        setAds(ads.filter(ad => ad.id !== selectedAd.id))
        setSelectedAd(null)
        setShowDeleteDialog(false)
        toast({
          title: 'Success',
          description: 'Ad deleted successfully!',
        })
      } else {
        throw new Error(data.error || 'Failed to delete ad')
      }
    } catch (error) {
      console.error('Error deleting ad:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete ad. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleAdStatus = async (ad: GameAd) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active'
    
    try {
      const response = await fetch(`/api/gap/ads/${ad.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update ad status')
      }

      const data = await response.json()
      if (data.success) {
        setAds(ads.map(a => a.id === ad.id ? { ...a, status: newStatus } : a))
        toast({
          title: 'Success',
          description: `Ad ${newStatus === 'active' ? 'activated' : 'paused'} successfully!`,
        })
      } else {
        throw new Error(data.error || 'Failed to update ad status')
      }
    } catch (error) {
      console.error('Error updating ad status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update ad status. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'display':
      case 'multimedia_display':
        return <Target className="h-4 w-4" />
      case 'video':
      case 'dancing_npc':
        return <Play className="h-4 w-4" />
      case 'interactive':
      case 'minigame_ad':
        return <MoreHorizontal className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'multimedia_display': return 'Multimedia Display'
      case 'dancing_npc': return 'Dancing NPC'
      case 'minigame_ad': return 'Minigame Ad'
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  // Calculate stats
  const totalAds = ads.length
  const activeAds = ads.filter(ad => ad.status === 'active').length
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0)
  const avgCTR = ads.length > 0 ? ads.reduce((sum, ad) => sum + ad.ctr, 0) / ads.length : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading ads...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Game Ads Manager</h1>
          <p className="text-gray-600">Create, manage, and optimize your game advertisements</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Ad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Game Ad</DialogTitle>
              <DialogDescription>
                Create a new advertisement for your game marketing campaign.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Name *</Label>
                <Input
                  id="name"
                  value={newAd.name}
                  onChange={(e) => setNewAd({ ...newAd, name: e.target.value })}
                  placeholder="Enter ad name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Ad Type *</Label>
                <Select value={newAd.type} onValueChange={(value) => setNewAd({ ...newAd, type: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="display">Display Ad</SelectItem>
                    <SelectItem value="video">Video Ad</SelectItem>
                    <SelectItem value="interactive">Interactive Ad</SelectItem>
                    <SelectItem value="multimedia_display">Multimedia Display</SelectItem>
                    <SelectItem value="dancing_npc">Dancing NPC</SelectItem>
                    <SelectItem value="minigame_ad">Minigame Ad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  placeholder="Enter ad description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAd} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Ad'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCTR.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search ads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="display">Display</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="interactive">Interactive</SelectItem>
                <SelectItem value="multimedia_display">Multimedia Display</SelectItem>
                <SelectItem value="dancing_npc">Dancing NPC</SelectItem>
                <SelectItem value="minigame_ad">Minigame Ad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ads List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Game Ads</CardTitle>
          <CardDescription>
            Manage and monitor your game advertisement campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(ad.type)}
                    <div>
                      <h3 className="font-medium">{ad.name}</h3>
                      <p className="text-sm text-gray-500">{getTypeDisplayName(ad.type)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm font-medium">{ad.impressions.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{ad.clicks.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{ad.ctr.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">CTR</div>
                  </div>
                  <Badge className={getStatusColor(ad.status)}>
                    {ad.status}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdStatus(ad)}
                      disabled={ad.status === 'draft'}
                    >
                      {ad.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedAd(ad)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {ads.length === 0 && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ads found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Get started by creating your first game advertisement.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Ad
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAd?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAd} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 