"use client"

import React, { useState } from 'react';
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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';
import Image from 'next/image';
import { GameDialog } from './game-dialog';

const gameFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  genre: z.string().min(1, "Genre is required"),
  robloxLink: z.string().min(1, "Roblox link is required"),
  thumbnail: z.string().min(1, "Thumbnail is required"),
});

interface GamesClientProps {
  initialGames?: Game[];
}

// Add color constants
const COLORS = {
  primary: '#2563eb',    // Blue
  secondary: '#16a34a',  // Green
  accent: '#9333ea',     // Purple
  destructive: '#dc2626', // Red
  muted: '#64748b',      // Slate
};

export function GamesClient({ initialGames = [] }: GamesClientProps) {
  const [games, setGames] = React.useState<Game[]>(initialGames);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedGenre, setSelectedGenre] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof gameFormSchema>>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      name: "",
      description: "",
      genre: "",
      robloxLink: "",
      thumbnail: "",
    },
  });

  React.useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      setGames(data.games);
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        title: "Error",
        content: "Failed to load games. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof gameFormSchema>) {
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      await fetchGames();
      setShowAddForm(false);
      form.reset();
      toast({
        title: "Success",
        content: "Game created successfully.",
      });
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        content: "Failed to create game. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(gameId: string) {
    if (confirm('Are you sure you want to delete this game?')) {
      try {
        const response = await fetch(`/api/games/${gameId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete game');
        }

        await fetchGames();
        toast({
          title: "Success",
          content: "Game deleted successfully.",
        });
      } catch (error) {
        console.error('Error deleting game:', error);
        toast({
          title: "Error",
          content: "Failed to delete game. Please try again.",
          variant: "destructive",
        });
      }
    }
  }

  const handleViewDetails = (game: Game) => {
    setSelectedGame(game);
    setIsDialogOpen(true);
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || selectedGenre === "all" || game.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

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
          <Image
            src="/MML-logo.png"
            alt="MML Logo"
            width={200}
            height={67}
            className="object-contain"
            priority
            style={{ width: '200px', height: '67px' }}
          />
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

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-sm font-medium mb-2 text-gray-600">Search</h2>
            <Input
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-200 focus:border-primary focus:ring-primary transition-colors"
            />
          </div>
          <div className="w-full md:w-64">
            <h2 className="text-sm font-medium mb-2 text-gray-600">Filter by Genre</h2>
            <Select value={selectedGenre || "all"} onValueChange={setSelectedGenre}>
              <SelectTrigger className="border-gray-200 focus:border-primary focus:ring-primary transition-colors">
                <SelectValue>{selectedGenre || "All Genres"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredGames.map(game => (
            <Card 
              key={game.id}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 overflow-hidden flex flex-col h-[500px]"
              style={{ borderLeftColor: COLORS.primary }}
            >
              <CardHeader className="flex-none">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {game.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1 line-clamp-2">
                      {game.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Genre:</span>
                  <span className="text-sm px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                    {game.genre}
                  </span>
                </div>
                <div className="relative aspect-video rounded-md overflow-hidden">
                  <Image
                    src={game.thumbnail}
                    alt={game.name}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Roblox Link:</span>
                  <Link 
                    href={game.robloxLink} 
                    target="_blank"
                    className="text-primary hover:text-primary/80 transition-colors text-sm underline"
                  >
                    View on Roblox
                  </Link>
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
            setShowAddForm(false);
            form.reset();
            toast({
              title: "Success",
              content: "Game saved successfully.",
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