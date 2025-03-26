'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import dynamic from 'next/dynamic';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';

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
    async function loadPerformanceData() {
      try {
        const response = await fetch('/api/game-ad-performance');
        if (!response.ok) {
          throw new Error('Failed to fetch performance data');
        }
        const data = await response.json();
        const adPerformance = data.performanceData?.find(
          (p: PerformanceData) => p.gameAdId === params.id
        );
        
        if (!adPerformance) {
          throw new Error('No performance data found for this game ad');
        }
        
        setPerformance({
          id: adPerformance.id,
          gameAdId: adPerformance.gameAdId,
          gameId: adPerformance.gameId,
          metrics: {
            totalImpressions: adPerformance.metrics.totalImpressions,
            uniqueImpressions: adPerformance.metrics.uniqueImpressions,
            totalEngagements: adPerformance.metrics.totalEngagements,
            uniqueEngagements: adPerformance.metrics.uniqueEngagements,
            engagementRate: adPerformance.metrics.engagementRate,
            completionRate: adPerformance.metrics.completionRate,
            conversionRate: adPerformance.metrics.conversionRate
          },
          demographics: {
            gender: adPerformance.demographics.gender,
            ageGroup: adPerformance.demographics.ageGroup,
            geographicRegion: adPerformance.demographics.geographicRegion,
            language: adPerformance.demographics.language,
            deviceType: adPerformance.demographics.deviceType,
            platform: adPerformance.demographics.platform
          },
          performanceTrends: {
            daily: adPerformance.performanceTrends.daily
          }
        });

        // Mock game performance data (replace with actual API call in production)
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
            engagements: 3800,
            engagementRate: 32,
            completionRate: 80
          },
          {
            gameName: "Brookhaven",
            impressions: 18000,
            engagements: 5400,
            engagementRate: 28,
            completionRate: 88
          }
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
      } finally {
        setLoading(false);
      }
    }

    loadPerformanceData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform block mb-6">
          <Image
            src="/MML-logo.png"
            alt="MML Logo"
            width={126}
            height={42}
            className="object-contain"
            priority
            style={{ width: '126px', height: '42px' }}
          />
        </Link>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !performance) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform block mb-6">
          <Image
            src="/MML-logo.png"
            alt="MML Logo"
            width={126}
            height={42}
            className="object-contain"
            priority
            style={{ width: '126px', height: '42px' }}
          />
        </Link>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/game-ads/performance">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Game Ad Performance</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-[40vh] space-y-4">
              <p className="text-muted-foreground">{error || 'No performance data available'}</p>
              <Link href="/dashboard/game-ads">
                <Button>Back to Game Ads</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Link href="/" className="self-start transform hover:scale-105 transition-transform block mb-6">
        <Image
          src="/MML-logo.png"
          alt="MML Logo"
          width={126}
          height={42}
          className="object-contain"
          priority
          style={{ width: '126px', height: '42px' }}
        />
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