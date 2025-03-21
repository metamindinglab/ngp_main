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
  'shoes'
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

  useEffect(() => {
    if (asset) {
      setFormData({
        ...asset,
        tags: asset.tags || [],
      });
      if (asset.robloxAssetId) {
        verifyRobloxAsset(asset.robloxAssetId);
      }
    }
  }, [asset]);

  const verifyRobloxAsset = async (id: string) => {
    setIsVerifying(true);
    setVerificationError(null);
    try {
      // First try as catalog ID using our proxy
      let response = await fetch(`/api/roblox/catalog/${id}`);
      const catalogData = await response.json();
      
      if (response.ok && catalogData.id) {
        setFormData(prev => ({ ...prev, robloxAssetId: catalogData.id.toString() }));
        setIsValidAsset(true);
        return;
      }

      // Try as direct asset ID using our proxy
      response = await fetch(`/api/roblox/asset/${id}`);
      const assetData = await response.json();
      
      if (response.ok && assetData.id) {
        setFormData(prev => ({ ...prev, robloxAssetId: id }));
        setIsValidAsset(true);
        return;
      }

      setVerificationError('Invalid Roblox Asset ID or Catalog ID');
      setIsValidAsset(false);
    } catch (error) {
      console.error('Error verifying Roblox Asset ID:', error);
      setVerificationError('Error verifying Roblox Asset ID');
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

          <div>
            <Label>Roblox Asset ID</Label>
            <div className="flex gap-2">
              <Input
                name="robloxAssetId"
                value={formData.robloxAssetId || ''}
                onChange={handleInputChange}
                placeholder="Enter Roblox Asset ID or Catalog ID"
              />
              <Button
                type="button"
                onClick={() => formData.robloxAssetId && verifyRobloxAsset(formData.robloxAssetId)}
                disabled={isVerifying || !formData.robloxAssetId}
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
            {verificationError && (
              <p className="text-sm text-red-500 mt-1">{verificationError}</p>
            )}
            {isValidAsset && formData.robloxAssetId && (
              <div className="mt-4 aspect-square w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
                <RobloxAssetPreview assetId={formData.robloxAssetId} />
              </div>
            )}
          </div>

          <div>
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