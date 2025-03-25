'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
  '#82ca9d', '#ffc658', '#ff7300', '#666666', '#ff6b81'
];

interface PerformanceChartProps {
  data: {
    date: string;
    impressions: number;
    engagements: number;
    engagementRate: number;
  }[];
}

interface DemographicChartProps {
  data: Record<string, number>;
  title: string;
}

export function DemographicChart({ data, title }: DemographicChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="h-[300px]">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GameComparisonChart({ data }: { 
  data: {
    gameName: string;
    impressions: number;
    engagements: number;
    engagementRate: number;
    completionRate: number;
  }[] 
}) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="gameName" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="impressions"
          stroke="#0088FE"
          name="Impressions"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="engagements"
          stroke="#00C49F"
          name="Engagements"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="engagementRate"
          stroke="#FFBB28"
          name="Engagement Rate (%)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="completionRate"
          stroke="#FF8042"
          name="Completion Rate (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="impressions"
          stroke="#8884d8"
          name="Impressions"
        />
        <Line
          type="monotone"
          dataKey="engagements"
          stroke="#82ca9d"
          name="Engagements"
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 