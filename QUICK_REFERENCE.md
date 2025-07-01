# Quick Reference Guide

A condensed reference for the New Gen Pulse System APIs and components.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check
```

## 📁 Key File Locations

| Component | Location |
|-----------|----------|
| Types | `lib/types.ts` |
| Database | `lib/db.ts` |
| Actions | `lib/actions.ts` |
| Roblox API | `src/lib/roblox.ts` |
| UI Components | `src/components/ui/` |
| API Routes | `src/app/api/` |

## 🎯 Common Usage Patterns

### Asset Management
```typescript
// Get all assets
const assets = await getAllAssets()

// Create asset
await createAsset({
  name: "Asset Name",
  assetType: "hat",
  description: "Description",
  robloxAssetId: "12345"
})

// Update asset
await updateAsset(id, { name: "New Name" })

// Delete asset
await deleteAsset(id)
```

### API Calls
```typescript
// Fetch assets
const response = await fetch('/api/assets')
const { assets } = await response.json()

// Create asset via API
await fetch('/api/assets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(assetData)
})
```

### Form Handling
```tsx
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "", description: "" }
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Toast Notifications
```tsx
const { toast } = useToast()

toast({
  title: "Success",
  description: "Operation completed",
  variant: "default" // or "destructive"
})
```

## 🎨 UI Components Cheat Sheet

### Button Variants
```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Button Sizes
```tsx
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Badge Variants
```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Card Structure
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Dialog Structure
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Table Structure
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## 🔗 API Endpoints

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | Get all assets |
| POST | `/api/assets` | Create asset |
| PUT | `/api/assets` | Update asset |
| DELETE | `/api/assets` | Delete asset |
| GET | `/api/assets/[id]` | Get specific asset |
| PUT | `/api/assets/[id]` | Update specific asset |
| DELETE | `/api/assets/[id]` | Delete specific asset |

### Games
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games` | Get all games |
| POST | `/api/games` | Create game |
| PUT | `/api/games` | Update game |
| DELETE | `/api/games` | Delete game |

### Game Ads
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/game-ads` | Get all ads |
| POST | `/api/game-ads` | Create ad |

### Playlists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/playlists` | Get all playlists |
| POST | `/api/playlists` | Create playlist |
| PUT | `/api/playlists` | Update playlist |
| DELETE | `/api/playlists` | Delete playlist |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/media` | Upload media |
| POST | `/api/media/cleanup` | Cleanup media |

### Roblox Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roblox/[...path]` | Proxy Roblox API |
| POST | `/api/roblox/upload` | Upload to Roblox |
| POST | `/api/roblox/upload-asset` | Upload asset to Roblox |
| GET | `/api/roblox/thumbnail/[id]` | Get thumbnail |

## 📊 Data Types

### Asset Types
```typescript
type AssetType = 
  | "kol_character" | "clothing" | "shoes" | "item" 
  | "animation" | "minigame" | "hat" 
  | "image" | "audio" | "video"
```

### Base Asset
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

### Specialized Assets
```typescript
// KOL Character
interface KOLCharacterAsset extends BaseAsset {
  assetType: "kol_character"
  characterType: string
  appearance: { /* appearance details */ }
  personality: string[]
  // ... more fields
}

// Media Assets
interface ImageAsset extends BaseAsset {
  assetType: "image"
  url: string
  dimensions: { width: number; height: number }
  fileFormat: string
  fileSize: number
}
```

## ⚡ Utility Functions

### Class Names
```typescript
import { cn } from '@/lib/utils'

const classes = cn(
  "base-class",
  condition && "conditional-class",
  "another-class"
)
```

### Roblox Integration
```typescript
import { extractPlaceId, getRobloxGameInfo } from '@/lib/roblox'

const placeId = extractPlaceId(gameUrl)
const gameInfo = await getRobloxGameInfo(placeId.toString())
```

## 🔧 Common Patterns

### Server Component (async)
```tsx
export default async function Page() {
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

### Client Component with State
```tsx
'use client'

export default function Component() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchData().then(setData).finally(() => setLoading(false))
  }, [])
  
  if (loading) return <div>Loading...</div>
  
  return <div>{/* content */}</div>
}
```

### Error Handling
```typescript
try {
  const result = await someOperation()
  toast({
    title: "Success",
    description: "Operation completed"
  })
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  })
}
```

## 🎮 Roblox Specific

### Extract Place ID
```typescript
const placeId = extractPlaceId('https://www.roblox.com/games/123456/Game-Name')
// Returns: 123456
```

### Get Game Info
```typescript
const gameInfo = await getRobloxGameInfo('123456')
console.log(gameInfo.name) // Game name
console.log(gameInfo.robloxInfo.stats.playing) // Current players
```

### Upload Asset
```typescript
const response = await fetch('/api/roblox/upload-asset', {
  method: 'POST',
  body: formData // Contains asset file and metadata
})
```

## 📝 Form Validation

### Zod Schema Example
```typescript
import * as z from "zod"

const assetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  assetType: z.enum(["hat", "clothing", "shoes", "item"]),
  robloxAssetId: z.string().min(1, "Roblox Asset ID is required"),
  tags: z.array(z.string()).optional()
})

type AssetFormData = z.infer<typeof assetSchema>
```

## 🚨 Error Patterns

### Database Errors
```typescript
try {
  const asset = await getAssetById(id)
} catch (error) {
  console.error('Database error:', error.message)
}
```

### API Errors
```typescript
const response = await fetch('/api/endpoint')
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`)
}
```

### Validation Errors
```typescript
const result = schema.safeParse(data)
if (!result.success) {
  console.error('Validation errors:', result.error.issues)
}
```

## 🔐 Environment Variables

Common environment variables you might need:
- `ROBLOX_API_KEY`: For Roblox API integration
- `DATABASE_URL`: Database connection string
- `NEXT_PUBLIC_APP_URL`: Public app URL

## 📱 Responsive Design

### Tailwind Breakpoints
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>

<Button className="w-full sm:w-auto">
  {/* Full width on mobile, auto on larger screens */}
</Button>
```

## 🎭 Icons

Using Lucide React icons:
```tsx
import { 
  Eye, Edit, Trash, Plus, Search, 
  Download, Upload, Settings 
} from 'lucide-react'

<Button size="sm">
  <Edit className="h-4 w-4 mr-2" />
  Edit
</Button>
```

## 📚 Testing

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'

test('renders component', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})

test('handles click events', () => {
  const mockFn = jest.fn()
  render(<Button onClick={mockFn}>Click me</Button>)
  fireEvent.click(screen.getByText('Click me'))
  expect(mockFn).toHaveBeenCalled()
})
```

---

📖 **For detailed documentation, see:**
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [COMPONENT_DOCUMENTATION.md](./COMPONENT_DOCUMENTATION.md) - Detailed component guide