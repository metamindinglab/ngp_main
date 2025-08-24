import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface TimeSeriesData {
  date: string;
  value: number;
}

interface DemographicData {
  category: string;
  value: number;
}

interface MetricUpdate {
  metricType: string;
  lastUpdated: string | null;
  isOutdated: boolean;
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

interface MetricsOverviewProps {
  gameId: string;
}

const metricDisplayNames: Record<string, string> = {
  'd1_retention': 'Day 1 Retention',
  'd7_retention': 'Day 7 Retention',
  'd1_stickiness': 'Day 1 Stickiness',
  'd7_stickiness': 'Day 7 Stickiness',
  'daily_active_users': 'Daily Active Users',
  'average_play_time_minutes': 'Average Playtime',
  'average_session_length_minutes': 'Average Session Time',
  'monthly_active_users_by_day': 'Monthly Active Users',
  'demographics_gender': 'Gender Demographics',
  'demographics_country': 'Country Demographics',
  'demographics_language': 'Language Demographics',
  'demographics_age_group': 'Age Demographics'
};

export function MetricsOverview({ gameId }: MetricsOverviewProps) {
  const [metrics, setMetrics] = useState<GameMetrics | null>(null);
  const [metricUpdates, setMetricUpdates] = useState<MetricUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/games/${gameId}/metrics`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch metrics');
      }

      console.log('Fetched metrics:', data);

      if (!data.metrics) {
        throw new Error('No metrics data available');
      }

      setMetrics(data.metrics);
      setMetricUpdates(data.metricUpdates || []);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [gameId]);

  const handleRefresh = () => {
    fetchMetrics();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || Object.values(metrics).every(arr => Array.isArray(arr) && arr.length === 0)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>No metrics data available. Please import metrics data first.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Metrics Overview</h2>
          <p className="text-sm text-muted-foreground">View your game's performance metrics</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metricUpdates.map((update) => (
          <div key={update.metricType} className="p-4 rounded-lg border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{metricDisplayNames[update.metricType]}</h3>
                <p className="text-sm text-muted-foreground">
                  {update.lastUpdated 
                    ? `Last updated: ${new Date(update.lastUpdated).toLocaleDateString()}`
                    : 'Not yet imported'}
                </p>
              </div>
              {update.isOutdated && (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Retention Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Day 1 Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.d1Retention}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(1)}%`} />
                  <Tooltip 
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day 7 Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.d7Retention}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(1)}%`} />
                  <Tooltip 
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stickiness Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Day 1 Stickiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.d1Stickiness}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(1)}%`} />
                  <Tooltip 
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day 7 Stickiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.d7Stickiness}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(1)}%`} />
                  <Tooltip 
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Usage Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.dailyActiveUsers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.monthlyActiveUsers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Playtime (Minutes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.averagePlayTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Session Time (Minutes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.averageSessionTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 