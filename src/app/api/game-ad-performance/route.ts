import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface GameAdPerformanceMetrics {
  totalImpressions: number
  uniqueImpressions: number
  totalEngagements: number
  uniqueEngagements: number
  averageEngagementDuration: number
  engagementRate: number
  completionRate: number
  conversionRate: number
}

interface GameAdPerformance {
  id: string
  gameAdId: string
  gameId: string
  metrics: GameAdPerformanceMetrics
  demographics: {
    gender: Record<string, number>
    ageGroup: Record<string, number>
    geographicRegion: Record<string, number>
    language: Record<string, number>
    deviceType: Record<string, number>
    platform: Record<string, number>
  }
  performanceTrends: {
    daily: {
      date: string
      impressions: number
      engagements: number
      engagementRate: number
    }[]
  }
}

interface GameAdPerformanceDatabase {
  version: string
  lastUpdated: string
  performanceData: GameAdPerformance[]
}

const performancePath = join(process.cwd(), 'data/game-ad-performance.json')

// Initialize data file if it doesn't exist
async function initDataFile() {
  try {
    await readFile(performancePath, 'utf8')
  } catch {
    // Create data directory if it doesn't exist
    await mkdir(join(process.cwd(), 'data'), { recursive: true })
    // Create initial data file
    const initialData: GameAdPerformanceDatabase = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      performanceData: []
    }
    await writeFile(performancePath, JSON.stringify(initialData, null, 2))
  }
}

export async function GET() {
  try {
    await initDataFile()
    const content = await readFile(performancePath, 'utf8')
    const data: GameAdPerformanceDatabase = JSON.parse(content)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading game ad performance:', error)
    return NextResponse.json(
      { error: 'Failed to read game ad performance' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDataFile()
    const performance = await request.json()
    const content = await readFile(performancePath, 'utf8')
    const data: GameAdPerformanceDatabase = JSON.parse(content)
    
    // Generate next performance ID
    const existingIds = data.performanceData.map((p: GameAdPerformance): number => parseInt(p.id.replace('perf_', '')) || 0)
    const nextId = Math.max(...existingIds, 0) + 1
    const performanceId = `perf_${nextId.toString().padStart(3, '0')}`
    
    const newPerformance: GameAdPerformance = {
      id: performanceId,
      gameAdId: performance.gameAdId,
      gameId: performance.gameId,
      metrics: {
        totalImpressions: performance.metrics?.totalImpressions || 0,
        uniqueImpressions: performance.metrics?.uniqueImpressions || 0,
        totalEngagements: performance.metrics?.totalEngagements || 0,
        uniqueEngagements: performance.metrics?.uniqueEngagements || 0,
        averageEngagementDuration: performance.metrics?.averageEngagementDuration || 0,
        engagementRate: performance.metrics?.engagementRate || 0,
        completionRate: performance.metrics?.completionRate || 0,
        conversionRate: performance.metrics?.conversionRate || 0
      },
      demographics: {
        gender: performance.demographics?.gender || {},
        ageGroup: performance.demographics?.ageGroup || {},
        geographicRegion: performance.demographics?.geographicRegion || {},
        language: performance.demographics?.language || {},
        deviceType: performance.demographics?.deviceType || {},
        platform: performance.demographics?.platform || {}
      },
      performanceTrends: {
        daily: performance.performanceTrends?.daily || []
      }
    }

    data.performanceData.push(newPerformance)
    data.lastUpdated = new Date().toISOString()
    
    await writeFile(performancePath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true, performance: newPerformance })
  } catch (error) {
    console.error('Error creating game ad performance:', error)
    return NextResponse.json(
      { error: 'Failed to create game ad performance' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initDataFile()
    const { id, ...updates } = await request.json()
    const content = await readFile(performancePath, 'utf8')
    const data: GameAdPerformanceDatabase = JSON.parse(content)
    
    const performanceIndex = data.performanceData.findIndex((p: GameAdPerformance): boolean => p.id === id)
    if (performanceIndex === -1) {
      return NextResponse.json(
        { error: 'Game ad performance not found' },
        { status: 404 }
      )
    }
    
    data.performanceData[performanceIndex] = {
      ...data.performanceData[performanceIndex],
      ...updates,
      id // Preserve the original ID
    }
    data.lastUpdated = new Date().toISOString()
    
    await writeFile(performancePath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true, performance: data.performanceData[performanceIndex] })
  } catch (error) {
    console.error('Error updating game ad performance:', error)
    return NextResponse.json(
      { error: 'Failed to update game ad performance' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initDataFile()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Game ad performance ID is required' },
        { status: 400 }
      )
    }
    
    const content = await readFile(performancePath, 'utf8')
    const data: GameAdPerformanceDatabase = JSON.parse(content)
    
    const performanceIndex = data.performanceData.findIndex((p: GameAdPerformance): boolean => p.id === id)
    if (performanceIndex === -1) {
      return NextResponse.json(
        { error: 'Game ad performance not found' },
        { status: 404 }
      )
    }
    
    data.performanceData.splice(performanceIndex, 1)
    data.lastUpdated = new Date().toISOString()
    
    await writeFile(performancePath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game ad performance:', error)
    return NextResponse.json(
      { error: 'Failed to delete game ad performance' },
      { status: 500 }
    )
  }
} 