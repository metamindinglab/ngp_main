'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // Simulate loading progress for better UX
    const steps = [
      { progress: 20, message: "Fetching performance metrics..." },
      { progress: 40, message: "Loading demographic data..." },
      { progress: 60, message: "Processing engagement statistics..." },
      { progress: 80, message: "Preparing visualization data..." },
      { progress: 95, message: "Almost there..." }
    ];

    let currentStep = 0;

    // Start with a small progress immediately
    setProgress(5);

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        // Smooth transition to next step
        const targetProgress = steps[currentStep].progress;
        const currentProgress = currentStep > 0 ? steps[currentStep - 1].progress : 5;
        const step = (targetProgress - currentProgress) / 10;
        
        let progress = currentProgress;
        const smoothInterval = setInterval(() => {
          progress += step;
          if (progress >= targetProgress) {
            clearInterval(smoothInterval);
            setProgress(targetProgress);
            setLoadingStep(steps[currentStep].message);
            currentStep++;
          } else {
            setProgress(progress);
          }
        }, 100);

        return () => {
          clearInterval(smoothInterval);
        };
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-8">
      <div className="flex items-center justify-center space-x-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h2 className="text-xl font-semibold text-primary">Loading Performance Data</h2>
      </div>
      
      <div className="w-full max-w-md space-y-4">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                Progress
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-primary">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-primary/20" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-primary">{loadingStep}</p>
          <p className="text-xs text-muted-foreground">
            This may take up to 30 seconds to load all metrics and prepare visualizations
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">While you wait:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
              <li>We're gathering detailed performance metrics</li>
              <li>Processing demographic data across regions</li>
              <li>Calculating engagement rates and trends</li>
              <li>Preparing interactive visualizations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
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

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function loadPerformanceData() {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cacheKey = `gameAdPerformance_${params.id}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const cachedTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
        const now = Date.now();
        
        // Use cached data if it's less than 5 minutes old
        if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp)) < 300000) {
          const parsedData = JSON.parse(cachedData);
          if (isMounted) {
            setPerformance(parsedData);
            setLoading(false);
          }
          return;
        }

        // Single API call with gameAdId parameter and abort controller
        const response = await fetch(`/api/game-ad-performance?gameAdId=${params.id}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch performance data: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.performanceData?.length) {
          throw new Error('No performance data found for this game ad');
        }
        
        const performanceData = data.performanceData[0];

        // Only update state and cache if component is still mounted
        if (isMounted) {
          // Cache the data
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(performanceData));
            sessionStorage.setItem(`${cacheKey}_timestamp`, now.toString());
          } catch (e) {
            console.warn('Failed to cache performance data:', e);
          }
          
          setPerformance(performanceData);
          setGamePerformance([
            {
              gameName: "Adopt Me!",
              impressions: 15000,
              engagements: 4500,
              engagementRate: 30,
              completionRate: 85
            },
            {
              gameName: "Blox Fruits",
              impressions: 12000,
              engagements: 3600,
              engagementRate: 30,
              completionRate: 80
            }
          ]);
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            return; // Ignore abort errors
          }
          if (isMounted) {
            setError(err.message);
          }
        } else {
          if (isMounted) {
            setError('An unexpected error occurred');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPerformanceData();

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [params.id]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-sm text-red-500">{error}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/game-ads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game Ads
          </Link>
        </Button>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-sm text-muted-foreground">No performance data available</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/game-ads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game Ads
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Link href="/" className="self-start transform hover:scale-105 transition-transform">
        <MMLLogo />
      </Link>

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
            value={performance.metrics.totalImpressions.toLocaleString()}
            description="Total number of times the ad was shown"
            color={CHART_COLORS.primary}
          />
          <MetricCard
            title="Engagement Rate"
            value={`${performance.metrics.engagementRate}%`}
            description="Percentage of viewers who interacted with the ad"
            color={CHART_COLORS.secondary}
          />
          <MetricCard
            title="Completion Rate"
            value={`${performance.metrics.completionRate}%`}
            description="Percentage of viewers who watched the entire ad"
            color={CHART_COLORS.accent}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${performance.metrics.conversionRate}%`}
            description="Percentage of unique players who took specific actions after seeing the ad (e.g., clicked through to the game, made a purchase, or completed a desired action)"
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
              value="comparison"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              Game Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Performance Overview</CardTitle>
                <CardDescription>Daily impressions and engagements</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[400px]">
                  <RechartsComponent 
                    data={performance.performanceTrends.daily}
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
              {Object.entries(performance.demographics).map(([key, data], index) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="text-primary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <DemographicChart 
                        data={data}
                        title={key.replace(/([A-Z])/g, ' $1').trim()}
                        colors={DEMOGRAPHIC_COLORS}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Game Performance Comparison</CardTitle>
                <CardDescription>Compare performance across different games</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[400px]">
                  <GameComparisonChart 
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
    </div>
  );
} 