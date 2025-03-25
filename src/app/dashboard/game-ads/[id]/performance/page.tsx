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
});

const GameComparisonChart = dynamic(() => import('@/components/charts/performance-chart').then(mod => mod.GameComparisonChart), {
  ssr: false,
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

function MetricCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <div className="flex items-center gap-2">
            {title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4" />
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
        <div className="text-2xl font-bold">{value}</div>
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
        const adPerformance = data.performanceData.find(
          (p: PerformanceData) => p.gameAdId === params.id
        );
        
        if (!adPerformance) {
          throw new Error('No performance data found for this game ad');
        }
        
        setPerformance(adPerformance);

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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !performance) {
    return (
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
            <Link href="/dashboard/game-ads/performance">
              <Button>Back to Overview</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
          description="Total number of times the game ad was viewed by players"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${performance.metrics.engagementRate}%`}
          description="Percentage of impressions that resulted in active engagement (Total Engagements / Total Impressions × 100)"
        />
        <MetricCard
          title="Completion Rate"
          value={`${performance.metrics.completionRate}%`}
          description="Percentage of engaged players who completed the intended action (e.g., clicked through, watched full video)"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${performance.metrics.conversionRate}%`}
          description="Percentage of unique players who engaged with the ad (Unique Engagements / Unique Impressions × 100)"
        />
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="games">Game Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="technical">Technical Data</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <RechartsComponent data={performance.performanceTrends.daily} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games">
          <Card>
            <CardHeader>
              <CardTitle>Performance Across Games</CardTitle>
              <CardDescription>Compare how this ad performs in different games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <GameComparisonChart data={gamePerformance} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <DemographicChart data={performance.demographics.gender} title="Gender Distribution" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <DemographicChart data={performance.demographics.ageGroup} title="Age Group Distribution" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <DemographicChart data={performance.demographics.geographicRegion} title="Geographic Distribution" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <DemographicChart data={performance.demographics.language} title="Language Distribution" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <DemographicChart data={performance.demographics.deviceType} title="Device Types" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <DemographicChart data={performance.demographics.platform} title="Platforms" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 