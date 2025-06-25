'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GameAd, GameAdTemplate, GAME_AD_TEMPLATES, GameAdTemplateType, Asset, AssetType, AssetData } from '@/types/gameAd'
import RobloxAssetPreview from '@/components/display-objects/roblox-asset-preview'

interface GameAdDialogProps {
  open: boolean
  onClose: () => void
  initialData: GameAd | null
  onSave: (data: GameAd) => Promise<void>
}

export function GameAdDialog({ open, onClose, initialData, onSave }: GameAdDialogProps) {
  const [formData, setFormData] = useState<Partial<GameAd>>({
    name: '',
    templateType: undefined,
    assets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const [selectedTemplate, setSelectedTemplate] = useState<GameAdTemplate | null>(null)
  const [availableAssets, setAvailableAssets] = useState<AssetData[]>([])
  const [selectedAssetDetails, setSelectedAssetDetails] = useState<Record<number, AssetData | null>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available assets
  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/assets')
        if (!response.ok) {
          throw new Error('Failed to load assets')
        }
        const data = await response.json()
        setAvailableAssets(data.assets)
      } catch (error) {
        console.error('Error loading assets:', error)
        setError('Failed to load assets. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    if (open) {
      loadAssets()
    }
  }, [open])

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      const template = GAME_AD_TEMPLATES.find(t => t.id === initialData.templateType)
      setSelectedTemplate(template || null)
      
      // Load selected asset details
      const details: Record<number, AssetData | null> = {}
      initialData.assets?.forEach((asset, index) => {
        const assetDetail = availableAssets.find(a => a.id === asset.assetId)
        if (assetDetail) {
          details[index] = assetDetail
        }
      })
      setSelectedAssetDetails(details)
    } else {
      setFormData({
        name: '',
        templateType: undefined,
        assets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setSelectedTemplate(null)
      setSelectedAssetDetails({})
    }
  }, [initialData, availableAssets])

  const handleTemplateChange = (templateId: GameAdTemplateType) => {
    const template = GAME_AD_TEMPLATES.find(t => t.id === templateId)
    setSelectedTemplate(template || null)
    
    // Initialize assets array with empty values for each required asset type
    const initializedAssets = template?.requiredAssetTypes.map(assetType => ({
      assetType,
      assetId: '',
      robloxAssetId: ''
    })) || []

    console.log('Initializing assets:', JSON.stringify(initializedAssets, null, 2))
    
    setFormData(prev => ({
      ...prev,
      templateType: templateId,
      assets: initializedAssets,
    }))
    setSelectedAssetDetails({})
  }

  const handleAssetChange = (index: number, assetId: string) => {
    const selectedAsset = availableAssets.find(asset => asset.id === assetId)
    console.log('Selected asset:', selectedAsset)
    
    if (!selectedAsset) {
      console.warn('No asset found for id:', assetId)
      return
    }

    // Update selected asset details
    setSelectedAssetDetails(prev => ({
      ...prev,
      [index]: selectedAsset,
    }))
    
    // Update form data assets
    setFormData(prev => {
      const newAssets = [...(prev.assets || [])]
      
      // Ensure all required fields are set
      newAssets[index] = {
        assetType: selectedAsset.assetType,
        assetId: selectedAsset.id,
        robloxAssetId: selectedAsset.robloxAssetId
      }
      
      // Log the updated array for debugging
      console.log('Updated assets array:', JSON.stringify(newAssets, null, 2))

      // Validate the updated array
      const hasInvalidAssets = newAssets.some(asset => 
        !asset || !asset.assetType || !asset.assetId || !asset.robloxAssetId
      )

      if (hasInvalidAssets) {
        console.warn('Invalid assets in array:', newAssets)
      }

      return { ...prev, assets: newAssets }
    })
  }

  const getAssetsByType = (assetType: AssetType) => {
    return availableAssets.filter(asset => asset.assetType === assetType)
  }

  const renderAssetPreview = (asset: AssetData | null, assetType: AssetType) => {
    if (!asset) return null

    return (
      <Card className="mt-2">
        <CardContent className="p-4">
          <RobloxAssetPreview
            assetId={asset.robloxAssetId}
            height="200px"
          />
          <div className="mt-2 text-sm">
            <p className="font-medium">{asset.name}</p>
            <p className="text-muted-foreground text-xs">{asset.description}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Add a function to validate assets
  const validateAssets = (assets: Asset[]) => {
    const invalidAssets = assets.filter(asset => {
      if (!asset.assetType || !asset.assetId) return true
      
      const selectedAsset = availableAssets.find(a => a.id === asset.assetId)
      return !selectedAsset?.robloxAssetId
    })

    return {
      isValid: invalidAssets.length === 0,
      invalidAssets
    }
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Please fill in the name field')
      return
    }

    // Add debug logging
    console.log('Submitting form data:', JSON.stringify(formData, null, 2))
    console.log('Selected asset details:', JSON.stringify(selectedAssetDetails, null, 2))
    
    const gameAdData = {
      ...formData,
      id: initialData?.id || `ad_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    } as GameAd

    // Validate that all required assets are present and have all required fields
    const requiredAssetTypes = GAME_AD_TEMPLATES.find(t => t.id === gameAdData.templateType)?.requiredAssetTypes || []
    const assets = gameAdData.assets || []

    // Check if we have all required asset types
    const missingAssetTypes = requiredAssetTypes.filter(type => 
      !assets.some(asset => asset.assetType === type)
    )

    if (missingAssetTypes.length > 0) {
      setError(`Missing required assets: ${missingAssetTypes.join(', ')}`)
      return
    }

    // Check if all assets have required fields
    const invalidAssets = assets.filter(asset => 
      !asset.assetType || !asset.assetId || !asset.robloxAssetId
    )

    if (invalidAssets.length > 0) {
      setError('Some assets are missing required fields')
      console.error('Invalid assets:', invalidAssets)
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onSave(gameAdData)
    } catch (error) {
      console.error('Error saving game ad:', error)
      setError('Failed to save game ad. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{initialData?.id ? 'Edit Game Ad' : 'Create New Game Ad'}</DialogTitle>
          <DialogDescription>
            {initialData?.id ? 'Update your game ad details' : `Create a new ${selectedTemplate?.name}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-6 py-4 max-h-[calc(90vh-180px)]">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>

            {selectedTemplate && (
              <div className="mt-4">
                <h3 className="font-semibold mb-4">Required Assets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.assets?.map((asset, index) => {
                    const assetsOfType = getAssetsByType(asset.assetType)
                    return (
                      <div key={index} className="space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">
                            {asset.assetType}
                          </Label>
                          <div className="col-span-3">
                            <Select
                              value={asset.assetId}
                              onValueChange={(value) => handleAssetChange(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${asset.assetType}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {assetsOfType.map(option => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {renderAssetPreview(selectedAssetDetails[index], asset.assetType)}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 