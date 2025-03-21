'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import RobloxAssetPreview from '@/components/display-objects/roblox-asset-preview';
import AssetFormDialog from '@/components/dialogs/asset-form-dialog';
import AssetDetailsDialog from '@/components/dialogs/asset-details-dialog';

interface Asset {
  id: string;
  name: string;
  description: string;
  assetType: string;
  robloxAssetId?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  [key: string]: any;
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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assets');
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      const data = await response.json();
      setAssets(data.assets);
      setError(null);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (asset: Partial<Asset>) => {
    try {
      const method = asset.id ? 'PUT' : 'POST';
      const response = await fetch('/api/assets', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asset),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${asset.id ? 'update' : 'create'} asset`);
      }

      // Refresh the assets list
      fetchAssets();
      setIsFormOpen(false);
      setSelectedAsset(undefined);
    } catch (err) {
      console.error('Error saving asset:', err);
      throw err;
    }
  };

  const handleEdit = async (asset: Asset) => {
    setSelectedAsset(asset);
    setIsFormOpen(true);
  };

  const handleDelete = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        const response = await fetch(`/api/assets?id=${assetId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete asset');
        }

        // Refresh the assets list
        fetchAssets();
      } catch (err) {
        console.error('Error deleting asset:', err);
        alert('Failed to delete asset');
      }
    }
  };

  const handlePreview = (asset: Asset) => {
    if (asset.robloxAssetId) {
      setSelectedAsset(asset);
      setIsPreviewOpen(true);
    }
  };

  const getTagColor = (tag: string): string => {
    if (tag.includes('game') || tag.includes('interactive')) return 'bg-blue-100 text-blue-800';
    if (tag.includes('marketing') || tag.includes('brand')) return 'bg-purple-100 text-purple-800';
    if (tag.includes('fashion') || tag.includes('clothing')) return 'bg-pink-100 text-pink-800';
    if (tag.includes('music') || tag.includes('audio')) return 'bg-green-100 text-green-800';
    if (tag.includes('tech') || tag.includes('digital')) return 'bg-cyan-100 text-cyan-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailsOpen(true);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || !selectedType || asset.assetType === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assets Manager</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {assetTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {asset.assetType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {asset.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{new Date(asset.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(asset)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(asset)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AssetDetailsDialog
        isOpen={isDetailsOpen}
        asset={selectedAsset!}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAsset(undefined);
        }}
        onEdit={(asset) => {
          setIsDetailsOpen(false);
          handleEdit(asset);
        }}
        onDelete={(assetId) => {
          setIsDetailsOpen(false);
          handleDelete(assetId);
        }}
      />

      <AssetFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAsset(undefined);
        }}
        onSubmit={handleSubmit}
        asset={selectedAsset}
      />
    </div>
  );
} 