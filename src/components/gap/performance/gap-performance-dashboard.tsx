'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  Clock,
  Calendar,
  Target,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Color constants for charts
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

interface GameAd {
  id: string
  name: string
  type: string
  status: string
  createdAt: string
}

interface PerformanceMetrics {
  totalImpressions: number
  totalClicks: number
  totalEngagements: number
  averageCTR: number
  averageEngagementTime: number
  conversionRate: number
}

interface PerformanceData {
  date: string
  impressions: number
  clicks: number
  engagements: number
  ctr: number
  engagementTime: number
}

interface DemographicData {
  ageGroup: Record<string, number>
  gender: Record<string, number>
  country: Record<string, number>
}

interface CampaignData {
  id: string
  name: string
  type: string
  impressions: number
  clicks: number
  engagements: number
  ctr: number
}

interface ApiResponse {
  success: boolean
  data: {
    performance: {
      metrics: PerformanceMetrics
      trends: PerformanceData[]
      demographics: DemographicData
      campaigns: CampaignData[]
    }
    ads: GameAd[]
    dateRange: {
      start: string
      end: string
    }
  }
}

export function GAPPerformanceDashboard() {
  const [gameAds, setGameAds] = useState<GameAd[]>([])
  const [selectedAd, setSelectedAd] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('7d')
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [demographics, setDemographics] = useState<DemographicData>({
    ageGroup: {},
    gender: {},
    country: {}
  })
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalImpressions: 0,
    totalClicks: 0,
    totalEngagements: 0,
    averageCTR: 0,
    averageEngagementTime: 0,
    conversionRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const { toast } = useToast()

  // Fetch performance data from API
  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams()
      if (selectedAd !== 'all') queryParams.append('adId', selectedAd)
      queryParams.append('dateRange', dateRange)

      const response = await fetch(`/api/gap/performance?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch performance data')
      }

      const data: ApiResponse = await response.json()
      if (data.success) {
        setMetrics(data.data.performance.metrics)
        setPerformanceData(data.data.performance.trends)
        setDemographics(data.data.performance.demographics)
        setCampaigns(data.data.performance.campaigns)
        setGameAds(data.data.ads)
        setLastUpdated(new Date())
      } else {
        throw new Error('Failed to fetch performance data')
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load performance data. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load performance data on component mount and when filters change
  useEffect(() => {
    fetchPerformanceData()
  }, [selectedAd, dateRange])

  const handleRefresh = async () => {
    await fetchPerformanceData()
  }

  // Prepare demographic data for charts
  const ageGroupData = Object.entries(demographics.ageGroup).map(([name, value]) => ({
    name,
    value
  }))

  const genderData = Object.entries(demographics.gender).map(([name, value]) => ({
    name,
    value
  }))

  const countryData = Object.entries(demographics.country).map(([name, value]) => ({
    name,
    value
  }))

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'multimedia_display': return 'Multimedia Display'
      case 'dancing_npc': return 'Dancing NPC'
      case 'minigame_ad': return 'Minigame Ad'
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Track and analyze your game advertisement performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedAd} onValueChange={setSelectedAd}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select ad campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {gameAds.map(ad => (
              <SelectItem key={ad.id} value={ad.id}>
                {ad.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalImpressions)}</div>
            <p className="text-xs text-muted-foreground">Total ad views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalClicks)}</div>
            <p className="text-xs text-muted-foreground">User interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagements</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalEngagements)}</div>
            <p className="text-xs text-muted-foreground">Active interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.averageCTR)}</div>
            <p className="text-xs text-muted-foreground">Click-through rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageEngagementTime.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Time per interaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.conversionRate)}</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Impressions & Clicks Over Time</CardTitle>
                <CardDescription>Daily performance metrics for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => formatDate(value)}
                          formatter={(value: number, name: string) => [
                            formatNumber(value),
                            name === 'impressions' ? 'Impressions' : 'Clicks'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="impressions" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          name="Impressions"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="clicks" 
                          stroke="#82ca9d" 
                          strokeWidth={2}
                          name="Clicks"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No performance data available for the selected period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Click-through rate and engagement time trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => formatDate(value)}
                          formatter={(value: number, name: string) => [
                            name === 'ctr' ? formatPercentage(value) : `${value.toFixed(1)}s`,
                            name === 'ctr' ? 'CTR' : 'Engagement Time'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="ctr" 
                          stroke="#ff7300" 
                          strokeWidth={2}
                          name="CTR (%)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="engagementTime" 
                          stroke="#00C49F" 
                          strokeWidth={2}
                          name="Engagement Time (s)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No engagement data available for the selected period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Groups</CardTitle>
                <CardDescription>Audience breakdown by age</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {ageGroupData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ageGroupData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {ageGroupData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No age group data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>Audience breakdown by gender</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {genderData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No gender data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>Geographic distribution of audience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {countryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={countryData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(value: number) => [`${value}%`, 'Percentage']} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No country data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Individual campaign metrics and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium">{campaign.name}</h3>
                            <p className="text-sm text-gray-500">{getTypeDisplayName(campaign.type)}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-sm font-medium">{formatNumber(campaign.impressions)}</div>
                            <div className="text-xs text-gray-500">Impressions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{formatNumber(campaign.clicks)}</div>
                            <div className="text-xs text-gray-500">Clicks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{formatNumber(campaign.engagements)}</div>
                            <div className="text-xs text-gray-500">Engagements</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{formatPercentage(campaign.ctr)}</div>
                            <div className="text-xs text-gray-500">CTR</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No campaign data</h3>
                      <p className="text-gray-500">
                        No performance data available for your campaigns in the selected period.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 