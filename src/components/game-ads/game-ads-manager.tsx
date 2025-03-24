'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GameAd, GAME_AD_TEMPLATES } from '@/types/gameAd'
import { GameAdDialog } from './game-ad-dialog'

export function GameAdsManager() {
  const [gameAds, setGameAds] = useState<GameAd[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<GameAd | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load game ads
  useEffect(() => {
    const loadGameAds = async () => {
      try {
        const response = await fetch('/api/game-ads')
        const data = await response.json()
        setGameAds(data.gameAds)
      } catch (error) {
        console.error('Error loading game ads:', error)
      }
    }
    loadGameAds()
  }, [])

  const handleDeleteAd = async (adId: string) => {
    if (confirm('Are you sure you want to delete this game ad?')) {
      try {
        await fetch(`/api/game-ads/${adId}`, { method: 'DELETE' })
        setGameAds(gameAds.filter(ad => ad.id !== adId))
      } catch (error) {
        console.error('Error deleting game ad:', error)
      }
    }
  }

  const filteredAds = gameAds.filter(ad => 
    ad.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Game Ads Manager</h1>
        <Input
          placeholder="Search ads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm mx-4"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Ad Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAME_AD_TEMPLATES.map(template => (
            <Card key={template.id} className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => {
                setSelectedAd({
                  id: '',
                  name: '',
                  templateType: template.id,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  assets: template.requiredAssetTypes.map(assetType => ({
                    assetType,
                    assetId: '',
                  })),
                })
                setIsDialogOpen(true)
              }}
            >
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative mb-4">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="rounded-lg object-cover w-full h-full"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Create New Ad</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Game Ads</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map(ad => (
            <Card key={ad.id}>
              <CardHeader>
                <CardTitle>{ad.name}</CardTitle>
                <CardDescription>
                  Template: {GAME_AD_TEMPLATES.find(t => t.id === ad.templateType)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <div>Created: {new Date(ad.createdAt).toLocaleDateString()}</div>
                  <div>Last Updated: {new Date(ad.updatedAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAd(ad)
                    setIsDialogOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAd(ad.id)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <GameAdDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedAd(null)
        }}
        initialData={selectedAd}
        onSave={async (adData) => {
          try {
            const method = selectedAd?.id ? 'PUT' : 'POST'
            const url = selectedAd?.id ? `/api/game-ads/${selectedAd.id}` : '/api/game-ads'
            
            console.log('Saving game ad:', { method, url, adData })
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(adData)
            })

            if (!response.ok) {
              const errorData = await response.json()
              console.error('Server error:', errorData)
              throw new Error(`Failed to save game ad: ${errorData.error || response.statusText}`)
            }

            const savedAd = await response.json()
            console.log('Saved game ad:', savedAd)
            
            if (selectedAd?.id) {
              setGameAds(ads => ads.map(ad => ad.id === selectedAd.id ? savedAd : ad))
            } else {
              setGameAds(ads => [...ads, savedAd])
            }
            
            setIsDialogOpen(false)
            setSelectedAd(null)
          } catch (error) {
            console.error('Error saving game ad:', error)
            alert('Failed to save game ad. Please try again.')
          }
        }}
      />
    </div>
  )
} 