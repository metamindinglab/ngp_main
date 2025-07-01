# New Gen Pulse System - API Documentation

A comprehensive documentation of all public APIs, functions, and components for the Roblox Asset Management System.

## Table of Contents

1. [Overview](#overview)
2. [Data Types](#data-types)
3. [Database Layer](#database-layer)
4. [Server Actions](#server-actions)
5. [REST API Endpoints](#rest-api-endpoints)
6. [Roblox Integration](#roblox-integration)
7. [Game Objects Service](#game-objects-service)
8. [UI Components](#ui-components)
9. [Utility Functions](#utility-functions)
10. [Usage Examples](#usage-examples)

## Overview

The New Gen Pulse System is a Next.js-based application for managing Roblox assets, games, advertisements, and playlists. It provides a comprehensive set of APIs for CRUD operations, Roblox integration, and media management.

## Data Types

### Asset Types

The system supports multiple asset types defined in `lib/types.ts`:

```typescript
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
```

### Base Asset Interface

```typescript
interface BaseAsset {
  id: string
  name: string
  description: string
  assetType: AssetType
  robloxAssetId: string
  createdAt: string
  updatedAt: string
  tags: string[]
}
```

### Specialized Asset Types

#### KOL Character Asset
```typescript
interface KOLCharacterAsset extends BaseAsset {
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
```

#### Minigame Asset
```typescript
interface MinigameAsset extends BaseAsset {
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
```

#### Wearable Assets
```typescript
interface WearableAsset extends BaseAsset {
  image: string
  previewImage?: string
  compatibility?: string[]
  brands?: string[]
}

// Specific implementations: HatAsset, ClothingAsset, ShoeAsset, ItemAsset
```

#### Media Assets
```typescript
interface ImageAsset extends BaseAsset {
  assetType: "image"
  url: string
  dimensions: { width: number; height: number }
  fileFormat: string
  fileSize: number
}

interface AudioAsset extends BaseAsset {
  assetType: "audio"
  url: string
  duration: string
  fileFormat: string
  fileSize: number
}

interface VideoAsset extends BaseAsset {
  assetType: "video"
  url: string
  duration: string
  dimensions: { width: number; height: number }
  fileFormat: string
  fileSize: number
}
```

## Database Layer

### Core Database Functions

Located in `lib/db.ts`, these functions provide low-level data access:

#### `readDb(): Promise<AssetDatabase>`
Reads the entire database from the JSON file.

**Returns:** Promise that resolves to the complete database object.

**Example:**
```typescript
import { readDb } from '@/lib/db'

const database = await readDb()
console.log(database.assets.length) // Number of assets
```

#### `writeDb(db: AssetDatabase): Promise<void>`
Writes the entire database to the JSON file.

**Parameters:**
- `db`: Complete database object to write

**Example:**
```typescript
import { readDb, writeDb } from '@/lib/db'

const db = await readDb()
db.assets.push(newAsset)
await writeDb(db)
```

#### `getAssets(): Promise<RobloxAsset[]>`
Retrieves all assets from the database.

**Returns:** Array of all assets

**Example:**
```typescript
import { getAssets } from '@/lib/db'

const assets = await getAssets()
const characterAssets = assets.filter(asset => asset.assetType === 'kol_character')
```

#### `getAssetById(id: string): Promise<RobloxAsset | undefined>`
Retrieves a specific asset by its ID.

**Parameters:**
- `id`: Unique identifier of the asset

**Returns:** Asset object or undefined if not found

**Example:**
```typescript
import { getAssetById } from '@/lib/db'

const asset = await getAssetById('asset-123')
if (asset) {
  console.log(`Found asset: ${asset.name}`)
}
```

#### `addAsset(asset: Omit<RobloxAsset, "id" | "createdAt" | "updatedAt">): Promise<RobloxAsset>`
Adds a new asset to the database.

**Parameters:**
- `asset`: Asset data without id, createdAt, and updatedAt fields

**Returns:** Complete asset object with generated ID and timestamps

**Example:**
```typescript
import { addAsset } from '@/lib/db'

const newAsset = await addAsset({
  name: "Cool Hat",
  description: "A stylish hat for avatars",
  assetType: "hat",
  robloxAssetId: "12345",
  tags: ["fashion", "accessory"],
  image: "https://example.com/hat.png"
})
```

#### `updateAssetById(id: string, updates: Partial<RobloxAsset>): Promise<RobloxAsset | undefined>`
Updates an existing asset.

**Parameters:**
- `id`: Asset ID to update
- `updates`: Partial asset object with fields to update

**Returns:** Updated asset or undefined if not found

**Example:**
```typescript
import { updateAssetById } from '@/lib/db'

const updated = await updateAssetById('asset-123', {
  name: "Updated Hat Name",
  tags: ["fashion", "accessory", "popular"]
})
```

#### `deleteAssetById(id: string): Promise<boolean>`
Deletes an asset from the database.

**Parameters:**
- `id`: Asset ID to delete

**Returns:** True if deleted, false if not found

**Example:**
```typescript
import { deleteAssetById } from '@/lib/db'

const deleted = await deleteAssetById('asset-123')
if (deleted) {
  console.log('Asset successfully deleted')
}
```

## Server Actions

### Asset Management Actions

Located in `lib/actions.ts`, these are server actions for use in React Server Components:

#### `getAllAssets()`
Fetches all assets with error handling.

**Usage:**
```typescript
import { getAllAssets } from '@/lib/actions'

// In a Server Component
export default async function AssetsPage() {
  const assets = await getAllAssets()
  
  return (
    <div>
      {assets.map(asset => (
        <div key={asset.id}>{asset.name}</div>
      ))}
    </div>
  )
}
```

#### `getAssetById(id: string)`
Fetches a single asset by ID with error handling.

**Parameters:**
- `id`: Asset identifier

**Usage:**
```typescript
import { getAssetById } from '@/lib/actions'

export default async function AssetPage({ params }: { params: { id: string } }) {
  const asset = await getAssetById(params.id)
  
  if (!asset) {
    return <div>Asset not found</div>
  }
  
  return <div>{asset.name}</div>
}
```

#### `createAsset(data: any)`
Creates a new asset and revalidates the cache.

**Parameters:**
- `data`: Asset data object

**Returns:** Success object or throws error

**Usage:**
```typescript
import { createAsset } from '@/lib/actions'

// In a form action
export async function handleCreateAsset(formData: FormData) {
  const assetData = {
    name: formData.get('name'),
    description: formData.get('description'),
    assetType: formData.get('assetType'),
    // ... other fields
  }
  
  try {
    await createAsset(assetData)
    redirect('/assets')
  } catch (error) {
    console.error('Failed to create asset:', error)
  }
}
```

#### `updateAsset(id: string, data: any)`
Updates an existing asset and revalidates related pages.

**Parameters:**
- `id`: Asset ID to update
- `data`: Updated asset data

**Usage:**
```typescript
import { updateAsset } from '@/lib/actions'

export async function handleUpdateAsset(id: string, formData: FormData) {
  const updates = {
    name: formData.get('name'),
    description: formData.get('description'),
    // ... other fields
  }
  
  await updateAsset(id, updates)
}
```

#### `deleteAsset(id: string)`
Deletes an asset and revalidates the cache.

**Parameters:**
- `id`: Asset ID to delete

**Usage:**
```typescript
import { deleteAsset } from '@/lib/actions'

export async function handleDeleteAsset(id: string) {
  await deleteAsset(id)
  // Automatically revalidates the assets page
}
```

## REST API Endpoints

### Assets API (`/api/assets`)

#### GET `/api/assets`
Retrieves all assets.

**Response:**
```json
{
  "assets": [
    {
      "id": "asset-123",
      "name": "Cool Hat",
      "description": "A stylish hat",
      "assetType": "hat",
      "robloxAssetId": "12345",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "tags": ["fashion"]
    }
  ]
}
```

#### POST `/api/assets`
Creates a new asset.

**Request Body:**
```json
{
  "name": "New Asset",
  "description": "Asset description",
  "assetType": "hat",
  "robloxAssetId": "67890",
  "tags": ["new"]
}
```

**Response:**
```json
{
  "success": true,
  "asset": { /* created asset object */ }
}
```

#### PUT `/api/assets`
Updates an existing asset.

**Request Body:**
```json
{
  "id": "asset-123",
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### DELETE `/api/assets`
Deletes an asset.

**Request Body:**
```json
{
  "id": "asset-123"
}
```

### Individual Asset API (`/api/assets/[id]`)

#### GET `/api/assets/[id]`
Retrieves a specific asset.

**Response:**
```json
{
  "asset": { /* asset object */ }
}
```

#### PUT `/api/assets/[id]`
Updates a specific asset.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### DELETE `/api/assets/[id]`
Deletes a specific asset.

**Response:**
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

### Games API (`/api/games`)

#### GET `/api/games`
Retrieves all games.

#### POST `/api/games`
Creates a new game.

**Request Body:**
```json
{
  "name": "My Game",
  "description": "Game description",
  "robloxLink": "https://www.roblox.com/games/123456"
}
```

#### PUT `/api/games`
Updates an existing game.

#### DELETE `/api/games`
Deletes a game.

### Game Ads API (`/api/game-ads`)

#### GET `/api/game-ads`
Retrieves all game advertisements.

#### POST `/api/game-ads`
Creates a new game advertisement.

### Playlists API (`/api/playlists`)

#### GET `/api/playlists`
Retrieves all playlists.

#### POST `/api/playlists`
Creates a new playlist.

#### PUT `/api/playlists`
Updates an existing playlist.

#### DELETE `/api/playlists`
Deletes a playlist.

### Media API (`/api/media`)

#### POST `/api/media`
Uploads media files.

**Request:** Multipart form data with file

**Response:**
```json
{
  "success": true,
  "url": "https://storage.url/uploaded-file.jpg",
  "metadata": {
    "filename": "file.jpg",
    "size": 1024,
    "type": "image/jpeg"
  }
}
```

### Roblox Integration APIs

#### GET `/api/roblox/[...path]`
Proxy for Roblox API calls with authentication.

#### POST `/api/roblox/upload`
Uploads assets to Roblox.

#### POST `/api/roblox/upload-asset`
Uploads specific asset types to Roblox.

#### GET `/api/roblox/thumbnail/[id]`
Retrieves asset thumbnails from Roblox.

## Roblox Integration

### Core Functions

Located in `src/lib/roblox.ts`:

#### `extractPlaceId(url: string): number | null`
Extracts place ID from a Roblox game URL.

**Parameters:**
- `url`: Roblox game URL

**Returns:** Place ID number or null if invalid

**Example:**
```typescript
import { extractPlaceId } from '@/lib/roblox'

const placeId = extractPlaceId('https://www.roblox.com/games/123456/My-Game')
console.log(placeId) // 123456
```

#### `getUniverseId(placeId: number): Promise<number>`
Converts a place ID to universe ID using Roblox API.

**Parameters:**
- `placeId`: Roblox place ID

**Returns:** Promise resolving to universe ID

**Example:**
```typescript
import { getUniverseId } from '@/lib/roblox'

const universeId = await getUniverseId(123456)
console.log(`Universe ID: ${universeId}`)
```

#### `getRobloxGameInfo(placeId: string): Promise<Game>`
Fetches comprehensive game information from Roblox.

**Parameters:**
- `placeId`: Roblox place ID as string

**Returns:** Promise resolving to complete Game object

**Example:**
```typescript
import { getRobloxGameInfo } from '@/lib/roblox'

const gameInfo = await getRobloxGameInfo('123456')
console.log(`Game: ${gameInfo.name}`)
console.log(`Players: ${gameInfo.robloxInfo.stats.playing}`)
console.log(`Visits: ${gameInfo.robloxInfo.stats.visits}`)
```

## Game Objects Service

### Game Object Management

Located in `lib/gameObjectsService.ts`:

#### `getGameObjects(gameId: string): Promise<GameObject[]>`
Retrieves all objects for a specific game.

**Parameters:**
- `gameId`: Game identifier

**Returns:** Array of game objects

**Example:**
```typescript
import { getGameObjects } from '@/lib/gameObjectsService'

const objects = await getGameObjects('game-123')
console.log(`Found ${objects.length} objects`)
```

#### `getGameObject(gameId: string, objectId: string): Promise<GameObject | undefined>`
Retrieves a specific object from a game.

**Parameters:**
- `gameId`: Game identifier
- `objectId`: Object identifier

**Example:**
```typescript
import { getGameObject } from '@/lib/gameObjectsService'

const object = await getGameObject('game-123', 'obj-456')
if (object) {
  console.log(`Object: ${object.name}`)
}
```

#### `addGameObject(gameId: string, object: Omit<GameObject, "id">): Promise<GameObject>`
Adds a new object to a game.

**Parameters:**
- `gameId`: Game identifier
- `object`: Object data without ID

**Returns:** Created object with generated ID

**Example:**
```typescript
import { addGameObject } from '@/lib/gameObjectsService'

const newObject = await addGameObject('game-123', {
  name: "Treasure Chest",
  type: "interactive",
  position: { x: 0, y: 0, z: 0 },
  properties: { loot: "coins" }
})
```

#### `updateGameObject(gameId: string, objectId: string, updates: Partial<GameObject>): Promise<GameObject | undefined>`
Updates an existing game object.

#### `deleteGameObject(gameId: string, objectId: string): Promise<boolean>`
Deletes an object from a game.

#### `validateSessionToken(token: string): { gameId: string; timestamp: number } | null`
Validates a session token for game access.

**Parameters:**
- `token`: Base64 encoded session token

**Returns:** Decoded token data or null if invalid

## UI Components

### Core UI Components

Located in `src/components/ui/`:

#### Button Component
```typescript
interface ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}
```

**Usage:**
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">
  Click Me
</Button>

<Button variant="destructive" onClick={handleDelete}>
  Delete Asset
</Button>
```

#### Input Component
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

**Usage:**
```tsx
import { Input } from '@/components/ui/input'

<Input 
  type="text" 
  placeholder="Asset name" 
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

#### Card Component
```typescript
interface CardProps {
  className?: string
  children: React.ReactNode
}
```

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Asset Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Asset information goes here</p>
  </CardContent>
</Card>
```

#### Dialog Component
```typescript
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}
```

**Usage:**
```tsx
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Asset</DialogTitle>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

#### Form Components
```tsx
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="assetName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Asset Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter asset name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Save Asset</Button>
  </form>
</Form>
```

#### Table Component
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {assets.map((asset) => (
      <TableRow key={asset.id}>
        <TableCell>{asset.name}</TableCell>
        <TableCell>{asset.assetType}</TableCell>
        <TableCell>
          <Button size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Toast Notifications
```tsx
import { useToast } from '@/components/ui/use-toast'

function MyComponent() {
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Asset created successfully",
      variant: "default",
    })
  }

  const handleError = () => {
    toast({
      title: "Error",
      description: "Failed to create asset",
      variant: "destructive",
    })
  }
}
```

## Utility Functions

### Core Utilities

Located in `lib/utils.ts` and `src/lib/utils.ts`:

#### `cn(...inputs: ClassValue[]): string`
Combines CSS classes using clsx and tailwind-merge.

**Usage:**
```typescript
import { cn } from '@/lib/utils'

const buttonClasses = cn(
  "px-4 py-2 rounded",
  variant === "primary" && "bg-blue-500",
  disabled && "opacity-50 cursor-not-allowed"
)
```

### Media Storage Functions

Located in `src/lib/media-storage.ts`:

#### `downloadMedia(url: string, filename: string): Promise<MediaMetadata>`
Downloads media from a URL and stores it locally.

#### `MediaStorageError`
Custom error class for media storage operations.

### Scheduled Tasks

Located in `src/lib/scheduled-tasks.ts`:

#### Task scheduling utilities for automated operations.

## Usage Examples

### Complete Asset Management Workflow

```typescript
// 1. Create a new asset
import { createAsset } from '@/lib/actions'

const newAsset = await createAsset({
  name: "Superhero Cape",
  description: "A flowing cape for superhero characters",
  assetType: "clothing",
  robloxAssetId: "987654321",
  tags: ["superhero", "cape", "clothing"],
  image: "https://example.com/cape.png",
  compatibility: ["superhero_character", "action_character"]
})

// 2. Fetch and display assets
import { getAllAssets } from '@/lib/actions'

export default async function AssetsPage() {
  const assets = await getAllAssets()
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {assets.map((asset) => (
        <Card key={asset.id}>
          <CardHeader>
            <CardTitle>{asset.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{asset.description}</p>
            <Badge variant="secondary">{asset.assetType}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// 3. Update an asset
import { updateAsset } from '@/lib/actions'

const handleUpdate = async (assetId: string) => {
  await updateAsset(assetId, {
    name: "Updated Superhero Cape",
    tags: ["superhero", "cape", "clothing", "popular"]
  })
}

// 4. Delete an asset
import { deleteAsset } from '@/lib/actions'

const handleDelete = async (assetId: string) => {
  const confirmed = confirm("Are you sure you want to delete this asset?")
  if (confirmed) {
    await deleteAsset(assetId)
  }
}
```

### Roblox Integration Example

```typescript
import { getRobloxGameInfo, extractPlaceId } from '@/lib/roblox'

// Extract place ID from URL and fetch game info
const gameUrl = "https://www.roblox.com/games/123456789/My-Amazing-Game"
const placeId = extractPlaceId(gameUrl)

if (placeId) {
  const gameInfo = await getRobloxGameInfo(placeId.toString())
  
  console.log(`Game: ${gameInfo.name}`)
  console.log(`Description: ${gameInfo.description}`)
  console.log(`Current Players: ${gameInfo.robloxInfo.stats.playing}`)
  console.log(`Total Visits: ${gameInfo.robloxInfo.stats.visits}`)
  console.log(`Max Players: ${gameInfo.robloxInfo.gameSettings.maxPlayers}`)
  
  // Access server information
  gameInfo.robloxInfo.servers.forEach((server, index) => {
    console.log(`Server ${index + 1}: ${server.playing}/${server.maxPlayers} players`)
  })
}
```

### Form Integration Example

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createAsset } from '@/lib/actions'

const assetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  assetType: z.enum(["hat", "clothing", "shoes", "item"]),
  robloxAssetId: z.string().min(1, "Roblox Asset ID is required"),
  tags: z.array(z.string()).optional()
})

type AssetFormData = z.infer<typeof assetSchema>

export function AssetCreateForm() {
  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      description: "",
      assetType: "hat",
      robloxAssetId: "",
      tags: []
    }
  })

  const onSubmit = async (data: AssetFormData) => {
    try {
      await createAsset(data)
      toast({
        title: "Success",
        description: "Asset created successfully",
      })
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create asset",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter asset name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="assetType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="hat">Hat</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="shoes">Shoes</SelectItem>
                  <SelectItem value="item">Item</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Create Asset</Button>
      </form>
    </Form>
  )
}
```

### API Integration Example

```typescript
// Client-side API calls
class AssetService {
  static async fetchAssets() {
    const response = await fetch('/api/assets')
    if (!response.ok) throw new Error('Failed to fetch assets')
    return response.json()
  }

  static async createAsset(assetData: any) {
    const response = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetData)
    })
    if (!response.ok) throw new Error('Failed to create asset')
    return response.json()
  }

  static async updateAsset(id: string, updates: any) {
    const response = await fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update asset')
    return response.json()
  }

  static async deleteAsset(id: string) {
    const response = await fetch(`/api/assets/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete asset')
    return response.json()
  }
}

// Usage in React components
import { useState, useEffect } from 'react'

export function AssetList() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AssetService.fetchAssets()
      .then(data => {
        setAssets(data.assets)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching assets:', error)
        setLoading(false)
      })
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await AssetService.deleteAsset(id)
      setAssets(assets.filter(asset => asset.id !== id))
    } catch (error) {
      console.error('Error deleting asset:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {assets.map(asset => (
        <div key={asset.id} className="flex justify-between items-center p-4 border rounded">
          <div>
            <h3>{asset.name}</h3>
            <p>{asset.description}</p>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => handleDelete(asset.id)}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  )
}
```

## Error Handling

### Common Error Patterns

```typescript
// Database errors
try {
  const asset = await getAssetById('invalid-id')
} catch (error) {
  if (error instanceof Error) {
    console.error('Database error:', error.message)
  }
}

// API errors
try {
  const response = await fetch('/api/assets')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
} catch (error) {
  console.error('API error:', error)
}

// Roblox integration errors
try {
  const gameInfo = await getRobloxGameInfo('123456')
} catch (error) {
  console.error('Roblox API error:', error)
  // Handle fallback or show error message
}
```

## Best Practices

1. **Always use TypeScript types** for better type safety
2. **Handle errors gracefully** with try-catch blocks
3. **Use server actions** for database operations in Server Components
4. **Implement proper validation** using Zod schemas
5. **Cache revalidation** is handled automatically by server actions
6. **Use the UI components consistently** for better UX
7. **Follow the established patterns** shown in examples

## Contributing

When adding new APIs or components:

1. Follow existing naming conventions
2. Add proper TypeScript types
3. Include error handling
4. Document with JSDoc comments
5. Add usage examples
6. Update this documentation

---

This documentation covers all major public APIs, functions, and components in the New Gen Pulse System. For specific implementation details, refer to the source code in the respective files.