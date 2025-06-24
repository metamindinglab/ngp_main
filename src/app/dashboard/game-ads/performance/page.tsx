"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2 } from 'lucide-react';
import { MMLLogo } from "@/components/ui/mml-logo";

// Add color constants
const COLORS = {
  primary: '#2563eb',    // Blue
  secondary: '#16a34a',  // Green
  accent: '#9333ea',     // Purple
  muted: '#64748b',      // Slate
};

interface GameAdPerformanceOverview {
  id: string;
  name: string;
  impressions: number;
  engagements: number;
  engagementRate: number;
  deployedGames: number;
  startDate: string;
  duration: number;
}

export default function PerformancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [performanceData, setPerformanceData] = React.useState<GameAdPerformanceOverview[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Use SWR or implement caching
        const cachedData = sessionStorage.getItem('performanceData');
        const cachedTimestamp = sessionStorage.getItem('performanceDataTimestamp');
        const now = Date.now();
        
        // Use cached data if it's less than 30 seconds old
        if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp)) < 30000) {
          const parsedData = JSON.parse(cachedData);
          setPerformanceData(parsedData);
          setIsLoading(false);
          return;
        }

        // Fetch playlists to get game ads
        const playlistsResponse = await fetch('/api/playlists');
        if (!playlistsResponse.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const playlistsData = await playlistsResponse.json();
        
        // Get unique game ad IDs from all playlists
        const gameAdIds = new Set<string>();
        playlistsData.playlists.forEach((playlist: any) => {
          playlist.schedules.forEach((schedule: any) => {
            if (schedule.gameAdId) {
              gameAdIds.add(schedule.gameAdId);
            }
          });
        });

        // Fetch game ads details
        const gameAdsResponse = await fetch('/api/game-ads');
        if (!gameAdsResponse.ok) {
          throw new Error('Failed to fetch game ads');
        }
        const gameAdsData = await gameAdsResponse.json();

        // Fetch performance data
        const performanceResponse = await fetch('/api/game-ad-performance');
        if (!performanceResponse.ok) {
          throw new Error('Failed to fetch performance data');
        }
        const performanceData = await performanceResponse.json();

        // Combine data
        const overview = Array.from(gameAdIds).map(gameAdId => {
          const gameAd = gameAdsData.gameAds.find((ad: any) => ad.id === gameAdId);
          const playlist = playlistsData.playlists.find((p: any) => 
            p.schedules.some((s: any) => s.gameAdId === gameAdId)
          );
          const schedule = playlist?.schedules.find((s: any) => s.gameAdId === gameAdId);
          const deployments = playlist?.deployments.filter((d: any) => d.scheduleId === schedule?.id) || [];
          const performance = performanceData.performanceData?.find((p: any) => p.gameAdId === gameAdId);

          return {
            id: gameAdId,
            name: gameAd?.name || 'Unknown Ad',
            impressions: performance?.metrics?.totalImpressions || 0,
            engagements: performance?.metrics?.totalEngagements || 0,
            engagementRate: performance?.metrics?.engagementRate || 0,
            deployedGames: deployments.length,
            startDate: schedule?.startDate || '',
            duration: schedule?.duration || 0
          };
        });

        // Cache the data
        sessionStorage.setItem('performanceData', JSON.stringify(overview));
        sessionStorage.setItem('performanceDataTimestamp', now.toString());
        
        setPerformanceData(overview);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
        toast({
          title: 'Error',
          description: 'Failed to load performance data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling with a 30-second interval
    const intervalId = setInterval(fetchData, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.refresh()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Link href="/" className="self-start transform hover:scale-105 transition-transform">
        <MMLLogo />
      </Link>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">Game Ads Performance</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performanceData.map((ad) => (
            <Card 
              key={ad.id} 
              className="hover:bg-accent/5 transition-all duration-300 border-l-4 transform hover:-translate-y-1 hover:shadow-lg"
              style={{ borderLeftColor: COLORS.primary }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-primary">{ad.name}</CardTitle>
                <CardDescription className="text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Deployed in:</span>
                    <span className="font-medium text-foreground">{ad.deployedGames} games</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Start Date:</span>
                    <span className="font-medium text-foreground">
                      {new Date(ad.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Duration:</span>
                    <span className="font-medium text-foreground">{ad.duration} days</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded hover:bg-primary/5 group relative">
                    <span className="text-sm font-medium text-gray-700">Impressions</span>
                    <span className="font-semibold text-gray-900">{ad.impressions.toLocaleString()}</span>
                    <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 right-0 w-48 text-center">
                      Total number of times the ad was shown
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded hover:bg-secondary/5 group relative">
                    <span className="text-sm font-medium text-gray-700">Total Engagements</span>
                    <span className="font-semibold text-gray-900">{ad.engagements.toLocaleString()}</span>
                    <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 right-0 w-48 text-center">
                      Number of times users interacted with the ad
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded hover:bg-accent/5 group relative">
                    <span className="text-sm font-medium text-gray-700">Engagement Rate</span>
                    <span className="font-semibold text-gray-900">{ad.engagementRate}%</span>
                    <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 right-0 w-48 text-center">
                      Percentage of impressions that led to engagements
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 mt-2 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => {
                    setLoadingDetails(ad.id);
                    router.push(`/dashboard/game-ads/${ad.id}/performance`);
                  }}
                  disabled={loadingDetails === ad.id}
                >
                  {loadingDetails === ad.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {performanceData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No game ads found in playlists</p>
            <Link href="/dashboard/game-ads">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Create Game Ad
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 