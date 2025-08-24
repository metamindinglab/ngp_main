'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { 
  Plus, 
  Search, 
  Eye, 
  Check,
  X,
  Monitor,
  Image as ImageIcon,
  Video,
  Music,
  User,
  Shirt,
  Crown,
  Package,
  Zap,
  Gamepad2
} from 'lucide-react'
import { RobloxAssetPreview } from './roblox-asset-preview'

interface Asset {
  id: string
  name: string
  type: string
  robloxId?: string
  robloxAssetId?: string // Add this field as it exists in the actual data
  metadata?: any
  status: string
  createdAt: string
  updatedAt: string
  assetType?: string // Added for consistency with existing code
}

interface TemplateAsset {
  type: string
  required: boolean
  selected?: Asset | null
  label: string
  description: string
  icon: any
  dbTypes: string[] // Add the dbTypes field to the interface
}

interface AssetSelectorProps {
  template: 'display' | 'kol' | 'minigame'
  onAssetsChange: (assets: Record<string, Asset | null>) => void
  selectedAssets: Record<string, Asset | null>
}

// Template configurations based on the requirements
const TEMPLATE_CONFIGS = {
  display: [
    {
      type: 'multiMediaSignage',
      required: true,
      label: 'Multimedia Signage',
      description: 'Digital display hardware (Required)',
      icon: Monitor,
      dbTypes: ['multi_display', 'multiMediaSignage'] // Map to actual database types
    },
    {
      type: 'image',
      required: false,
      label: 'Image Content',
      description: 'Choose Image OR Video (Required - Pick One)',
      icon: ImageIcon,
      dbTypes: ['image', 'Image'] // Map to actual database types
    },
    {
      type: 'video',
      required: false,
      label: 'Video Content', 
      description: 'Choose Image OR Video (Required - Pick One)',
      icon: Video,
      dbTypes: ['video', 'Video'] // Map to actual database types
    },
    {
      type: 'audio',
      required: false,
      label: 'Background Music',
      description: 'Optional background audio',
      icon: Music,
      dbTypes: ['audio', 'Audio'] // Map to actual database types
    }
  ],
  kol: [
    {
      type: 'kol_character',
      required: true,
      label: 'NPC Character',
      description: 'KOL character model (Required)',
      icon: User,
      dbTypes: ['kol_character', 'character'] // Map to actual database types
    },
    {
      type: 'hat',
      required: false,
      label: 'Hat',
      description: 'Character headwear (Optional)',
      icon: Crown,
      dbTypes: ['hat', 'Hat'] // Map to actual database types
    },
    {
      type: 'clothing_top',
      required: true,
      label: 'Top Clothing',
      description: 'Upper body clothing (Required)',
      icon: Shirt,
      dbTypes: ['clothing_top', 'clothing', 'Clothing'] // Map to actual database types
    },
    {
      type: 'clothing_bottom',
      required: true,
      label: 'Bottom Clothing',
      description: 'Lower body clothing (Required)',
      icon: Shirt,
      dbTypes: ['clothing_bottom', 'clothing', 'Clothing'] // Map to actual database types
    },
    {
      type: 'shoes',
      required: true,
      label: 'Shoes',
      description: 'Character footwear (Required)',
      icon: Package,
      dbTypes: ['shoes', 'Shoes'] // Map to actual database types
    },
    {
      type: 'item',
      required: false,
      label: 'Product',
      description: 'Promotional item/product (Optional)',
      icon: Package,
      dbTypes: ['item', 'Item'] // Map to actual database types
    },
    {
      type: 'animation',
      required: true,
      label: 'Animation',
      description: 'Character animation (Required)',
      icon: Zap,
      dbTypes: ['animation', 'Animation'] // Map to actual database types
    },
    {
      type: 'audio',
      required: false,
      label: 'Music',
      description: 'Background music (Optional)',
      icon: Music,
      dbTypes: ['audio', 'Audio'] // Map to actual database types
    }
  ],
  minigame: [
    {
      type: 'minigame',
      required: true,
      label: 'Mini-Game',
      description: 'Interactive game experience (Required)',
      icon: Gamepad2,
      dbTypes: ['minigame', 'Minigame'] // Map to actual database types
    }
  ]
}

export function AssetSelector({ template, onAssetsChange, selectedAssets }: AssetSelectorProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null)
  const [showAssetBrowser, setShowAssetBrowser] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const { toast } = useToast()

  const templateConfig = TEMPLATE_CONFIGS[template]

  // Fetch assets from API
  const fetchAssets = async (assetType?: string) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.append('search', searchTerm)
      
      const response = await fetch(`/api/assets?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch assets')
      
      const data = await response.json()
      
      // Filter assets by type if specified
      let filteredAssets = data.assets || []
      if (assetType) {
        const config = templateConfig.find(c => c.type === assetType)
        if (config && config.dbTypes) {
          filteredAssets = filteredAssets.filter((asset: Asset) => 
            config.dbTypes.includes(asset.type) || config.dbTypes.includes(asset.assetType || asset.type)
          )
        }
      }
      
      console.log(`Filtering for type: ${assetType}, found ${filteredAssets.length} assets`) // Debug log
      setAssets(filteredAssets)
    } catch (error) {
      console.error('Error fetching assets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load assets. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showAssetBrowser) {
      fetchAssets(selectedAssetType || undefined)
    }
  }, [showAssetBrowser, searchTerm, selectedAssetType])

  const handleAssetSelect = (asset: Asset) => {
    if (!selectedAssetType) return

    const newSelectedAssets = {
      ...selectedAssets,
      [selectedAssetType]: asset
    }

    // Special logic for Display template - can only select image OR video
    if (template === 'display') {
      if (selectedAssetType === 'image' && selectedAssets.video) {
        newSelectedAssets.video = null
      } else if (selectedAssetType === 'video' && selectedAssets.image) {
        newSelectedAssets.image = null
      }
    }

    onAssetsChange(newSelectedAssets)
    setShowAssetBrowser(false)
    setSelectedAssetType(null)
  }

  const handleAssetRemove = (assetType: string) => {
    const newSelectedAssets = {
      ...selectedAssets,
      [assetType]: null
    }
    onAssetsChange(newSelectedAssets)
  }

  const getAssetTypeIcon = (type: string) => {
    const config = templateConfig.find(c => c.type === type)
    if (!config) return Package
    return config.icon
  }

  const isValidSelection = () => {
    // Check all required assets are selected
    const requiredTypes = templateConfig.filter(c => c.required).map(c => c.type)
    
    // For display template, need multimedia signage + (image OR video)
    if (template === 'display') {
      const hasSignage = selectedAssets.multiMediaSignage
      const hasImageOrVideo = selectedAssets.image || selectedAssets.video
      return hasSignage && hasImageOrVideo
    }
    
    // For other templates, check all required types
    return requiredTypes.every(type => selectedAssets[type])
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templateConfig.map((config) => {
          const Icon = config.icon
          const isSelected = selectedAssets[config.type]
          const isRequired = config.required
          
          // For display template, show special validation for image/video choice
          let validationStatus = 'normal'
          if (template === 'display' && (config.type === 'image' || config.type === 'video')) {
            const hasImage = selectedAssets.image
            const hasVideo = selectedAssets.video
            if (hasImage && hasVideo) {
              validationStatus = 'error' // Should not happen due to logic above
            } else if (hasImage || hasVideo) {
              validationStatus = 'success'
            } else {
              validationStatus = 'warning' // Need to choose one
            }
          }

          return (
            <Card 
              key={config.type}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                isSelected 
                  ? 'border-green-500 bg-green-50' 
                  : isRequired 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-gray-200'
              }`}
              onClick={() => {
                setSelectedAssetType(config.type)
                setShowAssetBrowser(true)
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isSelected ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{config.label}</CardTitle>
                      <Badge variant={isRequired ? 'destructive' : 'secondary'} className="text-xs">
                        {isRequired ? 'Required' : 'Optional'}
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAssetRemove(config.type)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 mb-2">{config.description}</p>
                {isSelected ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {isSelected.name}
                    </span>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Select Asset
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Validation Messages */}
      {template === 'display' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Monitor className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Display Ad Requirements</h4>
              <p className="text-sm text-blue-700 mt-1">
                You must select a Multimedia Signage device AND either an Image OR Video content (not both).
              </p>
              <div className="mt-2 space-y-1 text-xs text-blue-600">
                <div className="flex items-center gap-2">
                  {selectedAssets.multiMediaSignage ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <X className="h-3 w-3 text-red-600" />
                  )}
                  <span>Multimedia Signage Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  {(selectedAssets.image || selectedAssets.video) && !(selectedAssets.image && selectedAssets.video) ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <X className="h-3 w-3 text-red-600" />
                  )}
                  <span>Image OR Video Selected (not both)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Browser Dialog */}
      <Dialog open={showAssetBrowser} onOpenChange={setShowAssetBrowser}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Select {templateConfig.find(c => c.type === selectedAssetType)?.label || 'Asset'}
            </DialogTitle>
            <DialogDescription>
              Choose an asset from your library or browse available options
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading assets...</p>
                  </div>
                ) : assets.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms.' : 'No assets available for this type.'}
                    </p>
                  </div>
                ) : (
                  assets.map((asset) => (
                    <Card 
                      key={asset.id}
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleAssetSelect(asset)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm truncate">{asset.name}</CardTitle>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Preview clicked for asset:', asset) // Debug log
                              setPreviewAsset(asset)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge variant="outline" className="text-xs">
                            {asset.type}
                          </Badge>
                          {(asset.robloxId || asset.robloxAssetId) && (
                            <div className="text-xs text-gray-500">
                              Roblox ID: {asset.robloxId || asset.robloxAssetId}
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="w-full">
                            Select Asset
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {isValidSelection() ? (
            <>
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                All required assets selected
              </span>
            </>
          ) : (
            <>
              <X className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">
                Missing required assets
              </span>
            </>
          )}
        </div>
        <Badge variant={isValidSelection() ? 'default' : 'destructive'}>
          {Object.values(selectedAssets).filter(Boolean).length} / {templateConfig.length} Selected
        </Badge>
      </div>

      {/* Asset Preview Dialog */}
      {previewAsset && (
        <RobloxAssetPreview
          asset={previewAsset}
          open={!!previewAsset}
          onClose={() => setPreviewAsset(null)}
        />
      )}
    </div>
  )
} 