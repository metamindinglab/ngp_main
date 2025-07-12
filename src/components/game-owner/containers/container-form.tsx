'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Box, Monitor, User } from 'lucide-react'

// Container type icons and descriptions
const containerTypes = {
  DISPLAY: {
    icon: Monitor,
    label: 'Display',
    description: 'Billboard or screen for displaying visual ads',
    defaultSize: { width: 10, height: 5 }
  },
  NPC: {
    icon: User,
    label: 'NPC',
    description: 'Interactive character that can engage with players',
    defaultSize: { width: 1, height: 2 }
  },
  MINIGAME: {
    icon: Box,
    label: 'Mini-game',
    description: 'Interactive area for mini-game experiences',
    defaultSize: { width: 10, height: 10, depth: 10 }
  }
}

const formSchema = z.object({
  gameId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(['DISPLAY', 'NPC', 'MINIGAME']),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE')
})

interface ContainerFormProps {
  gameId: string
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>
  initialData?: z.infer<typeof formSchema>
}

export function ContainerForm({ gameId, onSubmit, initialData }: ContainerFormProps) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      gameId,
      name: '',
      description: '',
      type: 'DISPLAY',
      position: { x: 0, y: 0, z: 0 },
      status: 'ACTIVE'
    }
  })

  const [previewMode, setPreviewMode] = React.useState(false)

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await onSubmit(data)
      toast({
        title: 'Success',
        description: 'Container saved successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save container',
        variant: 'destructive'
      })
    }
  }

  const selectedType = form.watch('type')
  const position = form.watch('position')
  const TypeIcon = containerTypes[selectedType as keyof typeof containerTypes].icon

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter container name" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for this ad container
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter container description"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional details about this container's location or purpose
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Container Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a container type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(containerTypes).map(([value, { icon: Icon, label, description }]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2" />
                        <div>
                          <div className="font-medium">{label}</div>
                          <div className="text-xs text-gray-500">{description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="position.x"
            render={({ field }) => (
              <FormItem>
                <FormLabel>X Position</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position.y"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Y Position</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position.z"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Z Position</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preview Card */}
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <TypeIcon className="w-8 h-8" />
            <div>
              <h4 className="font-medium">
                {containerTypes[selectedType as keyof typeof containerTypes].label} Preview
              </h4>
              <p className="text-sm text-gray-500">
                Position: ({position.x}, {position.y}, {position.z})
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative w-full h-40 bg-gray-100 rounded-lg">
              {/* Simple 2D visualization of the container position */}
              <div 
                className="absolute w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${((position.x + 50) / 100) * 100}%`,
                  top: `${((position.z + 50) / 100) * 100}%`
                }}
              />
            </div>
          </div>
        </Card>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save Container</Button>
      </form>
    </Form>
  )
} 