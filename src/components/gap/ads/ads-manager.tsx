'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
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
  Loader2,
  Monitor, // Added for Display Ad template
  Users, // Added for Game KOL Ad template
  Gamepad // Added for Mini-Game Ad template
} from 'lucide-react'
import { AssetSelector } from './asset-selector'

interface GameAd {
  id: string
  name: string
  description?: string
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
  const [showTemplateDialog, setShowTemplateDialog] = useState(false) // New template selection dialog
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null) // Track selected template
  const [selectedAssets, setSelectedAssets] = useState<Record<string, any>>({}) // New state for selected assets
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAd, setSelectedAd] = useState<GameAd | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingAd, setEditingAd] = useState<GameAd | null>(null)
  const [newAd, setNewAd] = useState({
    name: '',
    type: selectedTemplate || 'display',
    description: ''
  })
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  })
  const [editAssets, setEditAssets] = useState<Record<string, any>>({}) // Assets for editing
  const [editTemplate, setEditTemplate] = useState<string | null>(null) // Template for editing
  const { toast } = useToast()

  // Fetch available games for selection
  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games')
      if (!response.ok) {
        throw new Error('Failed to fetch games')
      }
      const data = await response.json()
      // Game selection is no longer needed for ad creation
    } catch (error) {
      console.error('Error fetching games:', error)
      // Game selection is no longer needed for ad creation
    }
  }

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
        const sorted = [...data.ads].sort((a: any, b: any) => {
          const da = new Date(a.createdAt).getTime()
          const db = new Date(b.createdAt).getTime()
          return db - da
        })
        setAds(sorted)
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

  // Load ads and games on component mount and when filters change
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
    if (!newAd.name || !selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields and select assets.',
        variant: 'destructive'
      })
      return
    }

    // Validate that at least one game is selected
    // Game selection is no longer required for ad creation

    // Validate assets based on template
    const isValidAssets = validateAssetSelection()
    if (!isValidAssets) {
      toast({
        title: 'Error',
        description: 'Please select all required assets for your chosen template.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsCreating(true)
      
      // Convert selected assets to the format expected by the API
      const assetsArray = Object.entries(selectedAssets)
        .filter(([key, asset]) => asset !== null)
        .map(([assetType, asset]) => {
          // Get the Roblox asset ID with proper validation
          let robloxAssetId = asset.robloxAssetId || asset.robloxId
          
          // Validate that we have a proper Roblox asset ID
          if (!robloxAssetId || robloxAssetId === asset.id) {
            console.warn(`Asset ${asset.id} (${asset.name}) missing valid Roblox asset ID. Using internal ID as fallback.`)
            robloxAssetId = asset.id // Fallback to internal ID if no Roblox ID available
          }
          
          return {
            assetType: getDatabaseAssetType(assetType),  // Convert UI type to database type
            assetId: asset.id,
            robloxAssetId: robloxAssetId
          }
        })

      const response = await fetch('/api/gap/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newAd,
          type: getApiAdType(selectedTemplate),
          assets: assetsArray
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create ad')
      }

      const data = await response.json()
      if (data.success) {
        setAds([data.ad, ...ads])
        resetCreateForm()
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

  const validateEditAssetSelection = () => {
    if (!editTemplate) return false
    
    switch (editTemplate) {
      case 'display': {
        const hasImage = !!editAssets.image
        const hasVideo = !!editAssets.video
        // exactly one of image or video; audio optional
        return (hasImage !== hasVideo)
      }
      case 'kol':
        return editAssets.kol_character && 
               editAssets.clothing_top && 
               editAssets.clothing_bottom && 
               editAssets.shoes && 
               editAssets.animation
      case 'minigame':
        return editAssets.minigame
      default:
        return false
    }
  }

  const handleEditAd = async () => {
    if (!editingAd || !editForm.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      })
      return
    }

    if (!validateEditAssetSelection()) {
      toast({
        title: 'Error',
        description: 'Please select all required assets for this ad type.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsEditing(true)
      
      // Prepare assets array for API (use database format)
      const assetsArray = Object.entries(editAssets)
        .filter(([_, asset]) => asset && asset.id)
        .map(([type, asset]) => {
          // Get the Roblox asset ID with proper validation
          let robloxAssetId = asset.robloxAssetId || asset.robloxId
          
          // Validate that we have a proper Roblox asset ID
          if (!robloxAssetId || robloxAssetId === asset.id) {
            console.warn(`Asset ${asset.id} (${asset.name}) missing valid Roblox asset ID. Using internal ID as fallback.`)
            robloxAssetId = asset.id // Fallback to internal ID if no Roblox ID available
          }
          
          return {
            assetId: asset.id,  // Database uses 'assetId'
            assetType: getDatabaseAssetType(type),    // Convert UI type to database type
            robloxAssetId: robloxAssetId,
            displayProperties: {
              priority: getPriorityForAssetType(type),
              ...asset.displayProperties
            }
          }
        })

      const response = await fetch(`/api/gap/ads/${editingAd.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          type: getApiAdType(editTemplate!),
          assets: assetsArray
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update ad')
      }

      const data = await response.json()
      if (data.success) {
        // Update the ad in the list
        setAds(ads.map(ad => 
          ad.id === editingAd.id 
            ? { 
                ...ad, 
                name: editForm.name, 
                description: editForm.description || ad.description,
                type: getApiAdType(editTemplate!),
                assets: assetsArray
              }
            : ad
        ))
        resetEditForm()
        toast({
          title: 'Success',
          description: 'Ad updated successfully!',
        })
      } else {
        throw new Error(data.error || 'Failed to update ad')
      }
    } catch (error) {
      console.error('Error updating ad:', error)
      toast({
        title: 'Error',
        description: 'Failed to update ad. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsEditing(false)
    }
  }

  const getTemplateFromAdType = (adType: string) => {
    switch (adType) {
      case 'multimedia_display':
      case 'display': 
        return 'display'
      case 'dancing_npc':
      case 'kol':
        return 'kol'
      case 'minigame_ad':
      case 'minigame':
        return 'minigame'
      default:
        return 'display'
    }
  }

  // Map database asset types to UI template types
  const normalizeAssetType = (dbAssetType: string): string => {
    const typeMapping: Record<string, string> = {
      // Display Ad assets
      'multi_display': 'multiMediaSignage',
      'multiMediaSignage': 'multiMediaSignage',
      'image': 'image',
      'Image': 'image',
      'video': 'video',
      'Video': 'video',
      'audio': 'audio',
      'Audio': 'audio',
      
      // KOL Ad assets  
      'kol_character': 'kol_character',
      'clothing': 'clothing_top',
      'clothing_top': 'clothing_top',
      'clothing_bottom': 'clothing_bottom',
      'shoes': 'shoes',
      'hat': 'hat',
      'item': 'item',
      'animation': 'animation',
      
      // Minigame Ad assets
      'minigame': 'minigame'
    }
    
    return typeMapping[dbAssetType] || dbAssetType
  }

  // Convert UI asset types back to database format
  const getDatabaseAssetType = (uiAssetType: string): string => {
    // UI types should match database types, but ensure consistency
    const dbTypeMapping: Record<string, string> = {
      'multiMediaSignage': 'multiMediaSignage',
      'image': 'image',
      'video': 'video', 
      'audio': 'audio',
      'kol_character': 'kol_character',
      'clothing_top': 'clothing_top',
      'clothing_bottom': 'clothing_bottom', 
      'shoes': 'shoes',
      'hat': 'hat',
      'item': 'item',
      'animation': 'animation',
      'minigame': 'minigame'
    }
    
    return dbTypeMapping[uiAssetType] || uiAssetType
  }

  // Fetch asset details by ID to get actual names and metadata
  const fetchAssetDetails = async (assetIds: string[]): Promise<Record<string, any>> => {
    try {
      const response = await fetch('/api/assets')
      if (!response.ok) {
        throw new Error('Failed to fetch assets')
      }
      const data = await response.json()
      
      // Create a lookup map of asset ID to asset details
      const assetLookup: Record<string, any> = {}
      data.assets.forEach((asset: any) => {
        assetLookup[asset.id] = asset
      })
      
      return assetLookup
    } catch (error) {
      console.error('Error fetching asset details:', error)
      return {}
    }
  }

  const startEditAd = async (ad: GameAd) => {
    setEditingAd(ad)
    setEditForm({
      name: ad.name,
      description: ad.description || ''
    })
    
    // Determine template from ad type
    const template = getTemplateFromAdType(ad.type)
    setEditTemplate(template)
    
    // Define valid asset types for each template
    const templateAssetTypes: Record<string, string[]> = {
      display: ['multiMediaSignage', 'image', 'video', 'audio'],
      kol: ['kol_character', 'clothing_top', 'clothing_bottom', 'shoes', 'hat', 'item', 'animation', 'audio'],
      minigame: ['minigame', 'audio']
    }
    
    // Load existing assets into editAssets
    const loadedAssets: Record<string, any> = {}
    if (ad.assets && Array.isArray(ad.assets)) {
      // Get all asset IDs to fetch details
      const assetIds = ad.assets.map((asset: any) => asset.assetId || asset.id).filter(Boolean)
      const assetLookup = await fetchAssetDetails(assetIds)
      
      ad.assets.forEach((asset: any) => {
        // Handle both database format (assetType, assetId) and frontend format (type, id)
        const dbAssetType = asset.assetType || asset.type
        const assetId = asset.assetId || asset.id
        
        if (dbAssetType && assetId) {
          // Normalize the asset type to UI format
          const normalizedAssetType = normalizeAssetType(dbAssetType)
          
          // Only include assets that are valid for the current template
          const validTypes = templateAssetTypes[template] || []
          if (!validTypes.includes(normalizedAssetType)) {
            console.log(`Skipping asset ${assetId} with type ${normalizedAssetType} - not valid for ${template} template`)
            return
          }
          
          // Get asset details from lookup
          const assetDetails = assetLookup[assetId]
          const assetName = assetDetails?.name || asset.name || `Asset ${assetId}`
          
          // Ensure we have the correct Roblox asset ID
          const robloxAssetId = asset.robloxAssetId || asset.robloxId || assetDetails?.robloxAssetId
          
          loadedAssets[normalizedAssetType] = {
            id: assetId,
            name: assetName,  // Use actual asset name from database
            type: normalizedAssetType,
            robloxAssetId: robloxAssetId,
            robloxId: robloxAssetId, // For compatibility
            displayProperties: asset.displayProperties || {},
            // Include additional asset details for compatibility
            ...assetDetails
          }
        }
      })
    }
    setEditAssets(loadedAssets)
    
    setShowEditDialog(true)
  }

  const resetEditForm = () => {
    setEditForm({ name: '', description: '' })
    setEditingAd(null)
    setEditAssets({})
    setEditTemplate(null)
    setShowEditDialog(false)
  }

  const toggleAdStatus = async (ad: GameAd) => {
    const currentStatus = ad.status || 'draft'
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
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
      case 'broadcasting': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
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

  const resetCreateForm = () => {
    setNewAd({ name: '', type: 'display', description: '' })
    setSelectedAssets({})
    setShowCreateDialog(false)
    setShowTemplateDialog(false)
    setSelectedTemplate(null)
  }

  const validateAssetSelection = () => {
    if (!selectedTemplate) return false
    
    switch (selectedTemplate) {
      case 'display': {
        const hasImage = !!selectedAssets.image
        const hasVideo = !!selectedAssets.video
        // exactly one of image or video; audio optional
        return (hasImage !== hasVideo)
      }
      case 'kol':
        return selectedAssets.kol_character && 
               selectedAssets.clothing_top && 
               selectedAssets.clothing_bottom && 
               selectedAssets.shoes && 
               selectedAssets.animation
      case 'minigame':
        return selectedAssets.minigame
      default:
        return false
    }
  }

  const getApiAdType = (template: string) => {
    switch (template) {
      case 'display': return 'multimedia_display'
      case 'kol': return 'dancing_npc'
      case 'minigame': return 'minigame_ad'
      default: return 'display'
    }
  }

  const getPriorityForAssetType = (assetType: string) => {
    // Define priority order for different asset types
    const priorityMap: Record<string, number> = {
      multiMediaSignage: 1,
      image: 2,
      video: 2,
      kol_character: 1,
      clothing_top: 2,
      clothing_bottom: 3,
      shoes: 4,
      animation: 5,
      hat: 6,
      item: 7,
      audio: 8,
      minigame: 1
    }
    return priorityMap[assetType] || 10
  }

  // Calculate stats
  const totalAds = ads.length
  const activeAds = ads.filter(ad => (ad.status || 'draft') === 'active').length
  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0)
  const avgCTR = ads.length > 0 ? ads.reduce((sum, ad) => sum + (ad.ctr || 0), 0) / ads.length : 0

  const sortedAds = useMemo(() => {
    const arr = Array.isArray(ads) ? [...ads] : []
    return arr.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [ads])

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
        
        {/* Replace the old create dialog with template selection */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose Ad Template</DialogTitle>
              <DialogDescription>
                Select the type of advertisement you want to create
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              {/* Display Ad Template */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedTemplate === 'display' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedTemplate('display')}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Monitor className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Display Ad</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Digital billboards and screen displays for showcasing brand content
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Image OR Video (Choose One)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>Background Music (Optional)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Game KOL Ad Template */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedTemplate === 'kol' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedTemplate('kol')}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Game KOL Ad</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Interactive NPC characters for brand engagement and product showcase
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>NPC Character (Required)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Clothing Set (Required)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Animation (Required)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>Hat, Product, Music (Optional)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mini-Game Ad Template */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedTemplate === 'minigame' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedTemplate('minigame')}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Gamepad className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Mini-Game Ad</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Interactive gaming experiences for deep brand engagement
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Mini-Game Asset (Required)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Customizable Experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Engagement Tracking</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowTemplateDialog(false)
                setSelectedTemplate(null)
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedTemplate) {
                    setShowTemplateDialog(false)
                    setShowCreateDialog(true)
                  } else {
                    toast({
                      title: 'Please select a template',
                      description: 'Choose one of the ad templates to continue',
                      variant: 'destructive'
                    })
                  }
                }}
                disabled={!selectedTemplate}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Original create dialog - now for asset selection based on template */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) {
            setSelectedTemplate(null)
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Create {selectedTemplate === 'display' ? 'Display Ad' : selectedTemplate === 'kol' ? 'Game KOL Ad' : selectedTemplate === 'minigame' ? 'Mini-Game Ad' : 'New Ad'}
              </DialogTitle>
              <DialogDescription>
                Configure your advertisement assets and properties
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Ad Information */}
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

              {/* Asset Selection Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Select Assets</h3>
                {selectedTemplate && (
                  <AssetSelector
                    template={selectedTemplate as 'display' | 'kol' | 'minigame'}
                    selectedAssets={selectedAssets}
                    onAssetsChange={setSelectedAssets}
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetCreateForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAd} 
                disabled={isCreating || !validateAssetSelection()}
              >
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
            {sortedAds.map((ad) => (
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
                    <div className="text-sm font-medium">{(ad.impressions || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{(ad.clicks || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{(ad.ctr || 0).toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">CTR</div>
                  </div>
                  <Badge className={getStatusColor(ad.status || 'draft')}>
                    {ad.status || 'draft'}
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
                    <Button variant="outline" size="sm" onClick={() => startEditAd(ad)}>
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
                  <Button onClick={() => setShowTemplateDialog(true)}>
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

      {/* Edit Advertisement Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Advertisement</DialogTitle>
            <DialogDescription>
              Update the advertisement information and assets
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Ad Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter ad name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-type">Ad Type</Label>
                <div className="flex items-center space-x-2">
                  {editTemplate === 'display' && <Monitor className="h-4 w-4 text-blue-600" />}
                  {editTemplate === 'kol' && <Users className="h-4 w-4 text-green-600" />}
                  {editTemplate === 'minigame' && <Gamepad className="h-4 w-4 text-purple-600" />}
                  <span className="text-sm font-medium">
                    {editTemplate === 'display' && 'Display Ad'}
                    {editTemplate === 'kol' && 'Game KOL Ad'}
                    {editTemplate === 'minigame' && 'Mini-Game Ad'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter ad description"
                rows={3}
              />
            </div>

            {/* Asset Selection */}
            {editTemplate && (editTemplate === 'display' || editTemplate === 'kol' || editTemplate === 'minigame') && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Asset Selection</h3>
                  <AssetSelector
                    template={editTemplate as 'display' | 'kol' | 'minigame'}
                    selectedAssets={editAssets}
                    onAssetsChange={setEditAssets}
                  />
                </div>
              </div>
            )}

            {/* Validation Status */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                {validateEditAssetSelection() ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">All required assets selected</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-600">Please select all required assets</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={resetEditForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditAd} 
              disabled={isEditing || !editForm.name.trim() || !validateEditAssetSelection()}
            >
              {isEditing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Ad'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 