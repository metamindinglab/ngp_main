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

interface AssetsClientProps {
  initialAssets?: Asset[];
}

const assetTypes = [
  'kol_character',
  'clothing',
  'minigame',
  'hat',
  'animation',
  'image',
  'audio',
  'video',
  'shoes'
];

const assetFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  assetType: z.string().min(1, "Type is required"),
  robloxAssetId: z.string().min(1, "Roblox ID is required"),
  tags: z.string().optional(),
});

export function AssetsClient({ initialAssets = [] }: AssetsClientProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof assetFormSchema>>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: "",
      description: "",
      assetType: "",
      robloxAssetId: "",
      tags: "",
    },
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      setAssets(data.assets);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast({
        title: "Error",
        content: "Failed to load assets. Please try again.",
        variant: "destructive",
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

  async function onSubmit(values: z.infer<typeof assetFormSchema>) {
    try {
      const isEditing = selectedAsset !== null;
      const url = isEditing ? `/api/assets/${selectedAsset.id}` : '/api/assets';
      const method = isEditing ? 'PUT' : 'POST';

      const formattedValues = {
        ...values,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });

      if (!response.ok) {
        throw new Error(isEditing ? 'Failed to update asset' : 'Failed to create asset');
      }

      const savedAsset = await response.json();
      
      if (isEditing) {
        setAssets(assets => assets.map(a => a.id === selectedAsset.id ? savedAsset : a));
      } else {
        setAssets(assets => [...assets, savedAsset]);
      }

      closeAllDialogs();
      
      toast({
        title: "Success",
        content: isEditing ? "Asset updated successfully." : "Asset created successfully.",
      });
    } catch (error) {
      console.error('Error saving asset:', error);
      toast({
        title: "Error",
        content: `Failed to ${selectedAsset ? 'update' : 'create'} asset. Please try again.`,
        variant: "destructive",
      });
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

      setAssets(assets => assets.filter(a => a.id !== asset.id));
      closeAllDialogs();
      
      toast({
        title: 'Success',
        content: 'Asset deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: 'Error',
        content: 'Failed to delete asset',
        variant: 'destructive',
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

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesType = selectedType === "all" || asset.assetType === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header with Logo */}
        <div className="flex flex-col space-y-6">
          <Link href="/" className="self-start transform hover:scale-105 transition-transform">
            <Image
              src="/MML-logo.png"
              alt="MML Logo"
              width={126}
              height={42}
              className="object-contain"
              priority
              style={{ width: 'auto', height: 'auto' }}
            />
          </Link>

          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Assets Manager</h1>
            <Dialog open={showAddForm} onOpenChange={(open) => {
              if (!open) closeAllDialogs();
              setShowAddForm(open);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={closeAllDialogs}
                >
                  <X className="h-4 w-4" />
                </Button>
                <DialogHeader>
                  <DialogTitle>{selectedAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
                  <DialogDescription>
                    {selectedAsset ? 'Edit the asset details below.' : 'Create a new asset by filling out the form below.'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
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
                              <FormLabel>Type</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {assetTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                      {type}
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
                          name="robloxAssetId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Roblox ID</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g. game, interactive, clothing" />
                              </FormControl>
                              <FormDescription>
                                Separate tags with commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {selectedAsset && selectedAsset.robloxAssetId && (
                        <div className="border rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-2">Roblox Asset Preview</h3>
                          <RobloxAssetPreview assetId={selectedAsset.robloxAssetId} height="256px" />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit">
                        {selectedAsset ? 'Save Changes' : 'Create Asset'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {assetTypes.map(type => (
                    <SelectItem key={`type-${type}`} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader>
                <CardTitle>{asset.name}</CardTitle>
                <CardDescription>{asset.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Type:</span> {asset.assetType}
                  </div>
                  <div>
                    <span className="font-medium">Roblox ID:</span> {asset.robloxAssetId}
                  </div>
                  {asset.tags && (
                    <div>
                      <span className="font-medium">Tags:</span> {Array.isArray(asset.tags) ? asset.tags.join(', ') : asset.tags}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setIsDetailsDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAsset(asset);
                    form.reset({
                      name: asset.name,
                      description: asset.description || '',
                      assetType: asset.assetType,
                      robloxAssetId: asset.robloxAssetId,
                      tags: Array.isArray(asset.tags) ? asset.tags.join(', ') : asset.tags || '',
                    });
                    setShowAddForm(true);
                  }}
                  data-asset-id={asset.id}
                >
                  <Edit className="h-4 w-4 mr-1 edit-icon" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAsset(asset)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <AssetDetailsDialog
        asset={selectedAsset}
        open={isDetailsDialogOpen}
        onClose={closeAllDialogs}
        onEdit={() => {
          setIsDetailsDialogOpen(false);
          form.reset({
            name: selectedAsset!.name,
            description: selectedAsset!.description || '',
            assetType: selectedAsset!.assetType,
            robloxAssetId: selectedAsset!.robloxAssetId,
            tags: Array.isArray(selectedAsset!.tags) ? selectedAsset!.tags.join(', ') : selectedAsset!.tags || '',
          });
          setShowAddForm(true);
        }}
        onDelete={() => handleDeleteAsset(selectedAsset!)}
      />
    </div>
  );
} 