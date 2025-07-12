"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Game } from '@/types/game';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Plus } from 'lucide-react';
import { GameDialog } from './game-dialog';

// Add color constants
const COLORS = {
  primary: '#2563eb',    // Blue
  secondary: '#16a34a',  // Green
  accent: '#9333ea',     // Purple
  muted: '#64748b',      // Slate
};

interface GamesClientProps {
  initialGames: Game[];
  onGameUpdated?: () => void;
}

interface MetricData {
  date: string;
  value: number;
}

interface GameMetricsResponse {
  metrics: {
    dailyActiveUsers: MetricData[];
    monthlyActiveUsers: MetricData[];
    d1Retention: MetricData[];
  };
}

export function GamesClient({ initialGames = [], onGameUpdated }: GamesClientProps) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [metricsData, setMetricsData] = useState<Record<string, GameMetricsResponse>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch latest metrics for each game
  const fetchLatestMetrics = async (gameId: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}/metrics`);

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetricsData(prev => ({
        ...prev,
        [gameId]: data
      }));
    } catch (error) {
      console.error('Error fetching metrics for game:', gameId, error);
    }
  };

  useEffect(() => {
    setGames(initialGames);
    // Fetch metrics for all games
    initialGames.forEach(game => {
      fetchLatestMetrics(game.id);
    });
  }, [initialGames]);

  // Get latest metric value
  const getLatestMetric = (gameId: string, metricType: keyof GameMetricsResponse['metrics']) => {
    const gameMetrics = metricsData[gameId]?.metrics[metricType];
    if (!gameMetrics || gameMetrics.length === 0) return 0;
    return gameMetrics[gameMetrics.length - 1].value;
  };

  // Filter games based on search term and genre
  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All Genres' || game.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  // Get unique genres from games
  const genres = ['All Genres', ...new Set(games.map(game => game.genre))];

  const handleAddGame = async (newGame: Game) => {
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGame),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const createdGame = await response.json();
      setGames(prev => [...prev, createdGame]);
      setIsAddDialogOpen(false);
      onGameUpdated?.();
      
      toast({
        title: "Success",
        description: "Game created successfully",
      });
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    }
  };

  // Create empty game for new game dialog
  const emptyGame: Game = {
    id: '',
    name: '',
    description: '',
    genre: '',
    robloxLink: '',
    thumbnail: '',
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
      email: '',
      discordId: '',
      country: ''
    },
    robloxAuthorization: {
      type: 'api_key',
      status: 'unverified'
    },
    media: []
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Game Manager</h1>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Game
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>
          <SelectContent>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No games found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map(game => (
            <Card 
              key={game.id} 
              className="hover:bg-accent/5 transition-all duration-300 border-l-4 transform hover:-translate-y-1 hover:shadow-lg"
              style={{ borderLeftColor: COLORS.primary }}
            >
              <CardHeader className="pb-3">
                <div className="aspect-video overflow-hidden rounded-lg mb-4">
                  {game.thumbnail ? (
                    <img
                      src={game.thumbnail}
                      alt={game.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No thumbnail</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold text-primary">{game.name}</CardTitle>
                    <CardDescription className="mt-1">{game.description}</CardDescription>
                  </div>
                  <Badge variant="outline">{game.genre}</Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {getLatestMetric(game.id, 'dailyActiveUsers').toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">DAU</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {getLatestMetric(game.id, 'monthlyActiveUsers').toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">MAU</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-600">
                        {(getLatestMetric(game.id, 'd1Retention') * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">D1 Retention</div>
                    </div>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Owner:</span>
                      <span className="font-medium text-foreground">{game.owner?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Country:</span>
                      <span className="font-medium text-foreground">{game.owner?.country || 'Unknown'}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 mt-2 transition-all duration-300 hover:scale-[1.02]"
                    onClick={() => router.push(`/dashboard/games/${game.id}`)}
                  >
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GameDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddGame}
        initialData={emptyGame}
      />
    </div>
  );
} 