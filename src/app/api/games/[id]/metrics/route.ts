import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface TimeSeriesData {
  date: string;
  value: number;
}

interface DemographicData {
  category: string;
  value: number;
}

interface GameMetrics {
  d1Retention: TimeSeriesData[];
  d7Retention: TimeSeriesData[];
  d1Stickiness: TimeSeriesData[];
  d7Stickiness: TimeSeriesData[];
  dailyActiveUsers: TimeSeriesData[];
  averagePlayTime: TimeSeriesData[];
  averageSessionTime: TimeSeriesData[];
  monthlyActiveUsers: TimeSeriesData[];
  demographics: {
    country: DemographicData[];
    gender: DemographicData[];
    language: DemographicData[];
    age: DemographicData[];
  };
}

interface MetricUpdate {
  metricType: string;
  lastUpdated: string | null;
  isOutdated: boolean;
}

// Type guard for demographic metric types
function isDemographicMetric(metricType: string): boolean {
  return [
    'demographics_gender',
    'demographics_country',
    'demographics_language',
    'demographics_age_group',
  ].includes(metricType);
}

// Helper to get demographic type from metric type
function getDemographicType(metricType: string): keyof GameMetrics['demographics'] | null {
  const mapping: Record<string, keyof GameMetrics['demographics']> = {
    demographics_country: 'country',
    demographics_gender: 'gender',
    demographics_language: 'language',
    demographics_age_group: 'age',
  };
  return mapping[metricType] || null;
}

// Helper to map metric type to response key
function getMetricResponseKey(metricType: string): keyof Omit<GameMetrics, 'demographics'> | null {
  const mapping: Record<string, keyof Omit<GameMetrics, 'demographics'>> = {
    d1_retention: 'd1Retention',
    d7_retention: 'd7Retention',
    d1_stickiness: 'd1Stickiness',
    d7_stickiness: 'd7Stickiness',
    daily_active_users: 'dailyActiveUsers',
    average_play_time_minutes: 'averagePlayTime',
    average_session_length_minutes: 'averageSessionTime',
    monthly_active_users_by_day: 'monthlyActiveUsers',
  };
  return mapping[metricType] || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id;

    // Fetch all metrics for the game
    const metrics = await prisma.$queryRaw<Array<{
      id: string;
      gameId: string;
      metricType: string;
      date: Date;
      value: number;
      category: string | null;
      series: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>>`
      SELECT * FROM "GameMetricData"
      WHERE "gameId" = ${gameId}
      ORDER BY "date" ASC
    `;

    // Group metrics by type
    const metricsData: GameMetrics = {
      d1Retention: [],
      d7Retention: [],
      d1Stickiness: [],
      d7Stickiness: [],
      dailyActiveUsers: [],
      averagePlayTime: [],
      averageSessionTime: [],
      monthlyActiveUsers: [],
      demographics: {
        country: [],
        gender: [],
        language: [],
        age: [],
      },
    };

    // Process metrics
    metrics.forEach((metric) => {
      const timeSeriesData = {
        date: metric.date.toISOString(),
        value: metric.value,
      };

      if (isDemographicMetric(metric.metricType)) {
        const demographicType = getDemographicType(metric.metricType);
        if (demographicType && metric.category) {
          metricsData.demographics[demographicType].push({
            category: metric.category,
            value: metric.value,
          });
        }
      } else {
        const responseKey = getMetricResponseKey(metric.metricType);
        if (responseKey) {
          metricsData[responseKey].push(timeSeriesData);
        }
      }
    });

    // Get metric updates
    const metricTypes = [
      'd1_retention',
      'd7_retention',
      'd1_stickiness',
      'd7_stickiness',
      'daily_active_users',
      'average_play_time_minutes',
      'average_session_length_minutes',
      'monthly_active_users_by_day',
      'demographics_gender',
      'demographics_country',
      'demographics_language',
      'demographics_age_group',
    ] as const;

    const metricUpdates: MetricUpdate[] = await Promise.all(
      metricTypes.map(async (metricType) => {
        const latestMetric = await prisma.$queryRaw<Array<{
          id: string;
          gameId: string;
          metricType: string;
          date: Date;
          value: number;
          category: string | null;
          series: string | null;
          createdAt: Date;
          updatedAt: Date;
        }>>`
          SELECT * FROM "GameMetricData"
          WHERE "gameId" = ${gameId}
            AND "metricType"::text = ${metricType}
          ORDER BY "date" DESC
          LIMIT 1
        `;

        const isOutdated = latestMetric.length > 0
          ? new Date().getTime() - latestMetric[0].date.getTime() > 7 * 24 * 60 * 60 * 1000 // 7 days
          : true; // If no metric exists, consider it outdated

        return {
          metricType,
          lastUpdated: latestMetric.length > 0 ? latestMetric[0].date.toISOString() : null,
          isOutdated,
        };
      })
    );

    return NextResponse.json({
      metrics: metricsData,
      metricUpdates,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2023') {
        return NextResponse.json(
          { error: 'Invalid game ID format' },
          { status: 400 }
        );
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Game not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 