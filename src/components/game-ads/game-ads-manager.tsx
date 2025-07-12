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
import { GameAd, GAME_AD_TEMPLATES, GameAdTemplate } from '@/types/gameAd'
import { GameAdDialog } from './game-ad-dialog'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from 'next/link'
import Image from 'next/image'
import { v4 as uuidv4 } from 'uuid'
import { MMLLogo } from "@/components/ui/mml-logo"
import { Badge } from "@/components/ui/badge"

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

  const fetchGameAds = async () => {
    try {
      const response = await fetch('/api/game-ads')
      if (!response.ok) {
        throw new Error('Failed to fetch game ads')
      }
      const data = await response.json()
      setGameAds(data.gameAds || [])
    } catch (error) {
      console.error('Error fetching game ads:', error)
      toast({
        title: "Error",
        description: "Failed to fetch game ads",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchGameAds()
  }, [])

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
            description: "Failed to load game ads",
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

  const handleEdit = (ad: GameAd) => {
    setSelectedAd(ad)
    setIsDialogOpen(true)
  }

  const handleSave = async (data: GameAd) => {
    try {
      setIsCreating(true)
      
      // Prepare the data for the API
      const apiData = {
        name: data.name,
        type: data.type,
        assets: data.assets,
        gameIds: data.games.map(g => g.id)
      }

      const response = await fetch(data.id ? `/api/game-ads/${data.id}` : '/api/game-ads', {
        method: data.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save game ad')
      }

      await fetchGameAds()
      setIsDialogOpen(false)
      setSelectedAd(null)
      toast({
        title: "Success",
        description: data.id ? "Game ad updated successfully" : "Game ad created successfully",
      })
    } catch (error) {
      console.error('Error saving game ad:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save game ad",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (ad: GameAd) => {
    if (!confirm('Are you sure you want to delete this game ad?')) {
      return
    }

    try {
      const response = await fetch(`/api/game-ads/${ad.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete game ad')
      }

      await fetchGameAds()
      toast({
        title: "Success",
        description: "Game ad deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting game ad:', error)
      toast({
        title: "Error",
        description: "Failed to delete game ad",
        variant: "destructive"
      })
    }
  }

  const filteredAds = Array.isArray(gameAds) ? gameAds.filter(ad => 
    ad.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

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

  const handleTemplateClick = (template: GameAdTemplate) => {
    const newAd: GameAd = {
      id: '',
      name: '',
      type: template.id,
      assets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      games: [],
      performance: [],
      containers: []
    }
    setSelectedAd(newAd)
    setIsDialogOpen(true)
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Game Ads Manager</h1>
        <div className="flex gap-4">
          <Input
            placeholder="Search ads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Ad Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GAME_AD_TEMPLATES.map(template => (
              <Card key={template.id} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="aspect-video relative mb-4">
                    <Image
                      src={template.thumbnail}
                      alt={template.name}
                      fill
                      className="object-cover rounded-md"
                      priority
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                  <p className="text-muted-foreground mb-4">{template.description}</p>
                  <Button
                    className="w-full"
                    onClick={() => handleTemplateClick(template)}
                  >
                    Create New Ad
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Game Ads</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">Loading game ads...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-red-500">{error}</div>
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">
                {searchTerm ? `No game ads found matching "${searchTerm}"` : 'No game ads found'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredAds.map(ad => (
                <Card key={ad.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{ad.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Template: {GAME_AD_TEMPLATES.find(t => t.id === ad.type)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Created: {new Date(ad.createdAt).toLocaleDateString()}</p>
                      <p>Last Updated: {new Date(ad.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(ad)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(ad)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <GameAdDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedAd(null)
        }}
        initialData={selectedAd}
        onSave={handleSave}
      />
    </div>
  )
} 