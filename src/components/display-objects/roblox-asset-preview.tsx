import React, { useEffect, useState, useRef } from 'react';

interface RobloxAssetPreviewProps {
  assetId: string;
}

interface ThumbnailResponse {
  targetId: number;
  state: string;
  imageUrl: string | null;
}

interface PreviewData {
  camera: {
    position: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    fov: number;
  };
  aabb: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  mtl: string;
  obj: string;
  textures: string[];
}

interface PreviewConfig {
  containerId: string;
  width: number;
  height: number;
  camera?: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
  };
}

interface ModelConfig {
  objUrl: string;
  mtlUrl: string;
  textures: string[];
}

interface GamePreview {
  loadModel(config: ModelConfig): Promise<void>;
  dispose(): void;
}

// Extend Window interface to include Roblox object
declare global {
  interface Window {
    Roblox?: {
      GameLauncher?: {
        GamePreview: {
          new: (config: any) => any;
        };
      };
    };
  }
}

const RobloxAssetPreview: React.FC<RobloxAssetPreviewProps> = ({ assetId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previewContainerId = `preview-container-${assetId}`;
  const previewRef = useRef<any>(null);

  // Function to get CDN URL based on hash
  const getCdnUrl = (hash: string) => {
    let i = 31;
    for (let t = 0; t < 38; t++) {
      i ^= hash.charCodeAt(t);
    }
    return `https://t${(i % 8).toString()}.rbxcdn.com/${hash}`;
  };

  useEffect(() => {
    const initializePreview = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the Roblox preview script if not already loaded
        if (!window.Roblox?.GameLauncher?.GamePreview) {
          const script = document.createElement('script');
          script.src = 'https://js.rbxcdn.com/js/preview.js';
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve) => {
            script.onload = resolve;
            script.onerror = () => {
              throw new Error('Failed to load Roblox preview script');
            };
          });
        }

        // Wait for the preview script to be fully initialized
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get the preview class
        const GamePreview = window.Roblox?.GameLauncher?.GamePreview;
        if (!GamePreview) {
          throw new Error('Roblox preview script not initialized properly');
        }

        // Initialize the preview
        const preview = GamePreview.new({
          containerId: previewContainerId,
          width: 400,
          height: 400
        });

        // Add the asset to the preview
        await preview.addAsset({
          assetId: assetId,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        });

        previewRef.current = preview;
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize 3D preview:', err);
        setError('Failed to load 3D preview');
        setLoading(false);
      }
    };

    initializePreview();

    return () => {
      // Cleanup
      if (previewRef.current) {
        try {
          previewRef.current.dispose();
        } catch (err) {
          console.error('Error disposing preview:', err);
        }
      }
    };
  }, [assetId]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500">
          {error}
        </div>
      )}
      <div
        id={previewContainerId}
        className="w-full h-full"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default RobloxAssetPreview; 