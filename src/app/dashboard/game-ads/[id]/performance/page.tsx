'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { MMLLogo } from "@/components/ui/mml-logo";
import { Progress } from "@/components/ui/progress";
import type { Game as RobloxGame } from '@/types/game';

const RechartsComponent = dynamic(() => import('@/components/charts/performance-chart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  ),
});

const DemographicChart = dynamic(() => import('@/components/charts/performance-chart').then(mod => mod.DemographicChart), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  ),
});

const GameComparisonChart = dynamic(() => import('@/components/charts/performance-chart').then(mod => mod.GameComparisonChart), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  ),
});

interface GamePerformance {
  gameName: string;
  impressions: number;
  engagements: number;
  engagementRate: number;
  completionRate: number;
  conversionRate: number;
}

interface PerformanceData {
  id: string;
  gameAdId: string;
  gameId: string;
  metrics: {
    totalImpressions: number;
    uniqueImpressions: number;
    totalEngagements: number;
    uniqueEngagements: number;
    engagementRate: number;
    completionRate: number;
    conversionRate: number;
  };
  demographics: {
    gender: Record<string, number>;
    ageGroup: Record<string, number>;
    geographicRegion: Record<string, number>;
    language: Record<string, number>;
    deviceType: Record<string, number>;
    platform: Record<string, number>;
  };
  performanceTrends: {
    daily: {
      date: string;
      impressions: number;
      engagements: number;
      engagementRate: number;
    }[];
  };
  gamePerformance?: GamePerformance[];
}

// Add color constants
const CHART_COLORS = {
  primary: '#2563eb', // Blue
  secondary: '#16a34a', // Green
  accent: '#9333ea', // Purple
  warning: '#f59e0b', // Amber
  info: '#06b6d4', // Cyan
  error: '#dc2626', // Red
};

const DEMOGRAPHIC_COLORS = [
  '#2563eb', // Blue
  '#16a34a', // Green
  '#9333ea', // Purple
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#dc2626', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

function MetricCard({ title, value, description, color = CHART_COLORS.primary }: { 
  title: string; 
  value: string | number; 
  description: string;
  color?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div 
        className="absolute top-0 left-0 w-1 h-full" 
        style={{ backgroundColor: color }}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <div className="flex items-center gap-2">
            {title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4" style={{ color }} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("Initializing...");
  const [currentStep, setCurrentStep] = useState(0);
  const smoothIntervalRef = useRef<NodeJS.Timeout>();
  const mainIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const steps = [
      { progress: 20, message: "Fetching performance metrics..." },
      { progress: 40, message: "Loading demographic data..." },
      { progress: 60, message: "Processing engagement statistics..." },
      { progress: 80, message: "Preparing visualization data..." },
      { progress: 95, message: "Almost there..." }
    ];

    // Start with a small progress immediately
    setProgress(5);

    const updateProgress = () => {
      if (currentStep < steps.length) {
        const targetProgress = steps[currentStep].progress;
        const currentProgress = currentStep > 0 ? steps[currentStep - 1].progress : 5;
        const step = (targetProgress - currentProgress) / 10;

        if (smoothIntervalRef.current) {
          clearInterval(smoothIntervalRef.current);
        }
        
        let currentValue = currentProgress;
        smoothIntervalRef.current = setInterval(() => {
          if (currentValue >= targetProgress) {
            if (smoothIntervalRef.current) {
              clearInterval(smoothIntervalRef.current);
            }
            setProgress(targetProgress);
            setLoadingStep(steps[currentStep].message);
            setCurrentStep(prev => prev + 1);
          } else {
            currentValue += step;
            setProgress(currentValue);
          }
        }, 100);
      }
    };

    // Initial update
    updateProgress();

    // Update every 2 seconds
    mainIntervalRef.current = setInterval(() => {
      if (currentStep < steps.length) {
        updateProgress();
      }
    }, 2000);

    return () => {
      if (mainIntervalRef.current) {
        clearInterval(mainIntervalRef.current);
      }
      if (smoothIntervalRef.current) {
        clearInterval(smoothIntervalRef.current);
      }
    };
  }, [currentStep]); // Add currentStep as a dependency

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <Progress value={progress} className="w-[60%] h-2" />
      <p className="text-sm text-muted-foreground">{loadingStep}</p>
    </div>
  );
}

export default function GameAdPerformancePage({
  params
}: {
  params: { id: string };
}) {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gamePerformance, setGamePerformance] = useState<GamePerformance[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<any[]>([]);
  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Reset mounted ref
    mountedRef.current = true;

    async function loadPerformanceData() {
      // If already fetching, don't start a new fetch
      if (fetchingRef.current) {
        return;
      }

      // Create new controller only if we don't have one
      if (!controllerRef.current) {
        controllerRef.current = new AbortController();
      }

      fetchingRef.current = true;
      setLoading(true);

      try {
        const response = await fetch(`/api/game-ad-performance?gameAdId=${params.id}`, {
          signal: controllerRef.current?.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (mountedRef.current) {
          // Extract the first performance data entry since we're querying for a specific game ad
          const performanceData = data.performanceData?.[0] || null;
          
          // Create a single day's data if no trends exist
          const trends = performanceData?.performanceTrends?.daily || [];
          const defaultTrend = trends.length === 0 ? [{
            date: new Date().toLocaleDateString(),
            impressions: performanceData?.metrics?.totalImpressions || 0,
            engagements: performanceData?.metrics?.totalEngagements || 0,
            engagementRate: performanceData?.metrics?.engagementRate || 0
          }] : trends.map((day: any) => ({
            date: new Date(day.date).toLocaleDateString(),
            impressions: day.impressions || 0,
            engagements: day.engagements || 0,
            engagementRate: (day.engagementRate || 0) * 100 // Convert to percentage
          }));

          // Batch state updates
          setPerformance(performanceData);
          setPerformanceTrends(defaultTrend);
          
          // Set game performance data
          if (performanceData?.gamePerformance && performanceData.gamePerformance.length > 0) {
            const newGamePerformance = performanceData.gamePerformance.map((game: any) => ({
              gameName: game.gameName || 'Unknown Game',
              impressions: game.impressions || 0,
              engagements: game.engagements || 0,
              engagementRate: (game.engagementRate || 0) * 100, // Convert to percentage
              completionRate: (game.completionRate || 0) * 100, // Convert to percentage
              conversionRate: (game.conversionRate || 0) * 100 // Convert to percentage
            }));
            setGamePerformance(newGamePerformance);
          } else {
            setGamePerformance([{
              gameName: performanceData?.ad?.games?.[0]?.name || 'Unknown Game',
              impressions: performanceData?.metrics?.totalImpressions || 0,
              engagements: performanceData?.metrics?.totalEngagements || 0,
              engagementRate: (performanceData?.metrics?.engagementRate || 0) * 100,
              completionRate: (performanceData?.metrics?.completionRate || 0) * 100,
              conversionRate: (performanceData?.metrics?.conversionRate || 0) * 100
            }]);
          }
          
          setLoading(false);
          setError(null);
        }
      } catch (error) {
        if (mountedRef.current) {
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              // Don't set error state for AbortError
              return;
            }
            console.error('Error fetching performance data:', error);
            setError(error.message);
          } else {
            setError('An unknown error occurred');
          }
          setLoading(false);
        }
      } finally {
        fetchingRef.current = false;
      }
    }

    loadPerformanceData();

    return () => {
      mountedRef.current = false;
      // Only abort if we're actually fetching
      if (fetchingRef.current && controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [params.id]);

  // Add data validation helper
  const validateMetrics = (metrics: any) => {
    if (!metrics) return {
      totalImpressions: 0,
      uniqueImpressions: 0,
      totalEngagements: 0,
      uniqueEngagements: 0,
      engagementRate: 0,
      completionRate: 0,
      conversionRate: 0
    };

    return {
      totalImpressions: metrics.totalImpressions ?? 0,
      uniqueImpressions: metrics.uniqueImpressions ?? 0,
      totalEngagements: metrics.totalEngagements ?? 0,
      uniqueEngagements: metrics.uniqueEngagements ?? 0,
      engagementRate: (metrics.engagementRate ?? 0) * 100, // Convert to percentage
      completionRate: (metrics.completionRate ?? 0) * 100, // Convert to percentage
      conversionRate: (metrics.conversionRate ?? 0) * 100 // Convert to percentage
    };
  };

  // Add safe number formatting
  const formatNumber = (value: number | undefined | null): string => {
    if (typeof value !== 'number') return '0';
    return value.toLocaleString();
  };

  const formatPercent = (value: number | undefined | null): string => {
    if (typeof value !== 'number') return '0%';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Ensure we have valid metrics even if performance data is null
  const metrics = validateMetrics(performance?.metrics);

  // Add a wrapper div with a key to force proper mounting/unmounting
  return (
    <div key={`performance-page-${params.id}`} className="container mx-auto p-6">
      <Link href="/" className="self-start transform hover:scale-105 transition-transform">
        <MMLLogo />
      </Link>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/game-ads/performance">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Game Ad Performance</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Impressions"
              value={formatNumber(metrics.totalImpressions)}
              description="Total number of times the ad was shown"
              color={CHART_COLORS.primary}
            />
            <MetricCard
              title="Engagement Rate"
              value={`${metrics.engagementRate.toFixed(1)}%`}
              description="Percentage of viewers who interacted with the ad"
              color={CHART_COLORS.secondary}
            />
            <MetricCard
              title="Completion Rate"
              value={`${metrics.completionRate.toFixed(1)}%`}
              description="Percentage of viewers who watched the entire ad"
              color={CHART_COLORS.accent}
            />
            <MetricCard
              title="Conversion Rate"
              value={`${metrics.conversionRate.toFixed(1)}%`}
              description="Percentage of unique players who took specific actions after seeing the ad"
              color={CHART_COLORS.warning}
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-background border-b">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="demographics"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Demographics
              </TabsTrigger>
              <TabsTrigger 
                value="game-comparison"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Game Comparison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Daily impressions and engagement trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <RechartsComponent 
                      key={`chart-${params.id}`}
                      data={performanceTrends} 
                      colors={{
                        impressions: CHART_COLORS.primary,
                        engagements: CHART_COLORS.secondary,
                        engagementRate: CHART_COLORS.accent
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="demographics">
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(performance?.demographics || {}).map(([key, data], index) => (
                  <Card key={`demographic-${key}`}>
                    <CardHeader>
                      <CardTitle className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                      <CardDescription>Distribution across different {key.toLowerCase()} groups</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <DemographicChart 
                          data={data || {}}
                          title={key.replace(/([A-Z])/g, ' $1').trim()}
                          colors={DEMOGRAPHIC_COLORS}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="game-comparison">
              <Card>
                <CardHeader>
                  <CardTitle>Game Performance Comparison</CardTitle>
                  <CardDescription>Compare performance metrics across different games</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <GameComparisonChart 
                      key={`game-comparison-${params.id}`}
                      data={gamePerformance} 
                      colors={{
                        impressions: CHART_COLORS.primary,
                        engagements: CHART_COLORS.secondary,
                        engagementRate: CHART_COLORS.accent,
                        completionRate: CHART_COLORS.warning
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
} 