'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Game } from '@/types/game';
import { MetricsOverview } from '@/components/metrics/MetricsOverview';
import { GameDialog } from '@/components/games/game-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { MMLLogo } from '@/components/ui/mml-logo';

// Add color constants
const COLORS = {
  primary: '#2563eb',    // Blue
  secondary: '#16a34a',  // Green
  accent: '#9333ea',     // Purple
  muted: '#64748b',      // Slate
};

export default function GameDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (params.id) {
      fetchGame();
    }
  }, [params.id]);

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/games/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch game');
      }
      const data = await response.json();
      setGame(data);
    } catch (error) {
      console.error('Error fetching game:', error);
      toast({
        title: "Error",
        description: "Failed to load game",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedGame: Game) => {
    try {
      const response = await fetch(`/api/games/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedGame)
      });

      if (!response.ok) {
        throw new Error('Failed to update game');
      }

      setGame(updatedGame);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Game updated successfully"
      });
    } catch (error) {
      console.error('Error updating game:', error);
      toast({
        title: "Error",
        description: "Failed to update game",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>
        <div className="mt-8 flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>
        <div className="mt-8 flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">Game not found</h2>
          <Button variant="outline" onClick={() => router.push('/dashboard/games')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Link href="/" className="self-start transform hover:scale-105 transition-transform">
        <MMLLogo />
      </Link>

      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard/games')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">{game.name}</h1>
              <p className="text-muted-foreground">{game.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{game.genre}</Badge>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Edit Game
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="roblox">Roblox Data</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: COLORS.primary }}>
              <CardHeader>
                <CardTitle className="text-primary">Basic Information</CardTitle>
                <CardDescription>
                  View your game's basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-foreground">Game Name</h3>
                    <p className="text-muted-foreground">{game.name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Genre</h3>
                    <p className="text-muted-foreground">{game.genre}</p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="font-medium text-foreground">Description</h3>
                    <p className="text-muted-foreground">{game.description}</p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="font-medium text-foreground">Roblox Link</h3>
                    <a 
                      href={game.robloxLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {game.robloxLink}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: COLORS.secondary }}>
              <CardHeader>
                <CardTitle className="text-primary">Owner Information</CardTitle>
                <CardDescription>
                  Game owner details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-foreground">Owner Name</h3>
                    <p className="text-muted-foreground">{game.owner?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Email</h3>
                    <p className="text-muted-foreground">{game.owner?.email || 'Unknown'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Discord ID</h3>
                    <p className="text-muted-foreground">{game.owner?.discordId || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Country</h3>
                    <p className="text-muted-foreground">{game.owner?.country || 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: COLORS.accent }}>
              <CardContent className="pt-6">
                <MetricsOverview gameId={params.id as string} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roblox" className="space-y-4">
            <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: COLORS.primary }}>
              <CardHeader>
                <CardTitle className="text-primary">Roblox Game Information</CardTitle>
                <CardDescription>
                  Live data from Roblox
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {game.robloxInfo ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-foreground">Place ID</h3>
                      <p className="text-muted-foreground">{game.robloxInfo.placeId}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Creator</h3>
                      <p className="text-muted-foreground">
                        {game.robloxInfo.creator?.name} ({game.robloxInfo.creator?.type})
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Current Players</h3>
                      <p className="text-muted-foreground">{game.robloxInfo.stats?.playing || 0}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Total Visits</h3>
                      <p className="text-muted-foreground">{game.robloxInfo.stats?.visits || 0}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Favorites</h3>
                      <p className="text-muted-foreground">{game.robloxInfo.stats?.favorites || 0}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Likes/Dislikes</h3>
                      <p className="text-muted-foreground">
                        👍 {game.robloxInfo.stats?.likes || 0} / 👎 {game.robloxInfo.stats?.dislikes || 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No Roblox data available. Click "Edit Game" to configure Roblox API access.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: COLORS.secondary }}>
              <CardHeader>
                <CardTitle className="text-primary">Media</CardTitle>
                <CardDescription>
                  View your game's media files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {game.media && game.media.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {game.media.map((media) => (
                        <div key={media.id} className="rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-300">
                          {media.thumbnailUrl && (
                            <img
                              src={media.thumbnailUrl}
                              alt={media.title || 'Game media'}
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <div className="p-4">
                            <h4 className="font-medium text-foreground">{media.title || 'Untitled'}</h4>
                            <p className="text-sm text-muted-foreground">{media.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No media files available. Click "Edit Game" to add media.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <GameDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSave}
          initialData={game}
        />
      </div>
    </div>
  );
} 