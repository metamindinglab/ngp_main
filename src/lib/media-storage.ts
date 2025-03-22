export class MediaStorageError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'MediaStorageError';
  }
}

export interface MediaMetadata {
  id: string;
  originalUrl: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  localPath: string;
  thumbnailPath?: string;
  uploadedAt: string;
  lastChecked: string;
}

export async function downloadMedia(url: string, type: 'image' | 'video', id: string): Promise<MediaMetadata> {
  try {
    const response = await fetch('/api/media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        type,
        id,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new MediaStorageError(error.error || 'Failed to download media', 'API_ERROR');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof MediaStorageError) {
      throw error;
    }
    console.error('Failed to download media:', error);
    throw new MediaStorageError('Failed to download media', 'UNKNOWN_ERROR');
  }
}

// Trigger media cleanup via API
export async function cleanupOldMedia(): Promise<void> {
  try {
    const response = await fetch('/api/media/cleanup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MEDIA_CLEANUP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new MediaStorageError(error.error || 'Failed to cleanup media', 'API_ERROR');
    }
  } catch (error) {
    console.error('Failed to cleanup media:', error);
    throw new MediaStorageError('Failed to cleanup media', 'CLEANUP_FAILED');
  }
} 