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
import { GameAd, GameAdTemplate, GAME_AD_TEMPLATES, GameAdTemplateType, Asset, AssetType } from '@/types/gameAd'

interface GameAdDialogProps {
  open: boolean
  onClose: () => void
  initialData: GameAd | null
  onSave: (data: GameAd) => Promise<void>
}

interface AssetOption {
  id: string
  name: string
  assetType: string
  robloxAssetId: string
  description?: string
  image?: string
  previewUrl?: string
  dimensions?: {
    width: number
    height: number
  }
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
  const [availableAssets, setAvailableAssets] = useState<AssetOption[]>([])
  const [selectedAssetDetails, setSelectedAssetDetails] = useState<Record<number, AssetOption | null>>({})

  // Load available assets
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const response = await fetch('/api/assets')
        const data = await response.json()
        setAvailableAssets(data.assets)
      } catch (error) {
        console.error('Error loading assets:', error)
      }
    }
    loadAssets()
  }, [])

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      const template = GAME_AD_TEMPLATES.find(t => t.id === initialData.templateType)
      setSelectedTemplate(template || null)
      
      // Load selected asset details
      const details: Record<number, AssetOption | null> = {}
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
    setFormData(prev => ({
      ...prev,
      templateType: templateId,
      assets: template?.requiredAssetTypes.map(assetType => ({
        assetType,
        assetId: '',
      })) || [],
    }))
    setSelectedAssetDetails({})
  }

  const handleAssetChange = (index: number, assetId: string) => {
    const selectedAsset = availableAssets.find(asset => asset.id === assetId)
    setSelectedAssetDetails(prev => ({
      ...prev,
      [index]: selectedAsset || null,
    }))
    setFormData(prev => {
      const newAssets = [...(prev.assets || [])]
      newAssets[index] = {
        ...newAssets[index],
        assetId,
      }
      return { ...prev, assets: newAssets }
    })
  }

  const getAssetsByType = (assetType: AssetType) => {
    return availableAssets.filter(asset => asset.assetType === assetType)
  }

  const renderAssetPreview = (asset: AssetOption | null, assetType: AssetType) => {
    if (!asset) return null

    const previewUrl = asset.image || asset.previewUrl || `https://tr.rbxcdn.com/${asset.robloxAssetId}/420/420/Image/Png`
    
    return (
      <Card className="mt-2">
        <CardContent className="p-4">
          <div className="aspect-video relative">
            <img
              src={previewUrl}
              alt={asset.name}
              className="rounded-lg object-cover w-full h-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-asset.png' // Fallback image
              }}
            />
          </div>
          <div className="mt-2 text-sm">
            <p className="font-medium">{asset.name}</p>
            <p className="text-muted-foreground text-xs">{asset.description}</p>
            {asset.dimensions && (
              <p className="text-xs text-muted-foreground">
                {asset.dimensions.width} × {asset.dimensions.height}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.templateType) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await onSave({
        ...formData,
        id: initialData?.id || `ad_${Date.now()}`,
        updatedAt: new Date().toISOString(),
      } as GameAd)
    } catch (error) {
      console.error('Error saving game ad:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Game Ad' : 'Create New Game Ad'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update your game ad details' : 'Create a new game ad using a template'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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

          {!initialData && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template" className="text-right">
                Template
              </Label>
              <Select
                value={formData.templateType}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {GAME_AD_TEMPLATES.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {initialData ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 