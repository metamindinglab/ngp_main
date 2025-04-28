'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, RefreshCcw } from 'lucide-react';

interface RobloxAssetPreviewProps {
  assetId: string;
  height?: string;
}

export default function RobloxAssetPreview({ assetId, height = "300px" }: RobloxAssetPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadImage = async () => {
    setLoading(true);
    setError(null);

    try {
      // First verify the asset exists
      const response = await fetch(`/api/roblox/thumbnail?assetId=${assetId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to load preview');
      }

      // If we got here, the thumbnail exists and we can show it
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    }
  };

  useEffect(() => {
    if (assetId) {
      loadImage();
    }
  }, [assetId]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadImage();
  };

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
      
      {!loading && !error && (
        <img
          src={`/api/roblox/thumbnail?assetId=${assetId}&t=${retryCount}`}
          className="w-full h-full object-contain"
          alt={`Roblox Asset ${assetId}`}
          onError={() => setError('Failed to load image')}
          style={{ display: loading ? 'none' : 'block' }}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 border rounded-lg">
          <div className="text-center p-4 space-y-2">
            <p className="text-gray-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-2"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex justify-between items-center">
        <span className="text-white text-xs">Asset ID: {assetId}</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-blue-200 h-6 px-2"
          onClick={() => window.open(`https://www.roblox.com/catalog/${assetId}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View on Roblox
        </Button>
      </div>
    </div>
  );
} 