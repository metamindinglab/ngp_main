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
import { Playlist, PlaylistFormData } from '@/types/playlist'
import { GameAd } from '@/types/gameAd'
import { Game } from '@/types/game'
import { format } from 'date-fns'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Plus, X } from "lucide-react"
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
      const schedules = initialData.schedules.map(schedule => {
        const deployments = initialData.deployments.filter(d => d.scheduleId === schedule.id)
        return {
          gameAdId: schedule.gameAdId,
          startDate: schedule.startDate,
          duration: schedule.duration,
          selectedGames: deployments.map(d => d.gameId)
        }
      })

      setFormData({
        name: initialData.name,
        description: initialData.description,
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
    const selectedGames = games.filter(game => selectedGameIds.includes(game.id))
    
    if (selectedGames.length === 0) return null

    const stats = {
      totalDAU: 0,
      totalMAU: 0,
      genres: new Set<string>(),
      geographicCoverage: new Map<string, number>()
    }

    selectedGames.forEach(game => {
      stats.totalDAU += game.metrics?.dau || 0
      stats.totalMAU += game.metrics?.mau || 0
      if (game.genre) stats.genres.add(game.genre)

      // Aggregate geographic coverage
      game.metrics?.topGeographicPlayers?.forEach(geo => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{initialData ? 'Edit Playlist' : 'Create New Playlist'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update your playlist details' : 'Create a new playlist to schedule game ads'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-6 py-4 max-h-[calc(90vh-180px)]">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  rows={3}
                />
              </div>
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
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
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
                          <Label className="text-right">Game Ad</Label>
                          <Select
                            value={schedule.gameAdId}
                            onValueChange={(value) => handleScheduleChange(index, 'gameAdId', value)}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select a game ad" />
                            </SelectTrigger>
                            <SelectContent>
                              {gameAds.map(ad => (
                                <SelectItem key={ad.id} value={ad.id}>
                                  {ad.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Start Date</Label>
                          <div className="col-span-3">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !schedule.startDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {schedule.startDate ? (
                                    format(new Date(schedule.startDate), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={new Date(schedule.startDate)}
                                  onSelect={(date) => 
                                    handleScheduleChange(index, 'startDate', date?.toISOString() || '')
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Duration (days)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={schedule.duration}
                            onChange={(e) => 
                              handleScheduleChange(index, 'duration', parseInt(e.target.value) || 1)
                            }
                            className="col-span-3"
                          />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right pt-2">Games</Label>
                          <div className="col-span-3 space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                              {games.map(game => (
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
                                    {game.name}
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
                                      <div className="col-span-2">
                                        <span className="text-purple-600 dark:text-purple-400">Top Geographic Coverage:</span>
                                        <ul className="mt-1 space-y-1">
                                          {stats.topGeographies.map(geo => (
                                            <li key={geo.country} className="flex justify-between">
                                              <span>{geo.country}</span>
                                              <span className="font-medium text-blue-600 dark:text-blue-400">{geo.percentage.toFixed(1)}%</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(schedule.selectedGames)).map(gameId => {
                                const game = games.find(g => g.id === gameId)
                                return game ? (
                                  <Badge
                                    key={`${index}-${game.id}`}
                                    variant="outline"
                                    className="flex items-center gap-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors"
                                  >
                                    {game.name}
                                    <X
                                      className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                                      onClick={() => handleGameSelection(index, game.id, false)}
                                    />
                                  </Badge>
                                ) : null
                              })}
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
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 