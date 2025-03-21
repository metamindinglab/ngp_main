import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, X } from 'lucide-react';
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
  [key: string]: any;
}

interface AssetDetailsDialogProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
}

export default function AssetDetailsDialog({
  asset,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: AssetDetailsDialogProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTagColor = (tag: string): string => {
    // Define color mapping for different tag categories
    if (tag.includes('game') || tag.includes('interactive')) return 'bg-blue-100 text-blue-800';
    if (tag.includes('marketing') || tag.includes('brand')) return 'bg-purple-100 text-purple-800';
    if (tag.includes('fashion') || tag.includes('clothing')) return 'bg-pink-100 text-pink-800';
    if (tag.includes('music') || tag.includes('audio')) return 'bg-green-100 text-green-800';
    if (tag.includes('tech') || tag.includes('digital')) return 'bg-cyan-100 text-cyan-800';
    return 'bg-gray-100 text-gray-800'; // default color
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{asset.name}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <div className="mt-1">
                  <Badge variant="outline">
                    {asset.assetType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-gray-900">{asset.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Roblox Asset ID</h3>
                <p className="mt-1 text-gray-900">{asset.robloxAssetId || 'N/A'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="mt-1 text-gray-900">{formatDate(asset.createdAt)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1 text-gray-900">{formatDate(asset.updatedAt)}</p>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button onClick={() => onEdit(asset)} className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this asset?')) {
                    onDelete(asset.id);
                  }
                }}
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {asset.robloxAssetId && (
            <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
              <RobloxAssetPreview assetId={asset.robloxAssetId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 