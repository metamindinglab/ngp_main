import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Request validation schema
const ContainerRequestSchema = z.object({
  gameId: z.string(),
  containers: z.array(z.object({
    id: z.string(),
    type: z.enum(['DISPLAY', 'NPC', 'MINIGAME']),
    position: z.object({
      x: z.number(),
      y: z.number(), 
      z: z.number()
    }).optional(),
    isVisible: z.boolean().optional(),
    currentAdId: z.string().nullable().optional(),
    availableAds: z.array(z.string()).optional(),
    metrics: z.object({
      totalImpressions: z.number().optional(),
      impressionsByAd: z.record(z.number()).optional(),
      averageViewTime: z.number().optional(),
      sessionDuration: z.number().optional()
    }).optional(),
    config: z.object({
      hideWhenEmpty: z.boolean().optional(),
      enableAutoRotation: z.boolean().optional(),
      maxImpressionsPerAd: z.number().optional(),
      minPerformanceThreshold: z.number().optional()
    }).optional()
  })),
  playerContext: z.object({
    totalPlayers: z.number().optional(),
    serverRegion: z.string().optional(),
    gameTime: z.number().optional(),
    timestamp: z.number().optional(),
    demographics: z.record(z.number()).optional()
  }).optional(),
  currentAssignments: z.record(z.object({
    currentAdId: z.string().nullable().optional(),
    availableAds: z.array(z.string()).optional(),
    metrics: z.object({
      totalImpressions: z.number().optional(),
      impressionsByAd: z.record(z.number()).optional(),
      performanceScores: z.record(z.number()).optional()
    }).optional()
  })).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('X-API-Key')
    if (!apiKey || !apiKey.startsWith('RBXG-')) {
      return NextResponse.json({ 
        error: 'Invalid or missing API key' 
      }, { status: 401 })
    }

    // Find game by API key
    const game = await prisma.game.findFirst({
      where: { serverApiKey: apiKey },
      include: {
        gameOwner: true
      }
    })

    if (!game) {
      return NextResponse.json({ 
        error: 'Game not found for API key' 
      }, { status: 404 })
    }

    // Validate request body
    const body = await request.json()
    const validatedData = ContainerRequestSchema.parse(body)

    // Run Game Ad Feeding Engine
    const feedingResult = await gameAdFeedingEngine(
      validatedData.gameId,
      validatedData.containers,
      validatedData.playerContext,
      validatedData.currentAssignments
    )

    return NextResponse.json({
      success: true,
      containerAssignments: feedingResult.assignments,
      rotationSchedule: feedingResult.schedule,
      metadata: {
        totalAds: feedingResult.totalAds,
        assignmentStrategy: feedingResult.strategy,
        nextUpdate: feedingResult.nextUpdate,
        gameId: validatedData.gameId,
        timestamp: Date.now()
      }
    })

  } catch (error) {
    console.error('❌ Feeding engine error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request format',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Game Ad Feeding Engine Implementation
async function gameAdFeedingEngine(
  gameId: string, 
  containers: any[], 
  playerContext?: any,
  currentAssignments?: any
) {
  console.log('🎯 Running Game Ad Feeding Engine for game:', gameId)
  console.log('📊 Containers:', containers.length)
  console.log('👥 Player context:', playerContext)

  const assignments: Record<string, string[]> = {}
  const schedule: Record<string, any> = {}
  
  try {
    // Get available game ads for this game via active playlists
    const availableAds = await getAvailableGameAds(gameId)
    console.log('📦 Available ads:', availableAds.length)

    // Process each container
    for (const container of containers) {
      const containerId = container.id
      const containerType = container.type
      
      console.log(`🔄 Processing container ${containerId} (${containerType})`)
      
      // Filter ads suitable for this container type
      const suitableAds = availableAds.filter(ad => 
        isAdSuitableForContainer(ad, containerType)
      )
      
      console.log(`✅ Suitable ads for ${containerId}:`, suitableAds.length)
      
      if (suitableAds.length > 0) {
        // Apply feeding algorithm
        const assignedAds = await applyFeedingAlgorithm(
          containerId,
          containerType,
          suitableAds,
          container,
          currentAssignments?.[containerId],
          playerContext
        )
        
        assignments[containerId] = assignedAds.map(ad => ad.id)
        
        // Create rotation schedule
        schedule[containerId] = {
          rotationInterval: calculateRotationInterval(container, assignedAds),
          strategy: determineRotationStrategy(container, assignedAds),
          priorities: assignedAds.map((ad, index) => ({
            adId: ad.id,
            weight: ad.weight || 1,
            priority: ad.priority || (index + 1),
            expectedImpressions: ad.expectedImpressions || 10
          }))
        }
        
        console.log(`📅 Assigned ${assignedAds.length} ads to ${containerId}`)
      } else {
        assignments[containerId] = []
        schedule[containerId] = null
        console.log(`⚠️ No suitable ads for ${containerId}`)
      }
    }

    return {
      assignments,
      schedule,
      totalAds: availableAds.length,
      strategy: 'enhanced_feeding_v1',
      nextUpdate: Date.now() + (2 * 60 * 1000) // 2 minutes
    }

  } catch (error) {
    console.error('❌ Feeding engine error:', error)
    throw error
  }
}

// Get available game ads from active playlists (FIXED: Use many-to-many relationship)
async function getAvailableGameAds(gameId: string) {
  console.log('🔍 Getting available ads for game:', gameId)
  
  // Use the many-to-many relationship via _GameToAds instead of direct gameId
  const availableAds = await prisma.gameAd.findMany({
    where: {
      games: {
        some: {
          id: gameId
        }
      }
    },
    include: {
      games: {
        select: {
          id: true,
          name: true
        }
      },
      playlistSchedules: {
        where: {
          status: 'active'
        },
        include: {
          playlist: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        }
      }
    }
  })
  
  console.log(`✅ Found ${availableAds.length} ads available for game ${gameId}`)
  availableAds.forEach(ad => {
    console.log(`  📦 Ad: ${ad.id} (${ad.name}) - Games: ${ad.games.map(g => g.id).join(', ')}`)
  })
  
  return availableAds
}

// Check if ad is suitable for container type
function isAdSuitableForContainer(ad: any, containerType: string): boolean {
  const typeMapping: Record<string, string[]> = {
    'DISPLAY': ['multimedia_display', 'display'],
    'NPC': ['dancing_npc', 'kol'],
    'MINIGAME': ['minigame_ad', 'minigame']
  }
  
  const suitableTypes = typeMapping[containerType] || []
  return suitableTypes.includes(ad.type)
}

// Apply sophisticated feeding algorithm
async function applyFeedingAlgorithm(
  containerId: string,
  containerType: string,
  suitableAds: any[],
  container: any,
  currentAssignment?: any,
  playerContext?: any
) {
  // Enhanced algorithm factors:
  // 1. Ad performance history
  // 2. Container metrics
  // 3. Player demographics
  // 4. Time-based patterns
  // 5. Rotation fairness

  const scoredAds = suitableAds.map(ad => {
    let score = 1.0 // Base score
    let weight = 1.0
    let priority = 1
    
    // Factor 1: Historical performance
    if (currentAssignment?.metrics?.performanceScores?.[ad.id]) {
      const performanceScore = currentAssignment.metrics.performanceScores[ad.id]
      score *= (1 + performanceScore) // Boost successful ads
    }
    
    // Factor 2: Impression balancing
    const currentImpressions = currentAssignment?.metrics?.impressionsByAd?.[ad.id] || 0
    const totalImpressions = currentAssignment?.metrics?.totalImpressions || 1
    const impressionRatio = currentImpressions / totalImpressions
    
    // Reduce weight for over-exposed ads
    if (impressionRatio > 0.4) {
      weight *= 0.5
    } else if (impressionRatio < 0.1) {
      weight *= 1.5 // Boost under-exposed ads
    }
    
    // Factor 3: Container visibility
    if (container.isVisible) {
      score *= 1.2 // Boost for visible containers
      priority += 1
    }
    
    // Factor 4: Player demographics (if available)
    if (playerContext?.demographics) {
      // Simple demographic matching (could be enhanced)
      const totalPlayers = Object.values(playerContext.demographics).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0)
      if (totalPlayers > 10) {
        score *= 1.1 // Boost for popular servers
      }
    }
    
    // Factor 5: Ad freshness
    const adCreatedAt = new Date(ad.createdAt).getTime()
    const daysSinceCreation = (Date.now() - adCreatedAt) / (1000 * 60 * 60 * 24)
    
    if (daysSinceCreation < 7) {
      score *= 1.15 // Boost newer ads
    } else if (daysSinceCreation > 30) {
      score *= 0.9 // Slightly reduce older ads
    }
    
    return {
      ...ad,
      score,
      weight,
      priority,
      expectedImpressions: Math.ceil(score * weight * 10) // Estimated impressions
    }
  })

  // Sort by score (highest first)
  scoredAds.sort((a, b) => b.score - a.score)
  
  // Limit to top performing ads (max 5 per container for rotation)
  const maxAdsPerContainer = container.config?.maxAdsPerContainer || 5
  const selectedAds = scoredAds.slice(0, maxAdsPerContainer)
  
  console.log(`🎯 Selected ${selectedAds.length} ads for ${containerId} using enhanced algorithm`)
  
  return selectedAds
}

// Calculate optimal rotation interval
function calculateRotationInterval(container: any, assignedAds: any[]): number {
  const baseInterval = 300 // 5 minutes default
  
  // Adjust based on container metrics
  if (container.metrics?.averageViewTime) {
    const avgViewTime = container.metrics.averageViewTime
    
    if (avgViewTime > 30) {
      return baseInterval * 1.5 // Longer intervals for engaging content
    } else if (avgViewTime < 10) {
      return baseInterval * 0.7 // Shorter intervals for less engaging content
    }
  }
  
  // Adjust based on number of ads
  if (assignedAds.length > 3) {
    return baseInterval * 0.8 // Faster rotation with more ads
  } else if (assignedAds.length === 1) {
    return baseInterval * 2 // Slower rotation with single ad
  }
  
  return baseInterval
}

// Determine optimal rotation strategy
function determineRotationStrategy(container: any, assignedAds: any[]): string {
  // Simple strategy selection
  if (assignedAds.length === 1) {
    return 'single_ad'
  }
  
  // Check if we have performance data
  const hasPerformanceData = assignedAds.some(ad => ad.score > 1.0)
  
  if (hasPerformanceData) {
    return 'performance_based'
  }
  
  // Check if we have varied weights
  const hasVariedWeights = assignedAds.some((ad, index, arr) => 
    index > 0 && ad.weight !== arr[0].weight
  )
  
  if (hasVariedWeights) {
    return 'weighted'
  }
  
  return 'round_robin'
} 