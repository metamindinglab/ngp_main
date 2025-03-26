"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function GamesClient({ initialGames = [] }: GamesClientProps) {
  const [games, setGames] = React.useState<Game[]>(initialGames);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedGenre, setSelectedGenre] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Games</h1>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>Add Game</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Game</DialogTitle>
              <DialogDescription>
                Create a new game by filling out the form below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="robloxLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roblox Link</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Create Game</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-[200px]">
          <Label htmlFor="genre">Filter by Genre</Label>
          <Select value={selectedGenre || "all"} onValueChange={setSelectedGenre}>
            <SelectTrigger>
              <SelectValue placeholder="All Genres" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map(game => (
          <Card key={game.id}>
            <CardHeader>
              <CardTitle>{game.name}</CardTitle>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Genre:</span> {game.genre}
                </div>
                <div>
                  <span className="font-medium">Roblox Link:</span>{" "}
                  <a
                    href={game.robloxLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View on Roblox
                  </a>
                </div>
                {game.thumbnail && (
                  <div>
                    <img
                      src={game.thumbnail}
                      alt={game.name}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(game.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 