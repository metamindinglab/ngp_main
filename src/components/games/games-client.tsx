"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Game } from "@/types/game";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Eye, EyeOff, Copy, Key, RefreshCw, Cloud, Server } from "lucide-react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';
import Image from 'next/image';
import { GameDialog } from './game-dialog';
import { MMLLogo } from "@/components/ui/mml-logo";
import { Badge } from "@/components/ui/badge";

// Add color constants
const COLORS = {
  primary: '#2563eb',    // Blue
  secondary: '#16a34a',  // Green
  accent: '#9333ea',     // Purple
  destructive: '#dc2626', // Red
  muted: '#64748b',      // Slate
};

const gameFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  genre: z.string().min(1, "Genre is required"),
  robloxLink: z.string().min(1, "Roblox link is required"),
  thumbnail: z.string().min(1, "Thumbnail is required"),
  metrics: z.object({
    dau: z.number().default(0),
    mau: z.number().default(0),
    day1Retention: z.number().default(0),
    topGeographicPlayers: z.array(z.object({
      country: z.string(),
      percentage: z.number()
    })).default([])
  }).default({}),
  dates: z.object({
    created: z.string().default(() => new Date().toISOString()),
    lastUpdated: z.string().default(() => new Date().toISOString()),
    mgnJoined: z.string().default(() => new Date().toISOString()),
    lastRobloxSync: z.string().optional()
  }).default({}),
  owner: z.object({
    name: z.string().default(''),
    discordId: z.string().default(''),
    email: z.string().default(''),
    country: z.string().default('')
  }).default({}),
  authorization: z.object({
    type: z.enum(['api_key', 'oauth']).default('api_key'),
    apiKey: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    lastVerified: z.string().optional(),
    status: z.enum(['active', 'expired', 'invalid', 'unverified']).default('unverified')
  }).default({})
});

// Enhanced Game interface with API key fields
interface EnhancedGame extends Game {
  // Note: Using the new serverApiKey fields from updated schema
}

interface GamesClientProps {
  initialGames?: EnhancedGame[];
}

export function GamesClient({ initialGames = [] }: GamesClientProps) {
  const [games, setGames] = React.useState<EnhancedGame[]>(initialGames);
  const [filteredGames, setFilteredGames] = React.useState<EnhancedGame[]>(initialGames);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedGenre, setSelectedGenre] = React.useState<string>('_all');
  const [loading, setLoading] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingGame, setEditingGame] = React.useState<EnhancedGame | null>(null);
  const [selectedGame, setSelectedGame] = React.useState<EnhancedGame | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({});
  const [generatingApiKey, setGeneratingApiKey] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<z.infer<typeof gameFormSchema>>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      name: "",
      description: "",
      genre: "",
      robloxLink: "",
      thumbnail: "",
      metrics: {
        dau: 0,
        mau: 0,
        day1Retention: 0,
        topGeographicPlayers: []
      },
      dates: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        mgnJoined: new Date().toISOString()
      },
      owner: {
        name: '',
        discordId: '',
        email: '',
        country: ''
      },
      authorization: {
        type: 'api_key',
        status: 'unverified'
      }
    }
  });

  React.useEffect(() => {
    fetchGames();
  }, []);

  React.useEffect(() => {
    let filtered = games;
    
    if (searchTerm) {
      filtered = filtered.filter(game => 
        game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedGenre && selectedGenre !== '_all') {
      filtered = filtered.filter(game => game.genre === selectedGenre);
    }
    
    setFilteredGames(filtered);
  }, [searchTerm, selectedGenre, games]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/games');
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      setGames(data.games);
      setFilteredGames(data.games);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast({
        title: "Error",
        description: "Failed to fetch games.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete game');
      
      await fetchGames();
      toast({
        title: "Success",
        description: "Game deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting game:', error);
      toast({
        title: "Error",
        description: "Failed to delete game.",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (game: EnhancedGame) => {
    setSelectedGame(game);
    setIsDialogOpen(true);
  };

  const handleGenerateApiKey = async (gameId: string) => {
    setGeneratingApiKey(gameId);
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate API key');
      }
      
      const updatedGame = await response.json();
      
      // Update the games list with the new API key
      setGames(games.map(game => 
        game.id === gameId ? { ...game, ...updatedGame } : game
      ));
      
      toast({
        title: "Success",
        description: "API key generated successfully",
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive"
      });
    } finally {
      setGeneratingApiKey(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "API key copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const toggleApiKeyVisibility = (gameId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
  };

  const getApiKeyStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="secondary">Not Generated</Badge>;
    }
  };

  const genres = Array.from(new Set(games.map(game => game.genre)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>Games</h1>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:scale-[1.02]"
            onClick={() => {
              setSelectedGame(null);
              setIsDialogOpen(true);
            }}
          >
            Add Game
          </Button>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm border-2 border-gray-300 focus:border-primary transition-colors"
          />
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-[200px] border-2 border-gray-300">
              <SelectValue placeholder="Filter by genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Genres</SelectItem>
              {genres.map(genre => (
                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map(game => (
            <Card key={game.id} className="hover:shadow-lg transition-shadow duration-300 border-2 border-gray-200 hover:border-primary/30 flex flex-col">
              <CardHeader className="flex-none">
                <div className="aspect-video relative mb-4 overflow-hidden rounded-lg">
                  {game.thumbnail ? (
                    <Image
                      src={game.thumbnail}
                      alt={game.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No thumbnail</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg" style={{ color: COLORS.primary }}>{game.name}</CardTitle>
                <CardDescription className="line-clamp-2">{game.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" style={{ borderColor: COLORS.accent, color: COLORS.accent }}>
                      {game.genre}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DAU:</span>
                      <span className="font-medium">{game.metrics?.dau?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MAU:</span>
                      <span className="font-medium">{game.metrics?.mau?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retention:</span>
                      <span className="font-medium">{game.metrics?.day1Retention || 0}%</span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="text-muted-foreground">Owner: {game.owner?.name || 'Unknown'}</div>
                    <div className="text-muted-foreground">Country: {game.owner?.country || 'Unknown'}</div>
                  </div>

                  {/* API Key Management Section */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        <span className="text-sm font-medium">API Access for MML Game Network</span>
                      </div>
                      {getApiKeyStatusBadge(game.serverApiKeyStatus)}
                    </div>
                    
                    {game.serverApiKey ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <Input
                              type={showApiKeys[game.id] ? "text" : "password"}
                              value={game.serverApiKey}
                              readOnly
                              className="text-xs font-mono pr-16"
                            />
                            <div className="absolute right-1 top-1 flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleApiKeyVisibility(game.id)}
                              >
                                {showApiKeys[game.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(game.serverApiKey!)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {game.serverApiKeyCreatedAt && (
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(game.serverApiKeyCreatedAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleGenerateApiKey(game.id)}
                          disabled={generatingApiKey === game.id}
                        >
                          {generatingApiKey === game.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Regenerate Key
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleGenerateApiKey(game.id)}
                        disabled={generatingApiKey === game.id}
                      >
                        {generatingApiKey === game.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Key className="w-3 h-3 mr-1" />
                            Generate API Key
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between gap-2 flex-none mt-auto">
                <Button
                  variant="outline"
                  onClick={() => handleViewDetails(game)}
                  className="border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 hover:scale-105"
                >
                  View Details
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(game.id)}
                  className="border-2 border-destructive bg-white text-destructive hover:bg-destructive hover:text-white transition-all duration-300 hover:scale-105"
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <GameDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedGame(null);
        }}
        onSave={async (gameData) => {
          try {
            const method = selectedGame ? 'PUT' : 'POST';
            const url = selectedGame ? `/api/games/${selectedGame.id}` : '/api/games';
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(gameData)
            });

            if (!response.ok) {
              throw new Error('Failed to save game');
            }

            const savedGame = await response.json();
            await fetchGames();
            toast({
              title: "Success",
              description: "Game saved successfully."
            });
            return savedGame;
          } catch (error) {
            console.error('Error saving game:', error);
            throw error;
          }
        }}
        initialData={selectedGame}
      />
    </div>
  );
} 