import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Request validation schema
const ContainerRequestSchema = z.object({
  gameId: z.string(),
  containers: z.array(z.object({
    id: z.string(),
    type: z.enum(['DISPLAY', 'NPC', 'MINIGAME']),
    // legacy: no longer required; targeting is done server-side
    playlistId: z.string().optional(),
    scheduleId: z.string().optional(),
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

export const dynamic = 'force-dynamic'

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

    // Normalize payload shapes from Roblox (arrays can serialize unexpectedly)
    if (body && Array.isArray(body.containers)) {
      body.containers = body.containers.map((c: any) => {
        const metrics = c?.metrics ?? {}
        const raw = metrics.impressionsByAd

        // Ensure impressionsByAd is a record<string, number>
        let impressions: Record<string, number> = {}
        if (Array.isArray(raw)) {
          // Convert array -> record with numeric string keys
          for (let i = 0; i < raw.length; i++) {
            impressions[String(i)] = Number(raw[i]) || 0
          }
        } else if (raw && typeof raw === 'object') {
          for (const [k, v] of Object.entries(raw)) {
            impressions[String(k)] = Number(v as any) || 0
          }
        } else {
          impressions = {}
        }

        const position = c?.position && typeof c.position === 'object'
          ? c.position
          : { x: 0, y: 0, z: 0 }

        return {
          ...c,
          position,
          metrics: { ...metrics, impressionsByAd: impressions }
        }
      })
    }

    if (!body.currentAssignments || Array.isArray(body.currentAssignments)) {
      body.currentAssignments = {}
    }

    const validatedData = ContainerRequestSchema.parse(body)

    console.log(`[DEBUG] Processing request for game ${game.id} with ${validatedData.containers.length} containers`);

    // Warn if client-sent gameId mismatches API-key resolved game
    if (validatedData.gameId && validatedData.gameId !== game.id) {
      console.warn(`[WARN] Body gameId ${validatedData.gameId} mismatches API key game ${game.id}. Using ${game.id}.`)
    }

    // Run Game Ad Feeding Engine using server-resolved game.id
    const feedingResult = await gameAdFeedingEngine(
      game.id,
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

  } catch (error: any) {
    console.error('❌ Feeding engine error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request format',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error?.message || String(error)
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
    // Get available game ads using active schedules/time window for this game
    const availableAds = await getAvailableGameAds(gameId)
    console.log(`[DEBUG] Available ads for game ${gameId}: ${availableAds.map(ad => ad.id).join(', ')}`);
    console.log('📦 Available ads:', availableAds.length)

    // Process each container
    for (const container of containers) {
      const containerId = container.id
      const containerType = container.type
      console.log(`[DEBUG] Processing container ${container.id} (${container.type})`);

      try {
        // Filter ads suitable for this container type (targeting is server-side by game)
        const suitableAds = availableAds.filter(ad => isAdSuitableForContainer(ad, containerType))
        console.log(`[DEBUG] Suitable ads for ${container.id}: ${suitableAds.map(ad => ad.id).join(', ')}`);
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
          console.log(`[DEBUG] Assigned ads to ${container.id}: ${assignedAds.map(ad => ad.id).join(', ')}`);
        } else {
          assignments[containerId] = []
          schedule[containerId] = null
          console.log(`⚠️ No suitable ads for ${containerId}`)
        }
      } catch (err) {
        console.error(`❌ Error processing container ${containerId}:`, err)
        assignments[containerId] = []
        schedule[containerId] = null
      }
    }

    console.log(`[DEBUG] Feeding complete - Assignments: ${JSON.stringify(assignments)}`);

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

// Get available game ads using active schedules/time window and game targeting
async function getAvailableGameAds(gameId: string) {
  console.log('🔍 Getting available ads for game:', gameId)
  const now = new Date()
  try {
    const ads = await prisma.gameAd.findMany({
      where: {
        games: { some: { id: gameId } },
        playlistSchedules: { some: { OR: [{ status: 'ACTIVE' }, { status: 'active' }], startDate: { lte: now } } }
      },
      include: {
        playlistSchedules: true
      }
    })
    // Post-filter end window in JS
    const filtered = ads.filter(ad => {
      return ad.playlistSchedules?.some(ps => {
        // Interpret duration as DAYS
        const end = new Date(ps.startDate); end.setUTCDate(end.getUTCDate() + (ps.duration || 0))
        return String(ps.status).toLowerCase() === 'active' && now >= new Date(ps.startDate) && now < end
      })
    })
    console.log(`✅ Found ${filtered.length} ads available for game ${gameId}`)
    return filtered
  } catch (err) {
    console.error('❌ Error fetching available ads:', err)
    return []
  }
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