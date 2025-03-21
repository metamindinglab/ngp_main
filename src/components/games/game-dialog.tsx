'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Game {
  id: string
  name: string
  robloxLink: string
  genre: string
  description: string
  metrics: {
    dau: number
    mau: number
    day1Retention: number
    topGeographicPlayers: {
      country: string
      percentage: number
    }[]
  }
  dates: {
    created: string
    lastUpdated: string
    mgnJoined: string
  }
  thumbnail: string
  owner: {
    name: string
    discordId: string
    email: string
    country: string
  }
}

interface GameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: Game | null
  onSave: (game: Game) => void
}

const GENRES = [
  'Role-Playing',
  'Fighting',
  'First-Person Shooter',
  'Strategy',
  'Adventure',
  'Simulation',
  'Sports',
  'Racing',
  'Other'
]

export function GameDialog({ open, onOpenChange, game, onSave }: GameDialogProps) {
  const [formData, setFormData] = useState<Partial<Game>>({
    name: '',
    robloxLink: '',
    genre: GENRES[0],
    description: '',
    metrics: {
      dau: 0,
      mau: 0,
      day1Retention: 0,
      topGeographicPlayers: []
    },
    owner: {
      name: '',
      discordId: '',
      email: '',
      country: ''
    }
  })

  useEffect(() => {
    if (game) {
      setFormData(game)
    } else {
      setFormData({
        name: '',
        robloxLink: '',
        genre: GENRES[0],
        description: '',
        metrics: {
          dau: 0,
          mau: 0,
          day1Retention: 0,
          topGeographicPlayers: []
        },
        owner: {
          name: '',
          discordId: '',
          email: '',
          country: ''
        }
      })
    }
  }, [game])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    
    const completeGameData: Game = {
      ...formData,
      id: game?.id || `game_${Date.now()}`,
      dates: {
        created: game?.dates.created || now,
        lastUpdated: now,
        mgnJoined: game?.dates.mgnJoined || now
      },
      thumbnail: game?.thumbnail || '/games/placeholder.png',
      metrics: {
        ...formData.metrics!,
        topGeographicPlayers: formData.metrics?.topGeographicPlayers || []
      },
      owner: formData.owner!
    } as Game

    onSave(completeGameData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{game ? 'Edit Game' : 'Add New Game'}</DialogTitle>
          <DialogDescription>
            {game ? 'Edit the game details below.' : 'Fill in the details for the new game.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Game Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="robloxLink">Roblox Game Link</Label>
              <Input
                id="robloxLink"
                value={formData.robloxLink}
                onChange={(e) => setFormData({ ...formData, robloxLink: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) => setFormData({ ...formData, genre: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dau">Daily Active Users</Label>
                <Input
                  id="dau"
                  type="number"
                  value={formData.metrics?.dau}
                  onChange={(e) => setFormData({
                    ...formData,
                    metrics: { ...formData.metrics!, dau: parseInt(e.target.value) }
                  })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="mau">Monthly Active Users</Label>
                <Input
                  id="mau"
                  type="number"
                  value={formData.metrics?.mau}
                  onChange={(e) => setFormData({
                    ...formData,
                    metrics: { ...formData.metrics!, mau: parseInt(e.target.value) }
                  })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="retention">Day 1 Retention (%)</Label>
                <Input
                  id="retention"
                  type="number"
                  step="0.1"
                  value={formData.metrics?.day1Retention}
                  onChange={(e) => setFormData({
                    ...formData,
                    metrics: { ...formData.metrics!, day1Retention: parseFloat(e.target.value) }
                  })}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Owner Information</h3>
              
              <div>
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={formData.owner?.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    owner: { ...formData.owner!, name: e.target.value }
                  })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="discordId">Discord ID</Label>
                <Input
                  id="discordId"
                  value={formData.owner?.discordId}
                  onChange={(e) => setFormData({
                    ...formData,
                    owner: { ...formData.owner!, discordId: e.target.value }
                  })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.owner?.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    owner: { ...formData.owner!, email: e.target.value }
                  })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.owner?.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    owner: { ...formData.owner!, country: e.target.value }
                  })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {game ? 'Save Changes' : 'Add Game'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 