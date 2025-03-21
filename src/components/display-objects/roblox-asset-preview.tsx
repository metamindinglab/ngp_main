'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface RobloxAssetPreviewProps {
  assetId: string;
  className?: string;
  height?: string;
}

const RobloxAssetPreview: React.FC<RobloxAssetPreviewProps> = ({ 
  assetId, 
  className = "w-full h-[420px]",
  height = "420px"
}) => {
  const [error, setError] = useState<string | null>(null);

  if (!assetId) {
    return (
      <div className={`${className} bg-background border rounded-md flex items-center justify-center`}>
        <div className="text-muted-foreground">No asset ID provided</div>
      </div>
    );
  }

  const handleOpenPreview = () => {
    window.open(`https://www.roblox.com/catalog/${assetId}`, '_blank');
  };

  return (
    <div className={`${className} bg-background border rounded-md overflow-hidden relative group`}>
      {error ? (
        <div className="w-full h-full flex items-center justify-center text-red-500 flex-col gap-4">
          <div>{error}</div>
          <Button 
            onClick={handleOpenPreview}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Roblox
          </Button>
        </div>
      ) : (
        <>
          <img
            src={`/api/roblox/thumbnail/${assetId}`}
            alt="Asset Preview"
            className="w-full h-full object-contain"
            onError={() => setError('Failed to load preview')}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button 
              onClick={handleOpenPreview}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Roblox
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default RobloxAssetPreview; 