import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  SystemAssetTypes, 
  SystemAssetType, 
  getValidExtensions,
  getRobloxAssetType
} from '@/types/asset-types'
import { Textarea } from "@/components/ui/textarea"

interface AssetUploadDialogProps {
  open: boolean
  onClose: () => void
  onUploadComplete: (assetId: string, assetType: SystemAssetType) => void
}

export function AssetUploadDialog({ open, onClose, onUploadComplete }: AssetUploadDialogProps) {
  const [selectedType, setSelectedType] = useState<SystemAssetType>('Animation')
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [existingAssetId, setExistingAssetId] = useState('')
  const [preview, setPreview] = useState<any | null>(null)
  const [tags, setTags] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Use filename as default name if not set
      if (!name) {
        setName(selectedFile.name.split('.')[0])
      }
    }
  }

  const handleUpload = async () => {
    if (!name || !description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)

      if (existingAssetId) {
        // Add existing asset to our database
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
            type: selectedType,
            robloxAssetId: existingAssetId,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
          })
        })

        if (!response.ok) {
          throw new Error('Failed to add existing asset')
        }

        const data = await response.json()
        toast({
          title: "Success",
          description: "Existing asset added successfully"
        })
        onUploadComplete(data.asset.id, selectedType)
        handleClose()
        return
      }

      if (!file) {
        toast({
          title: "Error",
          description: "Please select a file to upload",
          variant: "destructive"
        })
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      formData.append('description', description)
      formData.append('systemAssetType', selectedType)
      formData.append('robloxAssetType', getRobloxAssetType(selectedType))

      console.log('Sending upload request:', {
        file: file.name,
        systemAssetType: selectedType,
        robloxAssetType: getRobloxAssetType(selectedType)
      });

      const response = await fetch('/api/roblox/upload-asset', {
        method: 'POST',
        body: formData
      })

      const responseText = await response.text()
      console.log('Upload response:', responseText)

      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = responseText
        }
        throw new Error(`Failed to upload asset: ${JSON.stringify(errorData)}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error('Invalid response from server')
      }

      if (data.success) {
        // Add the asset to our local database
        const localAssetResponse = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
            type: selectedType,
            robloxAssetId: data.assetId,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            assetType: selectedType
          })
        });

        if (!localAssetResponse.ok) {
          throw new Error('Failed to add asset to local database');
        }

        const localAssetData = await localAssetResponse.json();
        
        toast({
          title: "Success",
          description: "Asset uploaded successfully"
        });
        onUploadComplete(localAssetData.asset.id, selectedType);
        handleClose();
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading asset:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload asset. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setName('')
    setDescription('')
    setExistingAssetId('')
    setTags('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const getAcceptedFileTypes = (type: SystemAssetType) => {
    const extensions = getValidExtensions(type);
    return extensions.join(',');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const validExtensions = getValidExtensions(selectedType);
    
    if (!validExtensions.includes(extension)) {
      toast({
        title: 'Invalid file type',
        description: `Please upload a file with one of these extensions: ${validExtensions.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
          <DialogDescription>Upload a new asset or add an existing Roblox asset to your database.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload New Asset</TabsTrigger>
            <TabsTrigger value="existing">Add Existing Asset</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={selectedType} onValueChange={(value: SystemAssetType) => setSelectedType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SystemAssetTypes).map(([key, value]) => (
                      <SelectItem key={value} value={value}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  Will be uploaded as {getRobloxAssetType(selectedType)} to Roblox
                </div>
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Asset name"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Asset description"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div className="space-y-2">
                <Label>File ({getAcceptedFileTypes(selectedType)})</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept={getAcceptedFileTypes(selectedType)}
                />
              </div>

              {file && (
                <div className="text-sm text-muted-foreground">
                  Selected file: {file.name}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="existing" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={selectedType} onValueChange={(value: SystemAssetType) => setSelectedType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SystemAssetTypes).map(([key, value]) => (
                      <SelectItem key={value} value={value}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Roblox Asset ID</Label>
                <Input
                  value={existingAssetId}
                  onChange={async (e) => {
                    const v = e.target.value
                    setExistingAssetId(v)
                    if (v && /^\d+$/.test(v)) {
                      try {
                        const r = await fetch(`/api/roblox/assets/${v}`)
                        const data = await r.json()
                        if (data?.success) setPreview(data.preview)
                        else setPreview(null)
                      } catch {
                        setPreview(null)
                      }
                    } else {
                      setPreview(null)
                    }
                  }}
                  placeholder="Enter Roblox Asset ID"
                />
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Asset name"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Asset description"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter tags separated by commas"
                />
              </div>
              {preview && (
                <div className="flex items-center gap-4 p-3 rounded-md border">
                  <img src={preview.thumbnail} alt="preview" width={72} height={72} style={{ borderRadius: 8 }} />
                  <div className="text-sm">
                    <div className="font-medium">{preview.name}</div>
                    <div className="text-muted-foreground">{preview.robloxType} {preview.robloxSubtype ? `• ${preview.robloxSubtype}` : ''}</div>
                    <div className="text-muted-foreground">{preview.canonicalType}</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={(!file && !existingAssetId) || !name || !description || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {existingAssetId ? (
                  <Plus className="mr-2 h-4 w-4" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {existingAssetId ? 'Add Asset' : 'Upload'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 