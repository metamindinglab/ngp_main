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
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface FormData {
  name: string;
  templateType: GameAdTemplateType;
  assets: (Asset | null)[];
}

interface GameAdDialogProps {
  open: boolean
  onClose: () => void
  initialData: GameAd | null
  onSave: (data: GameAd) => Promise<void>
}

export function GameAdDialog({ open, onClose, initialData, onSave }: GameAdDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    templateType: (initialData?.type as GameAdTemplateType) || 'multimedia_display',
    assets: initialData?.assets || []
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
        if (Array.isArray(data.assets)) {
          // Transform the assets to ensure they have the correct type
          const transformedAssets = data.assets.map((asset: { type?: AssetType; assetType?: AssetType; id: string; name: string; robloxAssetId: string }) => ({
            ...asset,
            assetType: asset.type || asset.assetType // Handle both type and assetType fields
          }))
          setAvailableAssets(transformedAssets)
        } else {
          console.error('Invalid assets data:', data)
          setError('Invalid assets data received')
        }
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
      // Create a mapping of asset types to their positions
      const template = GAME_AD_TEMPLATES.find(t => t.id === initialData.type)
      setSelectedTemplate(template || null)
      
      if (template) {
        // Initialize an array with the same length as required asset types
        const newAssets = new Array(template.requiredAssetTypes.length).fill(null)
        const details: Record<number, AssetData | null> = {}

        // Map each asset to its corresponding position based on asset type
        template.requiredAssetTypes.forEach((requiredType, index) => {
          const matchingAsset = initialData.assets?.find(asset => asset.assetType === requiredType)
          if (matchingAsset) {
            newAssets[index] = matchingAsset
            const assetDetail = availableAssets.find(a => a.id === matchingAsset.assetId)
            if (assetDetail) {
              details[index] = assetDetail
            }
          }
        })

        setFormData({
          name: initialData.name,
          templateType: initialData.type as GameAdTemplateType,
          assets: newAssets
        })
        setSelectedAssetDetails(details)
      }
    } else {
      setFormData({
        name: '',
        templateType: 'multimedia_display',
        assets: [],
      })
      setSelectedTemplate(null)
      setSelectedAssetDetails({})
    }
  }, [initialData, availableAssets])

  const handleTemplateChange = (templateId: GameAdTemplateType) => {
    setFormData({
      name: '',
      templateType: templateId,
      assets: []
    })
    setSelectedTemplate(GAME_AD_TEMPLATES.find(t => t.id === templateId) || null)
  }

  const handleAssetChange = (index: number, assetId: string) => {
    // Handle "none" selection
    if (assetId === 'none') {
      setSelectedAssetDetails(prev => ({
        ...prev,
        [index]: null
      }))
      
      setFormData(prev => {
        const newAssets = [...prev.assets]
        newAssets[index] = null
        return { ...prev, assets: newAssets }
      })
      return
    }

    const selectedAsset = availableAssets.find(asset => asset.id === assetId)
    console.log('Selected asset:', selectedAsset)
    
    if (!selectedAsset) {
      console.warn('No asset found for id:', assetId)
      return
    }

    // Update selected asset details
    setSelectedAssetDetails(prev => ({
      ...prev,
      [index]: selectedAsset
    }))
    
    // Update form data assets
    setFormData(prev => {
      const newAssets = [...prev.assets]
      newAssets[index] = {
        assetType: selectedAsset.assetType || selectedAsset.type as AssetType,
        assetId: selectedAsset.id,
        robloxAssetId: selectedAsset.robloxAssetId
      }
      return { ...prev, assets: newAssets }
    })
  }

  const getAssetsByType = (assetType: AssetType) => {
    return availableAssets.filter(asset => 
      asset.assetType === assetType || asset.type === assetType
    );
  }

  const renderAssetPreview = (asset: AssetData | null, assetType: AssetType) => {
    if (!asset) return null

    return (
      <Card className="mt-2">
        <CardContent className="p-4">
          <RobloxAssetPreview
            assetId={asset.robloxAssetId}
            height="200px"
            priority={assetType === 'kol_character'}
          />
          <div className="mt-2 text-sm">
            <p className="font-medium">{asset.name}</p>
            <p className="text-muted-foreground text-xs">{asset.description}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Helper function to validate asset type
  const isValidAssetType = (type: string): type is AssetType => {
    const validTypes: AssetType[] = [
      'kol_character', 'hat', 'clothing', 'item', 'shoes', 
      'animation', 'audio', 'multi_display'
    ]
    return validTypes.includes(type as AssetType)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Name is required')
      }

      if (!formData.templateType) {
        throw new Error('Please select a template')
      }

      // Get the selected template
      const template = GAME_AD_TEMPLATES.find(t => t.id === formData.templateType)

      // For Dancing NPC template, ensure KOL character is present
      if (template?.id === 'dancing_npc') {
        const hasKolCharacter = formData.assets?.some(asset => asset?.assetType === 'kol_character')
        if (!hasKolCharacter) {
          throw new Error('KOL character is required for Dancing NPC template')
        }
      }

      // Filter out null assets and ensure all remaining assets have the required fields
      const validatedAssets = (formData.assets || [])
        .filter((asset): asset is Asset => asset !== null && 
          asset.assetType !== undefined && 
          asset.assetId !== undefined && 
          asset.robloxAssetId !== undefined)
        .map(asset => ({
          assetType: asset.assetType,
          assetId: asset.assetId,
          robloxAssetId: asset.robloxAssetId
        }))

      // Prepare the data for submission
      const submitData: GameAd = {
        id: initialData?.id || '',
        name: formData.name.trim(),
        type: formData.templateType,
        assets: validatedAssets,
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date(),
        games: initialData?.games || [],
        performance: initialData?.performance || [],
        containers: initialData?.containers || []
      }

      console.log('Submitting game ad data:', submitData)
      await onSave(submitData)
    } catch (error) {
      console.error('Error submitting form:', error)
      setError(error instanceof Error ? error.message : 'Failed to save game ad')
    } finally {
      setLoading(false)
    }
  }

  const renderAssetSelectors = () => {
    if (!selectedTemplate) return null;

    return selectedTemplate.requiredAssetTypes.map((assetType, index) => {
      const assets = getAssetsByType(assetType);
      const selectedAsset = selectedAssetDetails[index];
      const isRequired = assetType === 'kol_character' && selectedTemplate.id === 'dancing_npc';

      return (
        <div key={assetType} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{assetType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            {isRequired && (
              <span className="text-sm text-red-500">Required</span>
            )}
          </div>
          <Select
            value={formData.assets[index]?.assetId || 'none'}
            onValueChange={(value) => handleAssetChange(index, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${assetType.replace(/_/g, ' ')}`} />
            </SelectTrigger>
            <SelectContent>
              {!isRequired && (
                <SelectItem value="none">None</SelectItem>
              )}
              {assets.length > 0 ? (
                assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  No {assetType.replace(/_/g, ' ')} assets available
                </div>
              )}
            </SelectContent>
          </Select>
          {selectedAsset && renderAssetPreview(selectedAsset, assetType)}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Game Ad' : 'Create New Game Ad'}
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Edit your game ad details below.' : 'Create a new game ad by filling out the details below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter game ad name"
            />
          </div>

          {!initialData && (
            <div className="space-y-4">
              <Label>Template</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {GAME_AD_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer hover:border-primary transition-colors",
                      formData.templateType === template.id && "border-primary"
                    )}
                    onClick={() => handleTemplateChange(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-video relative mb-4">
                        <Image
                          src={template.thumbnail}
                          alt={template.name}
                          fill
                          className="object-cover rounded-md"
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(selectedTemplate || initialData) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Assets</h3>
              <ScrollArea className="h-[400px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {renderAssetSelectors()}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          {error && (
            <div className="text-red-500 text-sm mb-2">{error}</div>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {initialData ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 