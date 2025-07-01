# Component Documentation

This document provides detailed documentation for all React components in the New Gen Pulse System.

## Table of Contents

1. [UI Components](#ui-components)
2. [Business Logic Components](#business-logic-components)
3. [Layout Components](#layout-components)
4. [Form Components](#form-components)
5. [Display Components](#display-components)
6. [Dialog Components](#dialog-components)

## UI Components

### Button

**Location:** `src/components/ui/button.tsx`

A versatile button component with multiple variants and sizes.

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}
```

**Props:**
- `variant`: Visual style variant
- `size`: Button size
- `asChild`: Render as child element (using Radix Slot)

**Examples:**
```tsx
// Basic usage
<Button>Click me</Button>

// Different variants
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle action</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// As child (for links)
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

### Input

**Location:** `src/components/ui/input.tsx`

Standard form input component with consistent styling.

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

**Examples:**
```tsx
// Text input
<Input type="text" placeholder="Enter your name" />

// Email input
<Input type="email" placeholder="Enter your email" />

// With controlled state
<Input 
  value={value} 
  onChange={(e) => setValue(e.target.value)}
  placeholder="Controlled input"
/>

// With form integration
<Input {...register("fieldName")} />
```

### Card

**Location:** `src/components/ui/card.tsx`

Container component for grouping related content.

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
```

**Sub-components:**
- `Card`: Main container
- `CardHeader`: Header section
- `CardTitle`: Title within header
- `CardDescription`: Description within header
- `CardContent`: Main content area
- `CardFooter`: Footer section

**Examples:**
```tsx
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Asset Details</CardTitle>
    <CardDescription>Information about this asset</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Asset content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Asset card example
<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>{asset.name}</CardTitle>
    <CardDescription>{asset.assetType}</CardDescription>
  </CardHeader>
  <CardContent>
    <img src={asset.image} alt={asset.name} className="w-full h-48 object-cover" />
    <p className="mt-2">{asset.description}</p>
  </CardContent>
  <CardFooter className="flex gap-2">
    <Button size="sm">Edit</Button>
    <Button size="sm" variant="destructive">Delete</Button>
  </CardFooter>
</Card>
```

### Dialog

**Location:** `src/components/ui/dialog.tsx`

Modal dialog component for overlays and forms.

```typescript
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}
```

**Sub-components:**
- `Dialog`: Root component
- `DialogTrigger`: Trigger element
- `DialogContent`: Main dialog content
- `DialogHeader`: Header section
- `DialogTitle`: Dialog title
- `DialogDescription`: Dialog description
- `DialogFooter`: Footer section
- `DialogClose`: Close trigger

**Examples:**
```tsx
// Basic dialog
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Asset</DialogTitle>
      <DialogDescription>
        Make changes to your asset here.
      </DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Controlled dialog
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Deletion</DialogTitle>
    </DialogHeader>
    <p>Are you sure you want to delete this asset?</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form

**Location:** `src/components/ui/form.tsx`

Form components built on react-hook-form for type-safe forms.

```typescript
interface FormFieldProps {
  control: Control<any>
  name: string
  render: ({ field }: { field: ControllerRenderProps }) => React.ReactElement
}
```

**Sub-components:**
- `Form`: Root form provider
- `FormField`: Individual field wrapper
- `FormItem`: Field container
- `FormLabel`: Field label
- `FormControl`: Control wrapper
- `FormDescription`: Field description
- `FormMessage`: Error message

**Examples:**
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
})

type FormData = z.infer<typeof formSchema>

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    }
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is your display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Table

**Location:** `src/components/ui/table.tsx`

Data table components for displaying tabular data.

**Sub-components:**
- `Table`: Root table element
- `TableHeader`: Table header
- `TableBody`: Table body
- `TableFooter`: Table footer
- `TableRow`: Table row
- `TableHead`: Header cell
- `TableCell`: Data cell
- `TableCaption`: Table caption

**Examples:**
```tsx
// Basic table
<Table>
  <TableCaption>A list of your recent assets.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[100px]">ID</TableHead>
      <TableHead>Name</TableHead>
      <TableHead>Type</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {assets.map((asset) => (
      <TableRow key={asset.id}>
        <TableCell className="font-medium">{asset.id}</TableCell>
        <TableCell>{asset.name}</TableCell>
        <TableCell>{asset.assetType}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Sortable table with actions
function AssetsTable({ assets }: { assets: RobloxAsset[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell>
              <div className="font-medium">{asset.name}</div>
              <div className="text-sm text-muted-foreground">
                {asset.description}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{asset.assetType}</Badge>
            </TableCell>
            <TableCell>
              {new Date(asset.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Select

**Location:** `src/components/ui/select.tsx`

Dropdown select component with search and keyboard navigation.

```typescript
interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  disabled?: boolean
}
```

**Sub-components:**
- `Select`: Root component
- `SelectTrigger`: Trigger button
- `SelectValue`: Selected value display
- `SelectContent`: Dropdown content
- `SelectItem`: Individual option
- `SelectGroup`: Option group
- `SelectLabel`: Group label

**Examples:**
```tsx
// Basic select
<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select asset type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="hat">Hat</SelectItem>
    <SelectItem value="clothing">Clothing</SelectItem>
    <SelectItem value="shoes">Shoes</SelectItem>
  </SelectContent>
</Select>

// Controlled select
const [assetType, setAssetType] = useState("")

<Select value={assetType} onValueChange={setAssetType}>
  <SelectTrigger>
    <SelectValue placeholder="Choose type" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Wearables</SelectLabel>
      <SelectItem value="hat">Hat</SelectItem>
      <SelectItem value="clothing">Clothing</SelectItem>
      <SelectItem value="shoes">Shoes</SelectItem>
    </SelectGroup>
    <SelectGroup>
      <SelectLabel>Media</SelectLabel>
      <SelectItem value="image">Image</SelectItem>
      <SelectItem value="audio">Audio</SelectItem>
      <SelectItem value="video">Video</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>

// With form integration
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
          {assetTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Toast

**Location:** `src/components/ui/toast.tsx`

Notification toast components for user feedback.

```typescript
interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: React.ReactNode
}
```

**Usage with hook:**
```tsx
import { useToast } from "@/components/ui/use-toast"

function MyComponent() {
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Your asset has been created.",
    })
  }

  const handleError = () => {
    toast({
      title: "Uh oh! Something went wrong.",
      description: "There was a problem with your request.",
      variant: "destructive",
    })
  }

  const handleWithAction = () => {
    toast({
      title: "Asset uploaded",
      description: "Your asset is now available.",
      action: (
        <ToastAction altText="View asset">
          <Button variant="outline" size="sm">
            View
          </Button>
        </ToastAction>
      ),
    })
  }

  return (
    <div>
      <Button onClick={handleSuccess}>Show success</Button>
      <Button onClick={handleError}>Show error</Button>
      <Button onClick={handleWithAction}>Show with action</Button>
    </div>
  )
}

// Don't forget to include the Toaster in your app
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <div>
      {/* Your app content */}
      <Toaster />
    </div>
  )
}
```

### Badge

**Location:** `src/components/ui/badge.tsx`

Small status indicators and labels.

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}
```

**Examples:**
```tsx
// Basic badges
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>

// Asset type badges
function AssetTypeBadge({ assetType }: { assetType: AssetType }) {
  const variant = {
    'kol_character': 'default',
    'clothing': 'secondary',
    'hat': 'secondary',
    'minigame': 'outline',
    'image': 'outline',
  }[assetType] || 'default'

  return (
    <Badge variant={variant}>
      {assetType.replace('_', ' ').toUpperCase()}
    </Badge>
  )
}

// Status badges
<Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
  {asset.status}
</Badge>
```

### Tabs

**Location:** `src/components/ui/tabs.tsx`

Tabbed interface component for organizing content.

```typescript
interface TabsProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}
```

**Sub-components:**
- `Tabs`: Root component
- `TabsList`: Tab navigation
- `TabsTrigger`: Individual tab button
- `TabsContent`: Tab panel content

**Examples:**
```tsx
// Basic tabs
<Tabs defaultValue="assets" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="assets">Assets</TabsTrigger>
    <TabsTrigger value="games">Games</TabsTrigger>
    <TabsTrigger value="ads">Advertisements</TabsTrigger>
  </TabsList>
  <TabsContent value="assets">
    <AssetsList />
  </TabsContent>
  <TabsContent value="games">
    <GamesList />
  </TabsContent>
  <TabsContent value="ads">
    <AdsList />
  </TabsContent>
</Tabs>

// Controlled tabs
const [activeTab, setActiveTab] = useState("overview")

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className="space-y-4">
    <AssetOverview asset={asset} />
  </TabsContent>
  <TabsContent value="details" className="space-y-4">
    <AssetDetails asset={asset} />
  </TabsContent>
  <TabsContent value="settings" className="space-y-4">
    <AssetSettings asset={asset} onUpdate={handleUpdate} />
  </TabsContent>
</Tabs>
```

## Business Logic Components

### Asset Upload Dialog

**Location:** `src/components/assets/asset-upload-dialog.tsx` (inferred)

A specialized dialog for uploading new assets.

**Usage Pattern:**
```tsx
function AssetUploadDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload New Asset</DialogTitle>
          <DialogDescription>
            Add a new asset to your collection.
          </DialogDescription>
        </DialogHeader>
        <AssetUploadForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

// Usage
const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

<Button onClick={() => setUploadDialogOpen(true)}>
  Upload Asset
</Button>
<AssetUploadDialog 
  open={uploadDialogOpen} 
  onOpenChange={setUploadDialogOpen} 
/>
```

## Layout Components

Layout components organize the overall structure of pages and sections.

### Dashboard Layout

**Pattern:**
```tsx
// Dashboard layout component
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-100">
        <Navigation />
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="border-b p-4">
          <h1>Dashboard</h1>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

// Page usage
export default function AssetsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between">
          <h2 className="text-3xl font-bold">Assets</h2>
          <Button>Add Asset</Button>
        </div>
        <AssetsTable />
      </div>
    </DashboardLayout>
  )
}
```

## Form Components

### Asset Creation Form

**Pattern:**
```tsx
interface AssetFormProps {
  initialData?: Partial<RobloxAsset>
  onSubmit: (data: AssetFormData) => Promise<void>
  onCancel?: () => void
}

function AssetForm({ initialData, onSubmit, onCancel }: AssetFormProps) {
  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      assetType: "hat",
      robloxAssetId: "",
      tags: []
    }
  })

  const handleSubmit = async (data: AssetFormData) => {
    try {
      await onSubmit(data)
      toast({
        title: "Success",
        description: "Asset saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save asset",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Form fields */}
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
```

## Display Components

### Asset Card

**Pattern:**
```tsx
interface AssetCardProps {
  asset: RobloxAsset
  onEdit?: (asset: RobloxAsset) => void
  onDelete?: (asset: RobloxAsset) => void
  onView?: (asset: RobloxAsset) => void
}

function AssetCard({ asset, onEdit, onDelete, onView }: AssetCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-gray-100">
        {asset.assetType === 'image' && (
          <img 
            src={(asset as ImageAsset).url} 
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{asset.name}</CardTitle>
          <AssetTypeBadge assetType={asset.assetType} />
        </div>
        <CardDescription className="line-clamp-2">
          {asset.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {asset.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onView && (
          <Button size="sm" variant="outline" onClick={() => onView(asset)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        )}
        {onEdit && (
          <Button size="sm" variant="outline" onClick={() => onEdit(asset)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => onDelete(asset)}
          >
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// Usage
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {assets.map((asset) => (
    <AssetCard
      key={asset.id}
      asset={asset}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
    />
  ))}
</div>
```

### Game Performance Chart

**Pattern:**
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface GamePerformanceChartProps {
  data: Array<{
    date: string
    players: number
    revenue: number
  }>
}

function GamePerformanceChart({ data }: GamePerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="players" 
              stroke="#8884d8" 
              name="Players"
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#82ca9d" 
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

## Component Composition Patterns

### Higher-Order Components

```tsx
// With loading state
function withLoading<T extends object>(
  Component: React.ComponentType<T>
) {
  return function WithLoadingComponent(props: T & { loading?: boolean }) {
    const { loading, ...restProps } = props
    
    if (loading) {
      return <div>Loading...</div>
    }
    
    return <Component {...(restProps as T)} />
  }
}

const AssetListWithLoading = withLoading(AssetList)

// Usage
<AssetListWithLoading assets={assets} loading={isLoading} />
```

### Compound Components

```tsx
// Asset manager compound component
function AssetManager({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<RobloxAsset[]>([])
  const [loading, setLoading] = useState(true)

  // Asset management logic here

  return (
    <AssetContext.Provider value={{ assets, loading, refetch }}>
      {children}
    </AssetContext.Provider>
  )
}

AssetManager.List = function AssetList() {
  const { assets, loading } = useAssetContext()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {assets.map(asset => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  )
}

AssetManager.Header = function AssetHeader() {
  return (
    <div className="flex justify-between items-center">
      <h2>Assets</h2>
      <Button>Add Asset</Button>
    </div>
  )
}

// Usage
<AssetManager>
  <AssetManager.Header />
  <AssetManager.List />
</AssetManager>
```

### Custom Hooks for Components

```tsx
// Custom hook for asset management
function useAssets() {
  const [assets, setAssets] = useState<RobloxAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllAssets()
      setAssets(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }, [])

  const createAsset = useCallback(async (assetData: AssetFormData) => {
    const newAsset = await createAsset(assetData)
    setAssets(prev => [...prev, newAsset])
    return newAsset
  }, [])

  const updateAsset = useCallback(async (id: string, updates: Partial<RobloxAsset>) => {
    const updated = await updateAsset(id, updates)
    setAssets(prev => prev.map(asset => 
      asset.id === id ? updated : asset
    ))
    return updated
  }, [])

  const deleteAsset = useCallback(async (id: string) => {
    await deleteAsset(id)
    setAssets(prev => prev.filter(asset => asset.id !== id))
  }, [])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  return {
    assets,
    loading,
    error,
    refetch: fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset
  }
}

// Usage in components
function AssetManagementPage() {
  const { 
    assets, 
    loading, 
    error, 
    createAsset, 
    updateAsset, 
    deleteAsset 
  } = useAssets()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <AssetList 
        assets={assets}
        onEdit={updateAsset}
        onDelete={deleteAsset}
      />
    </div>
  )
}
```

## Testing Components

### Example Test Patterns

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { AssetCard } from './AssetCard'

const mockAsset: RobloxAsset = {
  id: 'test-1',
  name: 'Test Asset',
  description: 'Test description',
  assetType: 'hat',
  robloxAssetId: '12345',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: ['test']
}

describe('AssetCard', () => {
  it('renders asset information correctly', () => {
    render(<AssetCard asset={mockAsset} />)
    
    expect(screen.getByText('Test Asset')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('HAT')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn()
    render(<AssetCard asset={mockAsset} onEdit={mockOnEdit} />)
    
    fireEvent.click(screen.getByText('Edit'))
    expect(mockOnEdit).toHaveBeenCalledWith(mockAsset)
  })

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn()
    render(<AssetCard asset={mockAsset} onDelete={mockOnDelete} />)
    
    fireEvent.click(screen.getByText('Delete'))
    expect(mockOnDelete).toHaveBeenCalledWith(mockAsset)
  })
})
```

---

This component documentation provides detailed information about how to use each component effectively. All components follow consistent patterns and integrate well with the overall system architecture.