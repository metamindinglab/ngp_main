export type AssetType =
  | "kol_character"
  | "clothing"
  | "shoes"
  | "item"
  | "animation"
  | "minigame"
  | "hat"
  | "image"
  | "audio"
  | "video"

// Base interface for all assets
export interface BaseAsset {
  id: string
  name: string
  description: string
  assetType: AssetType
  robloxAssetId: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

// KOL Character specific interface
export interface KOLCharacterAsset extends BaseAsset {
  assetType: "kol_character"
  characterType: string
  appearance: {
    gender: "Male" | "Female" | "Neutral"
    style: string[]
    hairStyle: string
    hairColor: string
    height: "Tall" | "Medium" | "Short"
    features: string[]
  }
  personality: string[]
  defaultAnimations: string[]
  suitableFor: {
    brands: string[]
    products: string[]
    gameTypes: string[]
  }
  marketingCapabilities: string[]
}

// Minigame specific interface
export interface MinigameAsset extends BaseAsset {
  assetType: "minigame"
  difficulty: "Easy" | "Medium" | "Hard"
  maxPlayers: number
  gameplayDuration: string
  customizableElements: {
    id: string
    name: string
    type: string
    description: string
  }[]
  marketingCapabilities: string[]
}

// Wearable items base interface
export interface WearableAsset extends BaseAsset {
  image: string
  previewImage?: string
  compatibility?: string[] // KOL character types this item is compatible with
  brands?: string[]
}

// Specific wearable interfaces
export interface HatAsset extends WearableAsset {
  assetType: "hat"
}

export interface ClothingAsset extends WearableAsset {
  assetType: "clothing"
  size?: string[]
}

export interface ShoeAsset extends WearableAsset {
  assetType: "shoes"
  size?: string[]
}

export interface ItemAsset extends WearableAsset {
  assetType: "item"
  itemType: string // e.g., 'prop', 'tool', 'accessory'
}

// Animation asset interface
export interface AnimationAsset extends BaseAsset {
  assetType: "animation"
  duration: string
  category: string // e.g., 'emote', 'movement', 'action'
  previewUrl?: string
  compatibility?: string[] // KOL character types this animation is compatible with
}

// Media asset interfaces
export interface ImageAsset extends BaseAsset {
  assetType: "image"
  url: string
  dimensions: {
    width: number
    height: number
  }
  fileFormat: string
  fileSize: number
}

export interface AudioAsset extends BaseAsset {
  assetType: "audio"
  url: string
  duration: string
  fileFormat: string
  fileSize: number
}

export interface VideoAsset extends BaseAsset {
  assetType: "video"
  url: string
  duration: string
  dimensions: {
    width: number
    height: number
  }
  fileFormat: string
  fileSize: number
}

// Union type for all asset types
export type RobloxAsset =
  | KOLCharacterAsset
  | MinigameAsset
  | HatAsset
  | ClothingAsset
  | ShoeAsset
  | ItemAsset
  | AnimationAsset
  | ImageAsset
  | AudioAsset
  | VideoAsset

