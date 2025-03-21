'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import RobloxAssetPreview from '@/components/display-objects/roblox-asset-preview';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface Asset {
  id: string;
  name: string;
  description: string;
  assetType: string;
  robloxAssetId?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  // Additional fields based on type
  characterType?: string;
  appearance?: {
    gender: string;
    style: string[];
    hairStyle: string;
    hairColor: string;
    height: string;
    features: string[];
  };
  personality?: string[];
  defaultAnimations?: string[];
  suitableFor?: {
    brands: string[];
    products: string[];
    gameTypes: string[];
  };
  marketingCapabilities?: string[];
  // Clothing specific
  image?: string;
  previewImage?: string;
  compatibility?: string[];
  brands?: string[];
  size?: string[];
  // Minigame specific
  difficulty?: string;
  maxPlayers?: number;
  gameplayDuration?: string;
  customizableElements?: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
  }>;
  // Media specific
  url?: string;
  duration?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  fileFormat?: string;
  fileSize?: number;
  category?: string;
  // Item specific
  itemType?: string;
  materials?: string[];
  weight?: string;
  dimensions3D?: {
    length: number;
    width: number;
    height: number;
  };
  // Multi Display specific
  displayType?: string;
  displayCount?: number;
  arrangement?: string;
  displaySettings?: {
    spacing: number;
    orientation: string;
    autoRotate?: boolean;
    syncAnimation?: boolean;
  };
}

interface AssetFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: Partial<Asset>) => Promise<void>;
  asset?: Asset;
}

const assetTypes = [
  'kol_character',
  'clothing',
  'minigame',
  'hat',
  'animation',
  'image',
  'audio',
  'video',
  'shoes',
  'item',
  'multi_display'
];

export default function AssetFormDialog({
  isOpen,
  onClose,
  onSubmit,
  asset,
}: AssetFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Asset>>(asset || {
    name: '',
    description: '',
    assetType: '',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isValidAsset, setIsValidAsset] = useState(false);
  const [lastVerifyTime, setLastVerifyTime] = useState<number>(0);
  const VERIFY_COOLDOWN = 5000; // 5 seconds cooldown between verifications

  useEffect(() => {
    if (asset) {
      setFormData({
        ...asset,
        tags: asset.tags || [],
      });
      // Remove automatic verification
      if (asset.robloxAssetId) {
        setIsValidAsset(true); // Trust existing assets as valid
      }
    }
  }, [asset]);

  const verifyRobloxAsset = async (id: string) => {
    if (!id) {
      setVerificationError('Please enter a Roblox Asset ID or Catalog ID');
      setIsValidAsset(false);
      return;
    }

    if (!/^\d+$/.test(id)) {
      setVerificationError('ID must be a number');
      setIsValidAsset(false);
      return;
    }

    const now = Date.now();
    if (now - lastVerifyTime < VERIFY_COOLDOWN) {
      setVerificationError(`Please wait ${Math.ceil((VERIFY_COOLDOWN - (now - lastVerifyTime)) / 1000)} seconds before trying again`);
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setLastVerifyTime(now);
    
    try {
      console.log('Verifying ID:', id);
      const response = await fetch(`/api/roblox/catalog/${id}`);
      const data = await response.json();

      console.log('Verification response:', data);

      if (response.status === 429) {
        setVerificationError('Too many requests. Please wait 30 seconds before trying again.');
        setIsValidAsset(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 404) {
          setVerificationError('Asset not found. Please check the ID and try again.');
        } else {
          setVerificationError(data.error || 'Failed to verify asset. Please try again later.');
        }
        setIsValidAsset(false);
        return;
      }

      if (data && data.assetId) {
        console.log('Asset verified successfully:', data);
        // If we got a catalogId back, it means we input a catalog ID
        if (data.catalogId) {
          // Update the input field with the actual asset ID
          setFormData(prev => ({
            ...prev,
            robloxAssetId: data.assetId.toString(),
            name: data.name || prev.name,
            description: data.description || prev.description,
            assetType: data.assetType || prev.assetType
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            robloxAssetId: id,
            name: data.name || prev.name,
            description: data.description || prev.description,
            assetType: data.assetType || prev.assetType
          }));
        }
        setIsValidAsset(true);
      } else {
        console.error('Invalid response format:', data);
        setVerificationError('Invalid response from Roblox API. Please try again.');
        setIsValidAsset(false);
      }
    } catch (error) {
      console.error('Error verifying Roblox Asset ID:', error);
      setVerificationError('Error connecting to the server. Please try again later.');
      setIsValidAsset(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssetTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, assetType: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = formData.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...currentTags, newTag.trim()],
        }));
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = formData.tags || [];
    setFormData((prev) => ({
      ...prev,
      tags: currentTags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleDimensions3DChange = (
    field: 'length' | 'width' | 'height',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      dimensions3D: {
        length: field === 'length' ? parseFloat(value) || 0 : (prev.dimensions3D?.length || 0),
        width: field === 'width' ? parseFloat(value) || 0 : (prev.dimensions3D?.width || 0),
        height: field === 'height' ? parseFloat(value) || 0 : (prev.dimensions3D?.height || 0)
      }
    }));
  };

  const handleDisplaySettingsChange = (
    field: 'spacing' | 'orientation' | 'autoRotate' | 'syncAnimation',
    value: string | number | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      displaySettings: {
        spacing: field === 'spacing' ? (value as number) : (prev.displaySettings?.spacing || 0),
        orientation: field === 'orientation' ? (value as string) : (prev.displaySettings?.orientation || 'horizontal'),
        autoRotate: field === 'autoRotate' ? (value as boolean) : (prev.displaySettings?.autoRotate || false),
        syncAnimation: field === 'syncAnimation' ? (value as boolean) : (prev.displaySettings?.syncAnimation || false)
      }
    }));
  };

  const renderAdditionalFields = () => {
    switch (formData.assetType) {
      case 'kol_character':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label>Character Type</Label>
                <Input
                  name="characterType"
                  value={formData.characterType || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Personality (comma-separated)</Label>
                <Input
                  name="personality"
                  value={formData.personality?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personality: e.target.value.split(',').map(item => item.trim())
                  }))}
                />
              </div>
              {/* Add more character-specific fields */}
            </div>
          </>
        );
      case 'clothing':
      case 'shoes':
      case 'hat':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label>Image URL</Label>
                <Input
                  name="image"
                  value={formData.image || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Preview Image URL</Label>
                <Input
                  name="previewImage"
                  value={formData.previewImage || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Brands (comma-separated)</Label>
                <Input
                  name="brands"
                  value={formData.brands?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    brands: e.target.value.split(',').map(item => item.trim())
                  }))}
                />
              </div>
            </div>
          </>
        );
      case 'item':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label>Item Type</Label>
                <Input
                  name="itemType"
                  value={formData.itemType || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Materials (comma-separated)</Label>
                <Input
                  name="materials"
                  value={formData.materials?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    materials: e.target.value.split(',').map(item => item.trim())
                  }))}
                />
              </div>
              <div>
                <Label>Weight</Label>
                <Input
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>3D Dimensions</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    name="dimensions3D.length"
                    placeholder="Length"
                    value={formData.dimensions3D?.length || ''}
                    onChange={(e) => handleDimensions3DChange('length', e.target.value)}
                    type="number"
                  />
                  <Input
                    name="dimensions3D.width"
                    placeholder="Width"
                    value={formData.dimensions3D?.width || ''}
                    onChange={(e) => handleDimensions3DChange('width', e.target.value)}
                    type="number"
                  />
                  <Input
                    name="dimensions3D.height"
                    placeholder="Height"
                    value={formData.dimensions3D?.height || ''}
                    onChange={(e) => handleDimensions3DChange('height', e.target.value)}
                    type="number"
                  />
                </div>
              </div>
            </div>
          </>
        );
      case 'multi_display':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label>Display Type</Label>
                <Input
                  name="displayType"
                  value={formData.displayType || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Display Count</Label>
                <Input
                  name="displayCount"
                  type="number"
                  value={formData.displayCount || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Arrangement</Label>
                <Select
                  value={formData.arrangement}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    arrangement: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Display Settings</Label>
                <div className="space-y-2">
                  <div>
                    <Label>Spacing (px)</Label>
                    <Input
                      name="displaySettings.spacing"
                      type="number"
                      value={formData.displaySettings?.spacing || ''}
                      onChange={(e) => handleDisplaySettingsChange('spacing', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Orientation</Label>
                    <Select
                      value={formData.displaySettings?.orientation || 'horizontal'}
                      onValueChange={(value) => handleDisplaySettingsChange('orientation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="autoRotate"
                      checked={formData.displaySettings?.autoRotate || false}
                      onCheckedChange={(checked: boolean) => handleDisplaySettingsChange('autoRotate', checked)}
                    />
                    <Label htmlFor="autoRotate">Auto Rotate</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="syncAnimation"
                      checked={formData.displaySettings?.syncAnimation || false}
                      onCheckedChange={(checked: boolean) => handleDisplaySettingsChange('syncAnimation', checked)}
                    />
                    <Label htmlFor="syncAnimation">Sync Animation</Label>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      // Add cases for other asset types
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {asset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await onSubmit(formData);
              onClose();
            } catch (error) {
              console.error('Error submitting form:', error);
            }
          }}
          className="space-y-6"
        >
          <div>
            <Label>Name</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label>Asset Type</Label>
            <Select
              value={formData.assetType}
              onValueChange={handleAssetTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="robloxAssetId">Roblox Asset ID or Catalog ID</Label>
              <div className="flex gap-2">
                <Input
                  id="robloxAssetId"
                  name="robloxAssetId"
                  value={formData.robloxAssetId || ''}
                  onChange={handleInputChange}
                  className={cn(
                    verificationError && "border-red-500"
                  )}
                />
                <Button
                  type="button"
                  onClick={() => verifyRobloxAsset(formData.robloxAssetId || '')}
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
              {verificationError && (
                <p className="text-sm text-red-500">{verificationError}</p>
              )}
            </div>

            {isValidAsset && formData.robloxAssetId && (
              <div className="grid gap-2">
                <Label>Asset Preview</Label>
                <RobloxAssetPreview assetId={formData.robloxAssetId} />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags?.map((tag) => (
                  <div
                    key={tag}
                    className="bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {renderAdditionalFields()}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 