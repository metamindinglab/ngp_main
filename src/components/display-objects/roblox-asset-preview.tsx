'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, RefreshCcw } from 'lucide-react';
import Image from 'next/image';

interface RobloxAssetPreviewProps {
  assetId: string;
  height?: string;
  width?: string;
  priority?: boolean;
}

export default function RobloxAssetPreview({ assetId, height = '200px', width = '100%', priority = false }: RobloxAssetPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAudio, setIsAudio] = useState(false);

  // Fallback image from a known working domain
  const fallbackImageUrl = 'https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/420/420/Image/Png';
  const audioIconUrl = 'https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/420/420/Image/Png';

  useEffect(() => {
    const fetchAssetInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsAudio(false);

        // First try to get asset info to determine type
        const assetResponse = await fetch(`/api/roblox/asset/${assetId}`);
        if (assetResponse.ok) {
          const assetData = await assetResponse.json();
          // Check if it's an audio asset (type 3)
          if (assetData.AssetTypeId === 3) {
            setIsAudio(true);
            setImageUrl(audioIconUrl);
            setIsLoading(false);
            return;
          }
        }

        // For non-audio assets, proceed with normal thumbnail fetching
        const thumbnailUrl = `/api/roblox/thumbnail/${assetId}`;
        setImageUrl(thumbnailUrl);
        
        // Also fetch catalog info in background for better quality image if available
        const response = await fetch(`/api/roblox/catalog/${assetId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.previewUrl || data.thumbnailUrl) {
            setImageUrl(data.previewUrl || data.thumbnailUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching asset info:', error);
        setError('Failed to load asset preview');
        setImageUrl(fallbackImageUrl);
      } finally {
        setIsLoading(false);
      }
    };

    if (assetId) {
      fetchAssetInfo();
    }
  }, [assetId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height, width }}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative inline-block" style={{ height, width }}>
      <div className="absolute inset-0">
        <Image
          src={imageUrl || fallbackImageUrl}
          alt={error ? 'Asset preview unavailable' : isAudio ? 'Audio Asset' : 'Roblox Asset Preview'}
          fill
          className="object-contain"
          priority={priority}
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <p className="text-white text-sm px-2 py-1 bg-black bg-opacity-75 rounded">
              {error}
            </p>
          </div>
        )}
        {isAudio && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 