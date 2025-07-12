'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, ExternalLink, Calendar, Users, Heart, Play, Clock, Database, Zap, Shield, Globe, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Game } from '@/types/game';
import { MetricsOverview } from '@/components/metrics/MetricsOverview';
import { GameDialog } from '@/components/games/game-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { MMLLogo } from '@/components/ui/mml-logo';

// Color scheme matching Games Manager
const COLORS = {
  primary: '#2563eb',    // Blue - matching Games Manager
  secondary: '#16a34a',  // Green - matching Games Manager  
  accent: '#9333ea',     // Purple - matching Games Manager
  warning: '#f59e0b',    // Amber
  muted: '#64748b',      // Slate - matching Games Manager
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
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard/games')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>{game.name}</h1>
              <p className="text-muted-foreground">{game.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{game.genre}</Badge>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              style={{ backgroundColor: COLORS.primary }}
              className="hover:opacity-90 text-white"
            >
              Edit Game
            </Button>
          </div>
        </div>

        {/* Roblox Statistics Section */}
        {game.robloxInfo && (
          <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: COLORS.accent }}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.primary }}>Roblox Statistics</CardTitle>
              <CardDescription>Live statistics from Roblox API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{game.robloxInfo.stats?.playing || 0}</div>
                  <div className="text-sm text-blue-600 mt-1">Currently Playing</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{(game.robloxInfo.stats?.visits || 0).toLocaleString()}</div>
                  <div className="text-sm text-green-600 mt-1">Total Visits</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{(game.robloxInfo.stats?.favorites || 0).toLocaleString()}</div>
                  <div className="text-sm text-purple-600 mt-1">Favorites</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">{game.robloxInfo.isActive ? 'Active' : 'Inactive'}</div>
                  <div className="text-sm text-orange-600 mt-1">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="roblox">Roblox Data</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader style={{ backgroundColor: `${COLORS.primary}10` }}>
                <CardTitle style={{ color: COLORS.primary }}>Game Information</CardTitle>
                <CardDescription>Basic game details and genre information</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Game Name</h3>
                    <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{game.name}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Genre</h3>
                    <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{game.genre}</p>
                  </div>
                  {game.robloxInfo?.subgenre && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Subgenre 1</h3>
                      <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{game.robloxInfo.subgenre}</p>
                    </div>
                  )}
                  {game.robloxInfo?.subgenre2 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Subgenre 2</h3>
                      <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{game.robloxInfo.subgenre2}</p>
                    </div>
                  )}
                  {game.robloxInfo?.dates?.created && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Created Date</h3>
                      <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                        {new Date(game.robloxInfo.dates.created).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {game.robloxInfo?.dates?.updated && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Last Updated</h3>
                      <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                        {new Date(game.robloxInfo.dates.updated).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Description</h3>
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-muted-foreground whitespace-pre-wrap">{game.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Owner Section */}
            <Card>
              <CardHeader style={{ backgroundColor: `${COLORS.secondary}10` }}>
                <CardTitle style={{ color: COLORS.secondary }}>Game Owner Information</CardTitle>
                <CardDescription>Contact details and ownership information</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Owner Name</h3>
                    <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{game.owner?.name || 'Unknown'}</p>
                  </div>
                  {game.owner?.robloxId && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Roblox ID</h3>
                      <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{game.owner.robloxId}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{game.owner?.email || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Discord ID</h3>
                    <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{game.owner?.discordId || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Country</h3>
                    <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{game.owner?.country || 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <MetricsOverview gameId={params.id as string} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roblox Data Tab */}
          <TabsContent value="roblox" className="space-y-6">
            {game.robloxInfo ? (
              <>
                {/* Roblox Statistics */}
                <Card>
                  <CardHeader style={{ backgroundColor: `${COLORS.accent}10` }}>
                    <CardTitle style={{ color: COLORS.accent }}>Roblox Statistics</CardTitle>
                    <CardDescription>Live player statistics and engagement metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="w-12 h-12 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-blue-700">{game.robloxInfo.stats?.playing || 0}</div>
                        <div className="text-sm text-blue-600 mt-1">Currently Playing</div>
                      </div>
                      <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{(game.robloxInfo.stats?.visits || 0).toLocaleString()}</div>
                        <div className="text-sm text-green-600 mt-1">Total Visits</div>
                      </div>
                      <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
                        <div className="w-12 h-12 mx-auto mb-3 bg-purple-500 rounded-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-purple-700">{(game.robloxInfo.stats?.favorites || 0).toLocaleString()}</div>
                        <div className="text-sm text-purple-600 mt-1">Favorites</div>
                      </div>
                      <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="w-12 h-12 mx-auto mb-3 bg-orange-500 rounded-full flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{game.robloxInfo.isActive ? 'Active' : 'Inactive'}</div>
                        <div className="text-sm text-orange-600 mt-1">Status</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Details */}
                <Card>
                  <CardHeader style={{ backgroundColor: `${COLORS.primary}10` }}>
                    <CardTitle style={{ color: COLORS.primary }}>Game Details</CardTitle>
                    <CardDescription>Technical information and creator details</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">Universe ID</h3>
                        <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg font-mono">{game.robloxInfo.universeId}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">Place ID</h3>
                        <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg font-mono">{game.robloxInfo.placeId || 'Not available'}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">Creator</h3>
                        <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                          {game.robloxInfo.creator?.name} ({game.robloxInfo.creator?.type})
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">Creator ID</h3>
                        <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg font-mono">{game.robloxInfo.creator?.id}</p>
                      </div>
                      {game.robloxInfo.dates?.created && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-foreground">Created Date</h3>
                          <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                            {new Date(game.robloxInfo.dates.created).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {game.robloxInfo.dates?.updated && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-foreground">Last Updated</h3>
                          <p className="text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                            {new Date(game.robloxInfo.dates.updated).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Database className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">No Roblox Data Available</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Click "Edit Game" to configure Roblox API access and fetch live game data.
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                      Configure Roblox API
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader style={{ backgroundColor: `${COLORS.warning}10` }}>
                <CardTitle style={{ color: COLORS.warning }}>Media Files</CardTitle>
                <CardDescription>View images from Roblox and uploaded media files</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  {/* Roblox Images Section */}
                  {game.robloxInfo?.images && game.robloxInfo.images.length > 0 && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Roblox Images</h4>
                        <p className="text-sm text-muted-foreground mb-6">
                          Images automatically fetched from Roblox API
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {game.robloxInfo.images.map((image: any) => (
                            <div key={image.id} className="group rounded-xl border overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                                <img
                                  src={image.url}
                                  alt={image.title || 'Game image'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                  }}
                                />
                              </div>
                              <div className="p-4">
                                <h4 className="font-medium text-sm text-gray-900">{image.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {image.state} • Target ID: {image.targetId}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Media Files */}
                  {game.media && game.media.length > 0 && (
                    <div className="space-y-6">
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Uploaded Media Files</h4>
                        <p className="text-sm text-muted-foreground mb-6">
                          Media files uploaded manually
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {game.media.map((media) => (
                            <div key={media.id} className="group rounded-xl border overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
                              {media.thumbnailUrl && (
                                <div className="aspect-video overflow-hidden">
                                  <img
                                    src={media.thumbnailUrl}
                                    alt={media.title || 'Game media'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className="p-4">
                                <h4 className="font-medium text-foreground">{media.title || 'Untitled'}</h4>
                                <p className="text-sm text-muted-foreground">{media.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Media Message */}
                  {(!game.robloxInfo?.images || game.robloxInfo.images.length === 0) && 
                   (!game.media || game.media.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Database className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Media Files Available</h3>
                      <p className="text-muted-foreground mb-4">
                        Click "Edit Game" to configure Roblox API or upload media files.
                      </p>
                      <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                        Add Media
                      </Button>
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