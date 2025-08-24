export interface Container {
  id: string
  name: string
  description: string | null
  type: 'DISPLAY' | 'NPC' | 'MINIGAME'
  position: {
    x: number
    y: number
    z: number
  }
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  game: {
    id: string
    name: string
  }
  currentAd: {
    id: string
    name: string
    type: string
  } | null
} 