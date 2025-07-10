import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Define metric types
enum MetricType {
  // Time Series Metrics
  d1Retention = "d1_retention",
  d7Retention = "d7_retention",
  d1Stickiness = "d1_stickiness",
  d7Stickiness = "d7_stickiness",
  dailyActiveUsers = "daily_active_users",
  averagePlayTimeMinutes = "average_play_time_minutes",
  averageSessionLengthMinutes = "average_session_length_minutes",
  monthlyActiveUsersByDay = "monthly_active_users_by_day",
  
  // Demographic Metrics
  demographicsGender = "demographics_gender",
  demographicsCountry = "demographics_country",
  demographicsLanguage = "demographics_language",
  demographicsAgeGroup = "demographics_age_group"
}

interface MetricDataPoint {
  id: string;
  gameId: string;
  metricType: MetricType;
  date: Date;
  value: number;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      include: {
        gameOwner: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.gameOwner?.id !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all metrics for this game
    const metricData = await prisma.$queryRaw<MetricDataPoint[]>`
      SELECT id, "gameId", "metricType", date, value, category, "createdAt", "updatedAt"
      FROM "GameMetricData"
      WHERE "gameId" = ${params.gameId}
      ORDER BY date ASC
    `;

    // Transform the data into the format expected by the frontend
    const metrics = {
      d1Retention: metricData
        .filter((m: MetricDataPoint) => m.metricType === MetricType.d1Retention)
        .map((m: MetricDataPoint) => ({ date: m.date, value: m.value })),
      d7Retention: metricData
        .filter((m: MetricDataPoint) => m.metricType === MetricType.d7Retention)
        .map((m: MetricDataPoint) => ({ date: m.date, value: m.value })),
      d1Stickiness: metricData
        .filter((m: MetricDataPoint) => m.metricType === MetricType.d1Stickiness)
        .map((m: MetricDataPoint) => ({ date: m.date, value: m.value })),
      d7Stickiness: metricData
        .filter((m: MetricDataPoint) => m.metricType === MetricType.d7Stickiness)
        .map((m: MetricDataPoint) => ({ date: m.date, value: m.value })),
      dailyActiveUsers: metricData
        .filter((m: MetricDataPoint) => m.metricType === MetricType.dailyActiveUsers)
        .map((m: MetricDataPoint) => ({ date: m.date, value: m.value })),
      monthlyActiveUsers: metricData
        .filter((m: MetricDataPoint) => m.metricType === MetricType.monthlyActiveUsersByDay)
        .map((m: MetricDataPoint) => ({ date: m.date, value: m.value })),
      averagePlayTime: metricData
        .filter((m: MetricDataPoint) => m.metricType === MetricType.averagePlayTimeMinutes)
        .map((m: MetricDataPoint) => ({ date: m.date, value: m.value })),
      averageSessionTime: metricData
        .filter((m: MetricDataPoint) => m.metricType === MetricType.averageSessionLengthMinutes)
        .map((m: MetricDataPoint) => ({ date: m.date, value: m.value })),
      demographics: {
        country: metricData
          .filter((m: MetricDataPoint) => m.metricType === MetricType.demographicsCountry)
          .map((m: MetricDataPoint) => ({ category: m.category || '', value: m.value })),
        gender: metricData
          .filter((m: MetricDataPoint) => m.metricType === MetricType.demographicsGender)
          .map((m: MetricDataPoint) => ({ category: m.category || '', value: m.value })),
        language: metricData
          .filter((m: MetricDataPoint) => m.metricType === MetricType.demographicsLanguage)
          .map((m: MetricDataPoint) => ({ category: m.category || '', value: m.value })),
        age: metricData
          .filter((m: MetricDataPoint) => m.metricType === MetricType.demographicsAgeGroup)
          .map((m: MetricDataPoint) => ({ category: m.category || '', value: m.value })),
      },
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 