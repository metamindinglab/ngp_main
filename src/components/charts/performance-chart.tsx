"use client";

import React from "react";
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

const DEFAULT_COLORS = [
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
  colors?: {
    impressions: string;
    engagements: string;
    engagementRate: string;
  };
}

interface DemographicChartProps {
  data: Record<string, number>;
  title: string;
  colors?: string[];
}

export function DemographicChart({ data, title, colors = DEFAULT_COLORS }: DemographicChartProps) {
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
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface GameComparisonChartProps {
  data: {
    gameName: string;
    impressions: number;
    engagements: number;
    engagementRate: number;
    completionRate: number;
  }[];
  colors?: {
    impressions: string;
    engagements: string;
    engagementRate: string;
    completionRate: string;
  };
}

export function GameComparisonChart({ 
  data, 
  colors = {
    impressions: '#0088FE',
    engagements: '#00C49F',
    engagementRate: '#FFBB28',
    completionRate: '#FF8042'
  }
}: GameComparisonChartProps) {
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
          stroke={colors.impressions}
          name="Impressions"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="engagements"
          stroke={colors.engagements}
          name="Engagements"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="engagementRate"
          stroke={colors.engagementRate}
          name="Engagement Rate (%)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="completionRate"
          stroke={colors.completionRate}
          name="Completion Rate (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function PerformanceChart({ 
  data,
  colors = {
    impressions: '#8884d8',
    engagements: '#82ca9d',
    engagementRate: '#ffc658'
  }
}: PerformanceChartProps) {
  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="impressions"
            stroke={colors.impressions}
            activeDot={{ r: 8 }}
          />
          <Line 
            type="monotone" 
            dataKey="engagements" 
            stroke={colors.engagements} 
          />
          <Line 
            type="monotone" 
            dataKey="engagementRate" 
            stroke={colors.engagementRate} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 