'use client'

import React from "react"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GameAd, GAME_AD_TEMPLATES } from '@/types/gameAd'
import { GameAdDialog } from './game-ad-dialog'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from 'next/link'
import Image from 'next/image'
import { v4 as uuidv4 } from 'uuid'
import { MMLLogo } from "@/components/ui/mml-logo"

// Add color constants
const COLORS = {
  primary: '#2563eb',    // Blue
  secondary: '#16a34a',  // Green
  accent: '#9333ea',     // Purple
  destructive: '#dc2626', // Red
  muted: '#64748b',      // Slate
};

export function GameAdsManager() {
  const router = useRouter()
  const [gameAds, setGameAds] = useState<GameAd[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<GameAd | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  const [newGameAd, setNewGameAd] = useState({
    name: "",
    description: "",
    type: "",
    url: "",
  })
  const { toast } = useToast()

  // Load game ads with pagination
  useEffect(() => {
    let isMounted = true;
    let debounceTimer: NodeJS.Timeout;

    const loadGameAds = async () => {
      try {
        // Set loading state only on initial load or search
        if (!hasInitialLoad || searchTerm) {
          setIsLoading(true);
        }
        
        setError(null);
        const queryParams = new URLSearchParams({
          page: '1',
          search: searchTerm
        });
        
        const response = await fetch(`/api/game-ads?${queryParams}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load game ads: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          if (Array.isArray(data.gameAds)) {
            setGameAds(data.gameAds);
            setTotalPages(data.totalPages || 1);
            setHasInitialLoad(true);
          } else {
            throw new Error('Invalid response format from server');
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading game ads:', error);
          setError('Failed to load game ads. Please try again.');
          toast({
            title: "Error",
            description: "Failed to load game ads. Please try again.",
            variant: "destructive"
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsFetchingMore(false);
        }
      }
    };

    // Only load on initial mount or search term change
    if (!hasInitialLoad || searchTerm) {
      debounceTimer = setTimeout(loadGameAds, searchTerm ? 300 : 0);
    }

    return () => {
      isMounted = false;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchTerm, toast, hasInitialLoad]);

  // Load more game ads when scrolling
  const loadMoreAds = async () => {
    if (isFetchingMore || page >= totalPages) return;

    try {
      setIsFetchingMore(true);
      const nextPage = page + 1;
      const queryParams = new URLSearchParams({
        page: nextPage.toString(),
        search: searchTerm
      });

      const response = await fetch(`/api/game-ads?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load more game ads: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data.gameAds)) {
        setGameAds(prev => [...prev, ...data.gameAds]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more game ads:', error);
      toast({
        title: "Error",
        description: "Failed to load more game ads. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Handle infinite scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const scrollThreshold = document.documentElement.scrollHeight - 1000;

        if (
          scrollPosition >= scrollThreshold &&
          !isLoading &&
          !isFetchingMore &&
          page < totalPages
        ) {
          loadMoreAds();
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isLoading, isFetchingMore, page, totalPages, searchTerm]);

  // Reset state when search term changes
  useEffect(() => {
    setPage(1);
    setHasInitialLoad(false);
  }, [searchTerm]);

  const handleDeleteAd = async (adId: string) => {
    if (confirm('Are you sure you want to delete this game ad?')) {
      try {
        const response = await fetch(`/api/game-ads/${adId}`, { method: 'DELETE' })
        if (!response.ok) {
          throw new Error('Failed to delete game ad')
        }
        setGameAds(gameAds.filter(ad => ad.id !== adId))
        toast({
          title: "Success",
          description: "Game ad deleted successfully."
        })
      } catch (error) {
        console.error('Error deleting game ad:', error)
        toast({
          title: "Error",
          description: "Failed to delete game ad. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const filteredAds = gameAds.filter(ad => 
    ad.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateGameAd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/game-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGameAd),
      })

      if (!response.ok) {
        throw new Error('Failed to create game ad')
      }

      const data = await response.json()
      setGameAds((prev) => [...prev, data])
      setNewGameAd({
        name: "",
        description: "",
        type: "",
        url: "",
      })
      toast({
        title: "Success",
        description: "Game ad created successfully"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create game ad. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-muted-foreground">Loading game ads...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>Game Ads Manager</h1>
          <Input
            placeholder="Search ads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border-gray-200 focus:border-primary focus:ring-primary transition-colors"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold" style={{ color: COLORS.accent }}>Ad Templates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAME_AD_TEMPLATES.map(template => (
              <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4" style={{ borderLeftColor: COLORS.primary }}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">{template.name}</CardTitle>
                  <CardDescription className="text-gray-600">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="relative overflow-hidden rounded-md group">
                  <Image
                    src={template.thumbnail}
                    alt={template.name}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
                    style={{ width: '100%', height: '192px' }}
                  />
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:scale-[1.02]"
                    onClick={() => {
                      setSelectedAd({
                        id: '',
                        name: '',
                        templateType: template.id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        assets: template.requiredAssetTypes.map(assetType => ({
                          assetType,
                          assetId: '',
                          robloxAssetId: ''
                        })),
                      })
                      setIsDialogOpen(true)
                    }}
                  >
                    Create New Ad
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <h2 className="text-2xl font-semibold mt-8" style={{ color: COLORS.secondary }}>Your Game Ads</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map(ad => (
              <Card key={ad.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4" style={{ borderLeftColor: COLORS.primary }}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">{ad.name}</CardTitle>
                  <CardDescription className="text-gray-600">Template: {GAME_AD_TEMPLATES.find(t => t.id === ad.templateType)?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">{new Date(ad.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-gray-900">{new Date(ad.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 hover:scale-105"
                    onClick={() => {
                      setSelectedAd(ad)
                      setIsDialogOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="border-2 border-destructive bg-white text-destructive hover:bg-destructive hover:text-white transition-all duration-300 hover:scale-105"
                    onClick={() => handleDeleteAd(ad.id)}
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {isFetchingMore && (
          <div className="flex justify-center py-4">
            <div className="text-lg text-muted-foreground">Loading more...</div>
          </div>
        )}

        {!isLoading && !isFetchingMore && gameAds.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No game ads found{searchTerm ? ` matching "${searchTerm}"` : ''}.
          </div>
        )}
      </div>

      <GameAdDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedAd(null)
        }}
        initialData={selectedAd}
        onSave={async (adData) => {
          try {
            const method = selectedAd?.id ? 'PUT' : 'POST'
            const url = selectedAd?.id ? `/api/game-ads/${selectedAd.id}` : '/api/game-ads'
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(adData)
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Failed to save game ad')
            }

            const savedAd = await response.json()
            
            if (selectedAd?.id) {
              setGameAds(ads => ads.map(ad => ad.id === selectedAd.id ? savedAd : ad))
            } else {
              setGameAds(ads => [...ads, savedAd])
            }
            
            setIsDialogOpen(false)
            setSelectedAd(null)
            toast({
              title: "Success",
              description: "Game ad saved successfully."
            })
          } catch (error) {
            console.error('Error saving game ad:', error)
            toast({
              title: "Error",
              description: "Failed to save game ad. Please try again.",
              variant: "destructive"
            })
          }
        }}
      />
    </div>
  )
} 