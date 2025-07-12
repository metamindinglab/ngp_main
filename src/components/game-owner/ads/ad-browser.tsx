import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Game } from '@/types/game'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AdPerformanceData {
  id: string
  gameAdId: string
  date: string
  metrics: {
    impressions: number
    interactions: number
    engagementTime: number
    clickThroughRate: number
  }
  demographics: {
    ageGroups: Record<string, number>
    regions: Record<string, number>
  }
  engagements: {
    types: Record<string, number>
    duration: Record<string, number>
  }
  timeDistribution: Record<string, number>
}

interface GameAd {
  id: string
  name: string
  type: string
  performance: AdPerformanceData[]
}

interface AdBrowserProps {
  games: Game[]
}

export function AdBrowser({ games }: AdBrowserProps) {
  const [ads, setAds] = useState<GameAd[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<string>('')
  const [selectedAdType, setSelectedAdType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const [selectedAd, setSelectedAd] = useState<GameAd | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (selectedGame) {
      fetchAds()
    }
  }, [selectedGame, selectedAdType, selectedStatus])

  const fetchAds = async () => {
    try {
      const params = new URLSearchParams({
        gameId: selectedGame,
        ...(selectedAdType && { type: selectedAdType }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
      })

      const response = await fetch(`/api/game-owner/ads?${params}`)
      const data = await response.json()
      if (data.success) {
        setAds(data.ads)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch ads',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch ads',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceChartData = (performance: AdPerformanceData[]) => {
    return performance.map((data) => ({
      date: new Date(data.date).toLocaleDateString(),
      impressions: data.metrics.impressions,
      interactions: data.metrics.interactions,
      engagementTime: data.metrics.engagementTime,
      ctr: data.metrics.clickThroughRate * 100,
    }))
  }

  const getDemographicsData = (demographics: Record<string, number>) => {
    return Object.entries(demographics).map(([key, value]) => ({
      name: key,
      value: value,
    }))
  }

  const getTimeDistributionData = (timeDistribution: Record<string, number>) => {
    return Object.entries(timeDistribution).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count: count,
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ad Browser</CardTitle>
          <CardDescription>
            Browse and analyze your game ads performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Game</Label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ad Type</Label>
              <Select value={selectedAdType} onValueChange={setSelectedAdType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="DISPLAY">Display</SelectItem>
                  <SelectItem value="NPC">NPC</SelectItem>
                  <SelectItem value="MINIGAME">Mini-game</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div>Loading ads...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.name}</TableCell>
                    <TableCell>{ad.type}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ad.performance[0] ? (
                          <>
                            Impressions: {ad.performance[0].metrics.impressions}
                            <br />
                            Interactions: {ad.performance[0].metrics.interactions}
                            <br />
                            Engagement Time: {ad.performance[0].metrics.engagementTime}s
                          </>
                        ) : (
                          'No performance data'
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAd(ad)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedAd && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedAd.name} - Detailed Analytics</CardTitle>
            <CardDescription>
              Comprehensive performance metrics and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Performance Trends */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getPerformanceChartData(selectedAd.performance)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="impressions"
                        stroke="#8884d8"
                        name="Impressions"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="interactions"
                        stroke="#82ca9d"
                        name="Interactions"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ctr"
                        stroke="#ffc658"
                        name="CTR (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Age Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getDemographicsData(
                            selectedAd.performance[0].demographics.ageGroups
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            name="Users"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Regional Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getDemographicsData(
                            selectedAd.performance[0].demographics.regions
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#82ca9d"
                            name="Users"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Time Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Engagement Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={getTimeDistributionData(
                          selectedAd.performance[0].timeDistribution
                        )}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#ffc658"
                          name="Engagements"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 