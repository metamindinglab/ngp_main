'use client';

import React, { useEffect, useRef } from 'react';

interface RobloxAssetPreviewProps {
  assetId: string;
}

interface RobloxPreview {
  new (container: HTMLElement): {
    load: (assetId: string) => void;
  };
}

declare global {
  interface Window {
    RobloxPreview: RobloxPreview;
  }
}

export default function RobloxAssetPreview({ assetId }: RobloxAssetPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        // Load the Roblox preview script
        const script = document.createElement('script');
        script.src = 'https://www.roblox.com/asset-preview/script.js';
        script.async = true;
        script.onload = () => {
          // Initialize the preview
          if (window.RobloxPreview && containerRef.current) {
            const preview = new window.RobloxPreview(containerRef.current);
            preview.load(assetId);
          }
        };
        document.body.appendChild(script);

        return () => {
          document.body.removeChild(script);
        };
      } catch (error) {
        console.error('Error loading Roblox preview:', error);
      }
    };

    loadPreview();
  }, [assetId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-100 rounded-lg overflow-hidden"
    />
  );
} 