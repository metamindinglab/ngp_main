import React from 'react';
import { Asset } from '@/types/asset';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Trash2, Edit, X } from 'lucide-react';
import RobloxAssetPreview from '@/components/display-objects/roblox-asset-preview';

interface AssetDetailsDialogProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AssetDetailsDialog({
  asset,
  open,
  onClose,
  onEdit,
  onDelete,
}: AssetDetailsDialogProps) {
  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <DialogHeader>
          <DialogTitle>{asset.name}</DialogTitle>
          <DialogDescription>{asset.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Type</h3>
              <p>{asset.assetType}</p>
            </div>
            <div>
              <h3 className="font-medium">Roblox ID</h3>
              <p>{asset.robloxAssetId}</p>
            </div>
            {asset.tags && (
              <div>
                <h3 className="font-medium">Tags</h3>
                <p>{Array.isArray(asset.tags) ? asset.tags.join(', ') : asset.tags}</p>
              </div>
            )}
            {asset.createdAt && (
              <div>
                <h3 className="font-medium">Created At</h3>
                <p>{new Date(asset.createdAt).toLocaleString()}</p>
              </div>
            )}
            {asset.updatedAt && (
              <div>
                <h3 className="font-medium">Updated At</h3>
                <p>{new Date(asset.updatedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
          {asset.robloxAssetId && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Roblox Asset Preview</h3>
              <RobloxAssetPreview assetId={asset.robloxAssetId} />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Asset
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 