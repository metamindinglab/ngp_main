import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Calendar, Clock, Users, Gamepad2 } from "lucide-react";
import { GameAd } from "@/types/gameAd";
import path from 'path';
import fs from 'fs/promises';
import { Badge } from "@/components/ui/badge";

interface Game {
  id: string;
  name: string;
  genre: string;
}

interface Deployment {
  id: string;
  gameId: string;
  scheduleId: string;
  deploymentStatus: string;
  gameName?: string;
}

interface ScheduleInfo {
  schedules: {
    id: string;
    gameAdId: string;
    startDate: string;
    duration: number;
    status: string;
  }[];
  deployments: Deployment[];
  playlistName: string;
}

interface GameAdWithSchedule extends GameAd {
  scheduleInfo: ScheduleInfo;
}

interface Playlist {
  id: string;
  name: string;
  schedules: {
    id: string;
    gameAdId: string;
    startDate: string;
    duration: number;
    status: string;
  }[];
  deployments: Deployment[];
  status: string;
}

async function getScheduledGameAds(): Promise<GameAdWithSchedule[]> {
  try {
    // Read playlists to get scheduled game ads
    const playlistsPath = path.join(process.cwd(), 'data', 'playlists.json');
    const playlistsData = JSON.parse(await fs.readFile(playlistsPath, 'utf-8'));
    
    // Read games data to get game names
    const gamesPath = path.join(process.cwd(), 'data', 'games.json');
    const gamesData = JSON.parse(await fs.readFile(gamesPath, 'utf-8'));
    const gameMap = new Map(gamesData.games.map((game: Game) => [game.id, game]));
    
    // Get all unique gameAdIds from active playlists
    const scheduledAdIds = new Set<string>();
    const scheduledAdsInfo = new Map<string, ScheduleInfo>();

    playlistsData.playlists.forEach((playlist: Playlist) => {
      if (playlist.status === 'active') {
        playlist.schedules.forEach(schedule => {
          scheduledAdIds.add(schedule.gameAdId);
          scheduledAdsInfo.set(schedule.gameAdId, {
            schedules: playlist.schedules.filter(s => s.gameAdId === schedule.gameAdId),
            deployments: playlist.deployments
              .filter(d => d.scheduleId === schedule.id)
              .map(deployment => ({
                ...deployment,
                gameName: gameMap.get(deployment.gameId)?.name || deployment.gameId
              })),
            playlistName: playlist.name
          });
        });
      }
    });

    // Fetch game ads details
    const gameAdsPath = path.join(process.cwd(), 'data', 'game-ads.json');
    const gameAdsData = JSON.parse(await fs.readFile(gameAdsPath, 'utf-8'));
    
    // Filter and enrich game ads with schedule info
    const scheduledAds = gameAdsData.gameAds
      .filter((ad: GameAd) => scheduledAdIds.has(ad.id))
      .map((ad: GameAd): GameAdWithSchedule => {
        const info = scheduledAdsInfo.get(ad.id);
        if (!info) {
          throw new Error(`No schedule info found for game ad ${ad.id}`);
        }
        return {
          ...ad,
          scheduleInfo: info
        };
      });

    return scheduledAds;
  } catch (error) {
    console.error('Error fetching scheduled game ads:', error);
    return [];
  }
}

export default async function GameAdsPerformancePage() {
  const scheduledAds = await getScheduledGameAds();

  if (!scheduledAds?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold text-muted-foreground">No Scheduled Game Ads</h1>
        <p className="text-muted-foreground">Schedule some game ads in playlists to track their performance.</p>
        <Link href="/dashboard/playlists">
          <Button>Go to Playlist Manager</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Scheduled Game Ads Performance</h1>
        <div className="space-x-4">
          <Link href="/dashboard/playlists">
            <Button variant="outline">Playlist Manager</Button>
          </Link>
          <Link href="/dashboard/game-ads">
            <Button variant="outline">Game Ads Manager</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {scheduledAds.map((ad: GameAdWithSchedule) => (
          <Card key={ad.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-primary">
                    {ad.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                      {ad.templateType}
                    </span>
                  </CardDescription>
                </div>
                <Link href={`/dashboard/game-ads/${ad.id}/performance`}>
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Playlist Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Users className="h-4 w-4" />
                  <span>Playlist</span>
                </div>
                <div className="pl-6 py-2 border-l-2 border-primary/20">
                  <span className="text-base font-medium">{ad.scheduleInfo.playlistName}</span>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule</span>
                </div>
                <div className="pl-6 space-y-2 border-l-2 border-blue-200">
                  {ad.scheduleInfo.schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {new Date(schedule.startDate).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="bg-blue-50">
                          {schedule.duration} days
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Games Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <Gamepad2 className="h-4 w-4" />
                  <span>Deployed Games</span>
                </div>
                <div className="pl-6 border-l-2 border-green-200">
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(ad.scheduleInfo.deployments.map((d: Deployment) => d.gameId)))
                      .map((gameId: string) => {
                        const deployment = ad.scheduleInfo.deployments.find((d: Deployment) => d.gameId === gameId);
                        return (
                          <Badge 
                            key={gameId} 
                            variant="secondary"
                            className="bg-green-50 hover:bg-green-100 transition-colors py-1 px-3"
                          >
                            {deployment?.gameName || gameId}
                          </Badge>
                        );
                      })}
                  </div>
                </div>
              </div>

              <Link 
                href={`/dashboard/game-ads/${ad.id}/performance`}
                className="block w-full mt-4"
              >
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground"
                >
                  View Performance
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 