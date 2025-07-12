"use client"

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Edit, Trash2, Eye, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Asset } from "@/types/asset";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import RobloxAssetPreview from "@/components/display-objects/roblox-asset-preview";
import { AssetDetailsDialog } from './asset-details-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetUploadDialog } from './asset-upload-dialog';
import { Game } from '@/types/game';
import {
  SystemAssetTypes,
  SystemAssetType,
  getRobloxAssetType,
  getValidExtensions
} from '@/types/asset-types';
import { MMLLogo } from "@/components/ui/mml-logo";

interface AssetsClientProps {
  initialAssets?: Asset[];
}

const assetTypes = Object.values(SystemAssetTypes);

const assetFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  assetType: z.string().min(1, "Type is required"),
  creationType: z.enum(["existing", "new"]),
  robloxAssetId: z.string().optional(),
  fbxFile: z.any().optional(),
  tags: z.string().optional(),
});

interface AssetDetailsDialogProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: () => void;
}

export function AssetsClient({ initialAssets = [] }: AssetsClientProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [creationType, setCreationType] = useState<'existing' | 'new'>('existing');
  const { toast } = useToast();
  const router = useRouter();
  const [previewAssetId, setPreviewAssetId] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const form = useForm<z.infer<typeof assetFormSchema>>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      description: '',
      assetType: '',
      creationType: 'new',
      robloxAssetId: '',
      tags: '',
    },
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  // Watch for changes in the Roblox Asset ID field
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'robloxAssetId') {
        setPreviewAssetId(value.robloxAssetId || '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  async function fetchAssets() {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Error loading assets:', error);
      setAssets([]); // Ensure assets is always an array
      toast({
        title: "Error",
        description: "Failed to load assets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  const closeAllDialogs = () => {
    setShowAddForm(false);
    setIsDetailsDialogOpen(false);
    setSelectedAsset(null);
    form.reset();
  };

  const handleAddAsset = async (values: z.infer<typeof assetFormSchema>) => {
    try {
      let robloxAssetId: string;

      if (values.creationType === 'new') {
        // Handle new asset upload
        if (!uploadedFile) {
          toast({
            title: "Error",
            description: "Please select a file to upload",
            variant: "destructive"
          })
          return
        }

        setIsUploading(true);

        // Create FormData for the upload
        const uploadFormData = new FormData();
        uploadFormData.append('file', uploadedFile);
        uploadFormData.append('name', values.name);
        uploadFormData.append('description', values.description);
        uploadFormData.append('assetType', values.assetType);

        console.log('Uploading asset:', {
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          fileSize: uploadedFile.size,
          assetType: values.assetType,
          robloxAssetType: getRobloxAssetType(values.assetType as SystemAssetType)
        });

        const response = await fetch('/api/roblox/upload-asset', {
          method: 'POST',
          body: uploadFormData
        });

        const responseText = await response.text();
        console.log('Upload response:', responseText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = responseText;
          }
          throw new Error(`Failed to upload asset to Roblox: ${JSON.stringify(errorData)}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error('Invalid response from server');
        }

        if (!data.success || !data.assetId) {
          throw new Error(`Upload failed: ${JSON.stringify(data)}`);
        }

        robloxAssetId = data.assetId;
      } else {
        // Handle existing asset
        if (!values.robloxAssetId) {
          toast({
            title: "Error",
            description: "Please enter an existing Roblox asset ID",
            variant: "destructive"
          })
          return
        }
        robloxAssetId = values.robloxAssetId;
      }

      // Create asset in our system
      const assetResponse = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          assetType: values.assetType,
          robloxAssetId: robloxAssetId,
          tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
          metadata: {}
        }),
      });

      if (!assetResponse.ok) {
        throw new Error('Failed to create asset record');
      }

      const savedAsset = await assetResponse.json();
      setAssets(prevAssets => [...(prevAssets || []), savedAsset]);
      
      toast({
        title: "Success",
        description: values.creationType === 'new' 
          ? "Asset uploaded and added successfully"
          : "Asset added successfully"
      });

      setShowAddForm(false);
      form.reset();
      setUploadedFile(null);
      fetchAssets();
    } catch (error) {
      console.error('Error adding asset:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add asset",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }

  const handleDeleteAsset = async (asset: Asset) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      setAssets(assets => (assets || []).filter(a => a.id !== asset.id));
      closeAllDialogs();
      
      toast({
        title: 'Success',
        description: 'Asset deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete asset',
        variant: 'destructive'
      });
    }
  };

  const getTagColor = (tag: string): string => {
    if (tag.includes('game') || tag.includes('interactive')) return 'bg-blue-100 text-blue-800';
    if (tag.includes('marketing') || tag.includes('brand')) return 'bg-purple-100 text-purple-800';
    if (tag.includes('fashion') || tag.includes('clothing')) return 'bg-pink-100 text-pink-800';
    if (tag.includes('music') || tag.includes('audio')) return 'bg-green-100 text-green-800';
    if (tag.includes('tech') || tag.includes('digital')) return 'bg-cyan-100 text-cyan-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredAssets = (assets || [])
    .filter(asset => {
      if (!asset) return false;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (asset.name || '').toLowerCase().includes(searchLower) ||
        (asset.description || '').toLowerCase().includes(searchLower) ||
        (Array.isArray(asset.tags) && asset.tags.some(tag => (tag || '').toLowerCase().includes(searchLower)));
      
      const matchesType = selectedType === "all" || asset.assetType === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Sort by updatedAt in descending order (most recent first)
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

  const handleEditFromDetails = (asset: Asset) => {
    console.log('Editing asset:', asset); // Debug log
    setSelectedAsset(asset);
    setIsDetailsDialogOpen(false);
    
    // Reset form with all asset data
    form.reset({
      name: asset.name || '',
      description: asset.description || '',
      assetType: asset.assetType || asset.type || '',  // Support both fields but prefer assetType
      creationType: "existing",
      robloxAssetId: asset.robloxAssetId || '',
      tags: Array.isArray(asset.tags) ? asset.tags.join(', ') : asset.tags || '',
    });

    // Set preview asset ID if available
    if (asset.robloxAssetId) {
      setPreviewAssetId(asset.robloxAssetId);
    }

    // Open the edit form dialog
    setShowAddForm(true);
  };

  const handleUpdateAsset = async (values: z.infer<typeof assetFormSchema>) => {
    try {
      if (!selectedAsset) {
        toast({
          title: "Error",
          description: "No asset selected for update",
          variant: "destructive"
        });
        return;
      }

      let robloxAssetId = selectedAsset.robloxAssetId;

      // If there's a new file upload, update the asset on Roblox first
      if (uploadedFile) {
        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', uploadedFile);
        uploadFormData.append('name', values.name);
        uploadFormData.append('description', values.description);
        uploadFormData.append('assetType', values.assetType);
        uploadFormData.append('existingAssetId', selectedAsset.robloxAssetId || '');

        console.log('Updating asset on Roblox:', {
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          fileSize: uploadedFile.size,
          assetType: values.assetType,
          robloxAssetType: getRobloxAssetType(values.assetType as SystemAssetType)
        });

        const response = await fetch('/api/roblox/update-asset', {
          method: 'POST',
          body: uploadFormData
        });

        const responseText = await response.text();
        console.log('Roblox update response:', responseText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = responseText;
          }
          throw new Error(`Failed to update asset on Roblox: ${JSON.stringify(errorData)}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error('Invalid response from server');
        }

        if (!data.success || !data.assetId) {
          throw new Error(`Update failed: ${JSON.stringify(data)}`);
        }

        robloxAssetId = data.assetId;
      }

      // Prepare the update data
      const updateData = {
        id: selectedAsset.id,
        name: values.name,
        description: values.description,
        type: values.assetType,
        robloxAssetId: robloxAssetId,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
        lastUpdated: new Date().toISOString()
      };

      // Send PUT request to update our local database
      const response = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update asset in local database');
      }

      // Refresh the assets list
      await fetchAssets();
      
      toast({
        title: "Success",
        description: uploadedFile 
          ? "Asset and file updated successfully"
          : "Asset updated successfully"
      });

      // Close the form and reset state
      setShowAddForm(false);
      setSelectedAsset(null);
      setUploadedFile(null);
      form.reset();
    } catch (error) {
      console.error('Error updating asset:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update asset",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (values: z.infer<typeof assetFormSchema>) => {
    try {
      setIsUploading(true);

      if (selectedAsset) {
        // Edit mode
        const updateData = {
          id: selectedAsset.id,
          name: values.name,
          description: values.description,
          tags: values.tags?.split(',').map(tag => tag.trim()) || [],
          type: values.assetType,
          assetType: getRobloxAssetType(values.assetType as SystemAssetType),
          robloxAssetId: selectedAsset.robloxAssetId,
          lastUpdated: new Date().toISOString()
        };

        if (uploadedFile) {
          // If a new file was uploaded, create a new asset on Roblox
          const robloxFormData = new FormData();
          robloxFormData.append('file', uploadedFile);
          robloxFormData.append('name', updateData.name);
          robloxFormData.append('description', updateData.description);
          robloxFormData.append('assetType', selectedAsset.type);
          robloxFormData.append('existingAssetId', selectedAsset.robloxAssetId || '');

          console.log('Creating new asset version on Roblox:', {
            fileName: uploadedFile.name,
            fileType: uploadedFile.type,
            fileSize: uploadedFile.size,
            assetType: selectedAsset.type,
            robloxAssetType: getRobloxAssetType(selectedAsset.type as SystemAssetType),
            existingAssetId: selectedAsset.robloxAssetId
          });

          const robloxResponse = await fetch('/api/roblox/update-asset', {
            method: 'POST',
            body: robloxFormData
          });

          if (!robloxResponse.ok) {
            const error = await robloxResponse.text();
            throw new Error(`Failed to update asset on Roblox: ${error}`);
          }

          const robloxResult = await robloxResponse.json();
          if (!robloxResult.success) {
            throw new Error(`Failed to update asset on Roblox: ${JSON.stringify(robloxResult)}`);
          }

          // Store the old asset ID before updating
          const oldRobloxAssetId = selectedAsset.robloxAssetId;

          // Update the Roblox asset ID with the new one
          updateData.robloxAssetId = robloxResult.assetId;

          // No need to delete the old asset, it's already marked as removable by the update-asset endpoint
          console.log('Old Roblox asset marked as removable:', oldRobloxAssetId);
        }

        // Update local database
        const response = await fetch(`/api/assets/${selectedAsset.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error('Failed to update asset in local database');
        }

        toast({
          title: "Success",
          description: uploadedFile 
            ? "New asset version created and database updated successfully"
            : "Asset updated successfully"
        });
      } else {
        // Add mode - creating a new asset
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            type: values.assetType,
            assetType: getRobloxAssetType(values.assetType as SystemAssetType),
            robloxAssetId: values.robloxAssetId,
            tags: values.tags?.split(',').map(tag => tag.trim()) || [],
            lastUpdated: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add asset');
        }

        toast({
          title: "Asset Added",
          description: "The new asset has been successfully added to the database.",
        });
      }

      // Reset form and close dialog
      setShowAddForm(false);
      setSelectedAsset(null);
      form.reset();
      
      // Refresh the assets list
      await fetchAssets();
    } catch (error) {
      console.error('Error submitting asset:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit asset",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadComplete = async (assetId: string, assetType: string) => {
    // Refresh the assets list after successful upload
    await fetchAssets();
    toast({
      title: "Success",
      description: `${assetType} asset uploaded successfully with ID: ${assetId}`,
    });
  };

  const getAcceptedFileTypes = (assetType: SystemAssetType | undefined) => {
    if (!assetType) {
      return '*'; // Allow all files if no asset type is selected
    }

    try {
      const extensions = getValidExtensions(assetType);
      if (!Array.isArray(extensions)) {
        console.error('Invalid extensions returned:', extensions);
        return '*';
      }

      // Map file extensions to their corresponding MIME types
      const mimeTypes = new Set<string>();
      extensions.forEach(ext => {
        const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
        // Add both the extension and appropriate MIME type
        switch (cleanExt.toLowerCase()) {
          case '.png':
            mimeTypes.add('image/png');
            break;
          case '.jpg':
          case '.jpeg':
            mimeTypes.add('image/jpeg');
            break;
          case '.gif':
            mimeTypes.add('image/gif');
            break;
          case '.mp3':
            mimeTypes.add('audio/mpeg');
            break;
          case '.wav':
            mimeTypes.add('audio/wav');
            break;
          case '.ogg':
            mimeTypes.add('audio/ogg');
            break;
          case '.mp4':
            mimeTypes.add('video/mp4');
            break;
          case '.webm':
            mimeTypes.add('video/webm');
            break;
          case '.rbxm':
            mimeTypes.add('application/octet-stream');
            break;
          case '.fbx':
            mimeTypes.add('application/octet-stream');
            break;
        }
        mimeTypes.add(cleanExt);
      });
      return Array.from(mimeTypes).join(',');
    } catch (error) {
      console.error('Error getting accepted file types:', error);
      return '*'; // Fallback to all files if there's an error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
            <DialogDescription>
              {selectedAsset ? 'Edit the asset details below.' : 'Add a new asset to your collection.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. game, interactive, brand" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedAsset ? (
                // Edit mode
                <div className="space-y-4">
                  <div>
                    <Label>Current Roblox Asset ID</Label>
                    <div className="text-sm text-muted-foreground mb-2">
                      {selectedAsset.robloxAssetId}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Update File (Optional)</Label>
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFile(file);
                        }
                      }}
                      accept={getAcceptedFileTypes(form.getValues("assetType") as SystemAssetType)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload a new file to update the existing asset on Roblox
                    </p>
                  </div>
                </div>
              ) : (
                // Add mode
                <FormField
                  control={form.control}
                  name="robloxAssetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roblox Asset ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddForm(false);
                  setSelectedAsset(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {selectedAsset ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    selectedAsset ? 'Update Asset' : 'Add Asset'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col space-y-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Asset Manager</h1>
          <div className="flex gap-4">
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {assetTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{asset.name}</CardTitle>
                <CardDescription>{asset.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <div>
                    <Label>Type</Label>
                    <div className="text-sm text-muted-foreground">
                      {asset.assetType ? asset.assetType.charAt(0).toUpperCase() + asset.assetType.slice(1).replace(/_/g, ' ') : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <Label>Roblox Asset ID</Label>
                    <div className="text-sm text-muted-foreground">{asset.robloxAssetId}</div>
                  </div>
                  {Array.isArray(asset.tags) && asset.tags.length > 0 && (
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {asset.tags.map((tag, index) => (
                          <Badge key={index} className={getTagColor(tag)}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedAsset(asset);
                  setIsDetailsDialogOpen(true);
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditFromDetails(asset)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteAsset(asset)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No assets found{searchQuery ? ` matching "${searchQuery}"` : ''}.
          </div>
        )}
      </div>

      <AssetUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadComplete={handleUploadComplete}
      />

      <AssetDetailsDialog
        asset={selectedAsset}
        open={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedAsset(null);
        }}
        onEdit={handleEditFromDetails}
        onDelete={() => selectedAsset && handleDeleteAsset(selectedAsset)}
      />
    </div>
  );
} 