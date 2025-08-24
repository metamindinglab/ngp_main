export interface GameAdContainer {
  id: string
  gameId: string
  name: string
  description: string | null
  type: string
  locationX: number
  locationY: number
  locationZ: number
  status: string
  currentAdId: string | null
  createdAt: Date
  updatedAt: Date
} 