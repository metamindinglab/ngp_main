'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Playlist, PlaylistFormData, PlaylistSchedule, GameDeployment } from '@/types/playlist'
import { GameAd } from '@/types/gameAd'
import { Game } from '@/types/game'
import { Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PlaylistDialogProps {
  open: boolean
  onClose: () => void
  initialData: Playlist | null
  onSave: (data: PlaylistFormData) => Promise<void>
}

export function PlaylistDialog({ open, onClose, initialData, onSave }: PlaylistDialogProps) {
  const [formData, setFormData] = useState<PlaylistFormData>({
    name: '',
    description: '',
    schedules: []
  })
  const [games, setGames] = useState<Game[]>([])
  const [gameAds, setGameAds] = useState<GameAd[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("0")

  // Load games and game ads
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [gamesResponse, adsResponse] = await Promise.all([
          fetch('/api/games'),
          fetch('/api/game-ads')
        ])

        if (!gamesResponse.ok || !adsResponse.ok) {
          throw new Error('Failed to load data')
        }

        const [gamesData, adsData] = await Promise.all([
          gamesResponse.json(),
          adsResponse.json()
        ])

        setGames(gamesData.games)
        setGameAds(adsData.gameAds)
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      const schedules = (initialData.schedules || []).map(schedule => ({
        id: schedule.id,
        gameAdId: schedule.gameAdId,
        startDate: schedule.startDate,
        duration: schedule.duration,
        selectedGames: schedule.deployments.map(d => d.gameId)
      }))

      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        schedules
      })
    } else {
      setFormData({
        name: '',
        description: '',
        schedules: []
      })
    }
  }, [initialData])

  const handleAddSchedule = () => {
    setFormData(prev => {
      const newSchedules = [
        ...prev.schedules,
        {
          id: undefined,
          gameAdId: '',
          startDate: new Date().toISOString(),
          duration: 7,
          selectedGames: []
        }
      ]
      setActiveTab((newSchedules.length - 1).toString())
      return { ...prev, schedules: newSchedules }
    })
  }

  const handleRemoveSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }))
  }

  const handleScheduleChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newSchedules = [...prev.schedules]
      newSchedules[index] = {
        ...newSchedules[index],
        [field]: value
      }
      return { ...prev, schedules: newSchedules }
    })
  }

  const handleGameSelection = (scheduleIndex: number, gameId: string, checked: boolean) => {
    setFormData(prev => {
      const newSchedules = [...prev.schedules]
      const selectedGames = newSchedules[scheduleIndex].selectedGames || []
      
      if (checked) {
        newSchedules[scheduleIndex].selectedGames = [...selectedGames, gameId]
      } else {
        newSchedules[scheduleIndex].selectedGames = selectedGames.filter(id => id !== gameId)
      }
      
      return { ...prev, schedules: newSchedules }
    })
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('Please enter a playlist name')
      return
    }

    if (formData.schedules.length === 0) {
      alert('Please add at least one schedule')
      return
    }

    for (const schedule of formData.schedules) {
      if (!schedule.gameAdId) {
        alert('Please select a game ad for each schedule')
        return
      }
      if (!schedule.startDate) {
        alert('Please select a start date for each schedule')
        return
      }
      if (schedule.selectedGames.length === 0) {
        alert('Please select at least one game for each schedule')
        return
      }
    }

    try {
      setLoading(true)
      setError(null)
      await onSave(formData)
    } catch (error) {
      console.error('Error saving playlist:', error)
      setError('Failed to save playlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Add this function to calculate game statistics
  const calculateGameStats = (selectedGameIds: string[]) => {
    const selectedGames = (games || []).filter(game => selectedGameIds.includes(game.id))
    
    if (selectedGames.length === 0) return null

    const stats = {
      totalDAU: 0,
      totalMAU: 0,
      genres: new Set<string>(),
      geographicCoverage: new Map<string, number>()
    }

    selectedGames.forEach(game => {
      // Check both metrics and latestMetrics for compatibility
      const gameMetrics = game.latestMetrics || game.metrics
      stats.totalDAU += gameMetrics?.dau || 0
      stats.totalMAU += gameMetrics?.mau || 0
      if (game.genre) stats.genres.add(game.genre)

      // Aggregate geographic coverage
      const geoPlayers = gameMetrics?.topGeographicPlayers || game.metrics?.topGeographicPlayers
      geoPlayers?.forEach((geo: { country: string; percentage: number }) => {
        const current = stats.geographicCoverage.get(geo.country) || 0
        stats.geographicCoverage.set(geo.country, current + geo.percentage)
      })
    })

    // Calculate average geographic coverage
    const geoCoverage = Array.from(stats.geographicCoverage.entries())
      .map(([country, total]) => ({
        country,
        percentage: total / selectedGames.length
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)

    return {
      totalDAU: stats.totalDAU,
      totalMAU: stats.totalMAU,
      genres: Array.from(stats.genres),
      topGeographies: geoCoverage
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" aria-hidden={undefined}>

        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Playlist' : 'Create New Playlist'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update your playlist details and schedules.' : 'Create a new playlist with scheduled game ads.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Schedules</h3>
                <Button
                  onClick={handleAddSchedule}
                  size="default"
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Add Schedule
                </Button>
              </div>

              {formData.schedules.length > 0 && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start">
                    {formData.schedules.map((_, index) => (
                      <TabsTrigger
                        key={index}
                        value={index.toString()}
                        className="relative"
                      >
                        Schedule {index + 1}
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveSchedule(index)
                              setActiveTab((Math.max(0, index - 1)).toString())
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {formData.schedules.map((schedule, index) => (
                    <TabsContent key={index} value={index.toString()} className="border rounded-lg p-4 mt-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={`gameAd-${index}`} className="text-right">Game Ad</Label>
                          <Select
                            value={schedule.gameAdId}
                            onValueChange={(value) => handleScheduleChange(index, 'gameAdId', value)}
                          >
                            <SelectTrigger id={`gameAd-${index}`} className="col-span-3">
                              <SelectValue placeholder="Select a game ad" />
                            </SelectTrigger>
                            <SelectContent>
                              {(gameAds || [])
                                .filter(ad => ad && typeof ad.id === 'string' && ad.id.trim() !== '')
                                .map(ad => (
                                  <SelectItem key={ad.id} value={ad.id}>
                                    {ad.name || `Unnamed Ad (${ad.id})`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={`startDate-${index}`} className="text-right">Start Date</Label>
                          <Input
                            id={`startDate-${index}`}
                            type="date"
                            value={schedule.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                // Convert to ISO string for storage
                                const date = new Date(e.target.value + 'T00:00:00.000Z');
                                handleScheduleChange(index, 'startDate', date.toISOString());
                              }
                            }}
                            className="col-span-3 h-10"
                            min={new Date().toISOString().split('T')[0]} // Prevent past dates
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={`duration-${index}`} className="text-right">Duration (days)</Label>
                          <Input
                            id={`duration-${index}`}
                            type="number"
                            min="1"
                            value={schedule.duration}
                            onChange={(e) => 
                              handleScheduleChange(index, 'duration', parseInt(e.target.value) || 1)
                            }
                            className="col-span-3 h-10"
                          />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right pt-2">Games</Label>
                          <div className="col-span-3 space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                              {(games || []).map(game => (
                                <div key={game.id} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={`game-${index}-${game.id}`}
                                    checked={schedule.selectedGames.includes(game.id)}
                                    onCheckedChange={(checked) => handleGameSelection(index, game.id, checked as boolean)}
                                  />
                                  <Label
                                    htmlFor={`game-${index}-${game.id}`}
                                    className="text-sm leading-none pt-0.5"
                                  >
                                    {game.name || 'Unnamed Game'}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg p-4 border border-blue-200/20">
                              {(() => {
                                const stats = calculateGameStats(schedule.selectedGames)
                                if (!stats) return null
                                
                                return (
                                  <div className="space-y-2 text-sm">
                                    <h5 className="font-medium text-blue-600 dark:text-blue-400">Selected Games Summary</h5>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                      <div>
                                        <span className="text-purple-600 dark:text-purple-400">Total DAU:</span>{' '}
                                        {stats.totalDAU.toLocaleString()}
                                      </div>
                                      <div>
                                        <span className="text-purple-600 dark:text-purple-400">Total MAU:</span>{' '}
                                        {stats.totalMAU.toLocaleString()}
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-purple-600 dark:text-purple-400">Genres:</span>{' '}
                                        {stats.genres.join(', ')}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            {loading ? 'Saving...' : initialData ? 'Update Playlist' : 'Create Playlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 