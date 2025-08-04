'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Eye, 
  ExternalLink,
  Package,
  Info,
  Loader2,
  ImageIcon,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface Asset {
  id: string
  name: string
  type: string
  robloxId?: string
  robloxAssetId?: string // Add this field as it exists in the actual data
  metadata?: any
  status: string
  createdAt: string
  updatedAt: string
}

interface RobloxAssetPreviewProps {
  asset: Asset
  open: boolean
  onClose: () => void
}

interface ThumbnailData {
  imageUrl: string | null
  error?: string
  loading: boolean
  canRetry?: boolean // Added for retry logic
}

export function RobloxAssetPreview({ asset, open, onClose }: RobloxAssetPreviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [thumbnailData, setThumbnailData] = useState<ThumbnailData>({ imageUrl: null, loading: true })

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'kol_character': return 'bg-purple-100 text-purple-800'
      case 'image': return 'bg-blue-100 text-blue-800'
      case 'video': return 'bg-red-100 text-red-800'
      case 'audio': return 'bg-green-100 text-green-800'
      case 'animation': return 'bg-yellow-100 text-yellow-800'
      case 'minigame': return 'bg-pink-100 text-pink-800'
      case 'multiMediaSignage': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const openInRoblox = () => {
    const robloxId = asset.robloxId || asset.robloxAssetId
    if (robloxId) {
      setIsLoading(true)
      window.open(`https://www.roblox.com/catalog/${robloxId}`, '_blank')
      // Reset loading state after a short delay
      setTimeout(() => setIsLoading(false), 1000)
    }
  }

  const getRobloxAssetId = () => {
    return asset.robloxId || asset.robloxAssetId
  }

  // Fetch thumbnail from Roblox API via our proxy
  const fetchThumbnail = async (assetId: string, retryCount = 0) => {
    const maxRetries = 3
    
    try {
      setThumbnailData({ imageUrl: null, loading: true })
      
      // Use our proxy endpoint to avoid CORS issues
      const response = await fetch(`/api/roblox/thumbnails?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch thumbnail`)
      }

      const data = await response.json()
      
      if (data.data && data.data.length > 0) {
        const thumbnailUrl = data.data[0].imageUrl
        if (thumbnailUrl && thumbnailUrl !== 'https://www.roblox.com/asset-thumbnail/image?assetId=0&width=420&height=420&format=png') {
          setThumbnailData({ imageUrl: thumbnailUrl, loading: false })
        } else {
          // Handle fallback case gracefully with retry option
          setThumbnailData({ 
            imageUrl: null, 
            loading: false,
            error: retryCount >= maxRetries ? 'Preview temporarily unavailable (Rate limited)' : 'Loading preview...',
            canRetry: retryCount < maxRetries
          })
          
          // Auto-retry after a short delay if we haven't hit max retries
          if (retryCount < maxRetries) {
            setTimeout(() => {
              fetchThumbnail(assetId, retryCount + 1)
            }, (retryCount + 1) * 2000) // Progressive delay: 2s, 4s, 6s
          }
        }
      } else {
        setThumbnailData({ 
          imageUrl: null, 
          loading: false,
          error: retryCount >= maxRetries ? 'Thumbnail service temporarily unavailable' : 'Retrying...',
          canRetry: retryCount < maxRetries
        })
        
        // Auto-retry for service issues
        if (retryCount < maxRetries) {
          setTimeout(() => {
            fetchThumbnail(assetId, retryCount + 1)
          }, (retryCount + 1) * 1500) // Progressive delay for service issues
        }
      }
    } catch (error) {
      console.error('Error fetching thumbnail:', error)
      
      const isNetworkError = error instanceof TypeError && error.message.includes('Failed to fetch')
      const isTimeoutError = error instanceof Error && error.message.includes('timeout')
      
      let errorMessage = 'Preview temporarily unavailable - Please try again later'
      if (isNetworkError) {
        errorMessage = 'Network error - Check your connection'
      } else if (isTimeoutError) {
        errorMessage = 'Request timed out - Server may be busy'
      }
      
      setThumbnailData({ 
        imageUrl: null, 
        loading: false, 
        error: retryCount >= maxRetries ? errorMessage : 'Retrying...',
        canRetry: retryCount < maxRetries
      })
      
      // Auto-retry on network/timeout errors
      if (retryCount < maxRetries && (isNetworkError || isTimeoutError)) {
        setTimeout(() => {
          fetchThumbnail(assetId, retryCount + 1)
        }, (retryCount + 1) * 3000) // Longer delay for error cases
      }
    }
  }

  // Fetch thumbnail when dialog opens and asset has Roblox ID
  useEffect(() => {
    if (open && getRobloxAssetId()) {
      fetchThumbnail(getRobloxAssetId()!)
    } else if (open) {
      setThumbnailData({ 
        imageUrl: null, 
        loading: false, 
        error: 'No Roblox asset ID available'
      })
    }
  }, [open, asset.robloxId, asset.robloxAssetId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderPreviewContent = () => {
    if (thumbnailData.loading) {
      return (
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 mb-2">Loading preview...</p>
          <p className="text-sm text-gray-500">
            Fetching thumbnail from Roblox
          </p>
        </div>
      )
    }

    if (thumbnailData.error) {
      return (
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {thumbnailData.canRetry ? 'Loading Preview...' : 'Preview Temporarily Unavailable'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {thumbnailData.error}
          </p>
          {thumbnailData.canRetry && (
            <div className="mb-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-600">Auto-retrying...</span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {getRobloxAssetId() && !thumbnailData.canRetry && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setThumbnailData({ imageUrl: null, loading: true })
                  if (getRobloxAssetId()) {
                    fetchThumbnail(getRobloxAssetId()!)
                  }
                }}
                disabled={thumbnailData.loading}
                className="mr-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Preview
              </Button>
            )}
            {getRobloxAssetId() && (
              <Button 
                variant="outline" 
                onClick={openInRoblox}
                disabled={isLoading}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {isLoading ? 'Opening...' : 'View in Roblox'}
              </Button>
            )}
          </div>
        </div>
      )
    }

    if (thumbnailData.imageUrl) {
      return (
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <img
              src={thumbnailData.imageUrl}
              alt={`Preview of ${asset.name}`}
              className="max-w-full max-h-48 rounded-lg shadow-md"
              onError={() => {
                setThumbnailData({ 
                  imageUrl: null, 
                  loading: false, 
                  error: 'Failed to load thumbnail image'
                })
              }}
            />
          </div>
          <p className="text-gray-600 mb-2">Roblox Asset Preview</p>
          <p className="text-sm text-gray-500 mb-2">
            Asset ID: {getRobloxAssetId()}
          </p>
          <Button 
            variant="outline" 
            onClick={openInRoblox}
            disabled={isLoading}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {isLoading ? 'Opening...' : 'View in Roblox'}
          </Button>
        </div>
      )
    }

    return (
      <div className="text-center">
        <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No Roblox asset ID available</p>
        <p className="text-sm text-gray-500">This asset has not been uploaded to Roblox yet</p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            Asset Preview: {asset.name}
          </DialogTitle>
          <DialogDescription>
            View detailed information and preview for this Roblox asset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Preview Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg min-h-64 flex items-center justify-center border-2 border-dashed border-gray-300 p-4">
                {renderPreviewContent()}
              </div>
            </CardContent>
          </Card>

          {/* Asset Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-sm text-gray-900">{asset.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <div className="mt-1">
                    <Badge className={getAssetTypeColor(asset.type)}>
                      {asset.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </div>
                </div>

                {getRobloxAssetId() && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Roblox Asset ID</label>
                    <p className="text-sm text-gray-900 font-mono">{getRobloxAssetId()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(asset.createdAt)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(asset.updatedAt)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Asset ID</label>
                  <p className="text-sm text-gray-900 font-mono">{asset.id}</p>
                </div>

                {asset.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Additional Info</label>
                    <div className="text-sm text-gray-900 mt-1">
                      {typeof asset.metadata === 'string' ? (
                        <p className="text-xs bg-gray-50 p-2 rounded max-h-24 overflow-y-auto">
                          {asset.metadata}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(asset.metadata).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="text-gray-600">{key}:</span>
                              <span className="text-gray-900">{String(value).slice(0, 20)}...</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {getRobloxAssetId() && (
                <Button variant="outline" onClick={openInRoblox}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Roblox
                </Button>
              )}
              {getRobloxAssetId() && (
                <Button 
                  variant="outline" 
                  onClick={() => fetchThumbnail(getRobloxAssetId()!)}
                  disabled={thumbnailData.loading}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {thumbnailData.loading ? 'Loading...' : 'Refresh Preview'}
                </Button>
              )}
            </div>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 