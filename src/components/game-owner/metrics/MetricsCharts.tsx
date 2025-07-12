import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MetricData {
  date: string;
  value: number;
}

interface DemographicData {
  category: string;
  value: number;
}

interface GameMetrics {
  d1Retention: MetricData[];
  d7Retention: MetricData[];
  d1Stickiness: MetricData[];
  d7Stickiness: MetricData[];
  dailyActiveUsers: MetricData[];
  averagePlayTime: MetricData[];
  averageSessionTime: MetricData[];
  monthlyActiveUsers: MetricData[];
  demographics: {
    country: DemographicData[];
    gender: DemographicData[];
    language: DemographicData[];
    age: DemographicData[];
  };
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
];

interface TimeSeriesChartProps {
  data: MetricData[];
  title: string;
  valueFormatter?: (value: number) => string;
}

export function TimeSeriesChart({ data, title, valueFormatter }: TimeSeriesChartProps) {
  const formatValue = valueFormatter || ((value: number) => value.toFixed(2));

  return (
    <div className="w-full h-[300px]">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
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
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis tickFormatter={formatValue} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number) => [formatValue(value), title]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DemographicChartProps {
  data: DemographicData[];
  title: string;
  type: 'bar' | 'pie';
}

export function DemographicChart({ data, title, type }: DemographicChartProps) {
  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // For bar charts, limit to top 10 categories
  const barData = type === 'bar' ? sortedData.slice(0, 10) : sortedData;

  return (
    <div className="w-full h-[300px]">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart
            data={barData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8">
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={sortedData}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(entry) => entry.category}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

interface MetricsChartsProps {
  metrics: GameMetrics;
}

export function MetricsCharts({ metrics }: MetricsChartsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Retention & Engagement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TimeSeriesChart
            data={metrics.d1Retention}
            title="Day 1 Retention"
            valueFormatter={(value) => `${(value * 100).toFixed(2)}%`}
          />
          <TimeSeriesChart
            data={metrics.d7Retention}
            title="Day 7 Retention"
            valueFormatter={(value) => `${(value * 100).toFixed(2)}%`}
          />
          <TimeSeriesChart
            data={metrics.d1Stickiness}
            title="Day 1 Stickiness"
            valueFormatter={(value) => `${(value * 100).toFixed(2)}%`}
          />
          <TimeSeriesChart
            data={metrics.d7Stickiness}
            title="Day 7 Stickiness"
            valueFormatter={(value) => `${(value * 100).toFixed(2)}%`}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Usage Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TimeSeriesChart
            data={metrics.dailyActiveUsers}
            title="Daily Active Users"
            valueFormatter={(value) => value.toLocaleString()}
          />
          <TimeSeriesChart
            data={metrics.monthlyActiveUsers}
            title="Monthly Active Users"
            valueFormatter={(value) => value.toLocaleString()}
          />
          <TimeSeriesChart
            data={metrics.averagePlayTime}
            title="Average Playtime (minutes)"
          />
          <TimeSeriesChart
            data={metrics.averageSessionTime}
            title="Average Session Time (minutes)"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Demographics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DemographicChart
            data={metrics.demographics.country}
            title="Country Distribution"
            type="bar"
          />
          <DemographicChart
            data={metrics.demographics.gender}
            title="Gender Distribution"
            type="pie"
          />
          <DemographicChart
            data={metrics.demographics.language}
            title="Language Distribution"
            type="bar"
          />
          <DemographicChart
            data={metrics.demographics.age}
            title="Age Distribution"
            type="pie"
          />
        </div>
      </div>
    </div>
  );
} 