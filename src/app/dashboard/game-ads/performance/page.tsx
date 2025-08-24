"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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

interface GameAd {
  id: string;
  name: string;
  games?: Array<any>;
  createdAt?: string;
}

interface GameAdPerformance {
  metrics?: {
    totalImpressions: number;
    totalEngagements: number;
    engagementRate: number;
  };
}

interface GameAdWithPerformance extends GameAd {
  performance: GameAdPerformance | null;
  gamesCount: number;
}

interface GameAdPerformanceOverview {
  id: string;
  name: string;
  gamesCount: number;
  startDate: string;
  duration: number;
  impressions: number;
  engagements: number;
  engagementRate: number;
}

export default function PerformancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<GameAdPerformanceOverview[]>([]);
  const isMounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    // Set loading state first
    setIsLoading(true);
    setError(null);

    try {
      // Clean up previous controller if it exists
      if (abortController.current) {
        abortController.current.abort();
      }

      // Create new controller
      abortController.current = new AbortController();
      const signal = abortController.current.signal;

      // Fetch game ads
      const gameAdsResponse = await fetch('/api/game-ads', { signal });
      if (!gameAdsResponse.ok) {
        throw new Error('Failed to fetch game ads');
      }
      const gameAdsData = await gameAdsResponse.json();
      
      if (!gameAdsData.gameAds || !Array.isArray(gameAdsData.gameAds)) {
        throw new Error('Invalid game ads data format');
      }

      console.log('Raw Game Ads Data:', JSON.stringify(gameAdsData, null, 2));

      // Fetch performance data for each game ad
      const performanceDataPromises = gameAdsData.gameAds.map(async (gameAd: GameAd) => {
        try {
          const response = await fetch(`/api/game-ad-performance?gameAdId=${gameAd.id}`, { signal });
          if (!response.ok) {
            console.warn(`Failed to fetch performance data for game ad ${gameAd.id}`);
            return null;
          }
          const data = await response.json();
          console.log(`Raw Performance Data for ${gameAd.id}:`, JSON.stringify(data, null, 2));
          return {
            ...gameAd,
            performance: data.performanceData?.[0] || null,
            gamesCount: gameAd.games?.length || 0
          };
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }
          console.warn(`Error fetching performance data for game ad ${gameAd.id}:`, error);
          return null;
        }
      });

      const performanceData = await Promise.all(performanceDataPromises);
      console.log('Combined Performance Data:', JSON.stringify(performanceData, null, 2));

      if (isMounted.current) {
        const mappedData = performanceData
          .filter((ad): ad is GameAdWithPerformance => ad !== null)
          .map(ad => {
            const mapped = {
              id: ad.id,
              name: ad.name,
              gamesCount: ad.gamesCount,
              startDate: ad.createdAt || new Date().toISOString(),
              duration: 0,
              impressions: ad.performance?.metrics?.totalImpressions ?? 0,
              engagements: ad.performance?.metrics?.totalEngagements ?? 0,
              engagementRate: ad.performance?.metrics?.engagementRate ?? 0
            };
            console.log(`Mapped data for ${ad.id}:`, JSON.stringify(mapped, null, 2));
            return mapped;
          });

        console.log('Final mapped data before setState:', JSON.stringify(mappedData, null, 2));
        
        // Batch state updates
        if (isMounted.current) {
          setPerformanceData(mappedData);
          setError(null);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
      
      if (isMounted.current) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            // Ignore AbortError as it's expected during cleanup
            return;
          }
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    console.log('Component mounted, starting data load');
    
    // Reset mounted ref
    isMounted.current = true;
    
    loadData();

    return () => {
      console.log('Component unmounting, cleaning up');
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [loadData]);

  console.log('Rendering with state:', {
    isLoading,
    error,
    performanceDataLength: performanceData.length,
    performanceData: JSON.stringify(performanceData, null, 2)
  });

  // Add a wrapper div with a key to force proper mounting/unmounting
  return (
    <div key="performance-page-wrapper">
      {isLoading ? (
        <div className="container mx-auto p-6">
          <Link href="/" className="self-start transform hover:scale-105 transition-transform">
            <MMLLogo />
          </Link>
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      ) : error ? (
        <div className="container mx-auto p-6">
          <Link href="/" className="self-start transform hover:scale-105 transition-transform">
            <MMLLogo />
          </Link>
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => loadData()}>Try Again</Button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-6">
          <Link href="/" className="self-start transform hover:scale-105 transition-transform">
            <MMLLogo />
          </Link>

          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Game Ads Performance</h1>

            {performanceData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No performance data available.</p>
              </div>
            ) : (
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
                          <span className="font-medium text-foreground">{ad.gamesCount} games</span>
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

                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Impressions</p>
                            <p className="text-lg font-semibold">{ad.impressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Engagements</p>
                            <p className="text-lg font-semibold">{ad.engagements.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Engagement Rate</p>
                            <p className="text-lg font-semibold">{(ad.engagementRate * 100).toFixed(1)}%</p>
                          </div>
                        </div>

                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 mt-2 transition-all duration-300 hover:scale-[1.02]"
                          onClick={() => router.push(`/dashboard/game-ads/${ad.id}/performance`)}
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
          </div>
        </div>
      )}
    </div>
  );
} 