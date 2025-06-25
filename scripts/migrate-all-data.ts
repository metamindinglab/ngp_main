import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

// Type definitions based on JSON structures
interface AssetData {
  id: string
  name: string
  description?: string
  assetType: string
  robloxAssetId?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  [key: string]: any // For other dynamic properties
}

interface GameAdData {
  id: string
  name: string
  templateType?: string
  createdAt: string
  updatedAt: string
  assets?: Array<{
    assetType: string
    assetId: string
    robloxAssetId: string
  }>
}

interface GameAdPerformanceData {
  id: string
  gameAdId: string
  gameId: string
  playlistId?: string
  date: string
  metrics?: any
  demographics?: any
  engagements?: any[]
  playerDetails?: any
  timeDistribution?: any
  performanceTrends?: any
}

interface PlaylistData {
  id: string
  name: string
  description?: string
  schedules?: any[]
  deployments?: any[]
  createdAt: string
  updatedAt: string
  status?: string
}

async function migrateAssets() {
  console.log('📦 Migrating Assets...')
  
  try {
    const assetsPath = join(process.cwd(), 'data/assets.json')
    const content = await readFile(assetsPath, 'utf8')
    const data: { assets: AssetData[] } = JSON.parse(content)
    
    let migrated = 0
    for (const asset of data.assets) {
      // Prepare asset data according to schema
      const assetData = {
        id: asset.id,
        name: asset.name,
        type: asset.assetType, // Use 'type' instead of 'assetType'
        status: 'active', // Default status
        robloxId: asset.robloxAssetId || null,
        metadata: JSON.stringify({
          description: asset.description,
          tags: asset.tags,
          characterType: asset.characterType,
          appearance: asset.appearance,
          personality: asset.personality,
          defaultAnimations: asset.defaultAnimations,
          suitableFor: asset.suitableFor,
          marketingCapabilities: asset.marketingCapabilities,
          image: asset.image,
          previewImage: asset.previewImage,
          compatibility: asset.compatibility,
          brands: asset.brands,
          size: asset.size,
          itemType: asset.type,
          difficulty: asset.difficulty,
          maxPlayers: asset.maxPlayers,
          gameplayDuration: asset.gameplayDuration,
          customizableElements: asset.customizableElements,
          duration: asset.duration,
          category: asset.category,
          previewUrl: asset.previewUrl,
          url: asset.url,
          dimensions: asset.dimensions,
          fileFormat: asset.fileFormat,
          fileSize: asset.fileSize,
          genre: asset.genre,
          mood: asset.mood,
          instrumentation: asset.instrumentation,
          tempo: asset.tempo,
          lastUpdated: asset.lastUpdated
        }),
        createdAt: new Date(asset.createdAt),
        updatedAt: new Date(asset.updatedAt)
      }

      await prisma.asset.create({
        data: assetData
      })
      migrated++
    }
    
    console.log(`✅ Successfully migrated ${migrated} assets`)
  } catch (error) {
    console.error('❌ Error migrating assets:', error)
  }
}

async function migrateGameAds() {
  console.log('🎯 Migrating Game Ads...')
  
  try {
    const gameAdsPath = join(process.cwd(), 'data/game-ads.json')
    const content = await readFile(gameAdsPath, 'utf8')
    const data: { gameAds: GameAdData[] } = JSON.parse(content)
    
    // Get the first game to use as default gameId for ads without specific game assignment
    const defaultGame = await prisma.game.findFirst()
    if (!defaultGame) {
      console.log('⚠️ No games found in database. Skipping Game Ads migration.')
      return
    }
    
    let migrated = 0
    for (const gameAd of data.gameAds) {
      const gameAdData = {
        id: gameAd.id,
        gameId: defaultGame.id, // Use default game for now
        name: gameAd.name,
        type: gameAd.templateType || null,
        status: 'active', // Default status
        assets: JSON.stringify(gameAd.assets || []),
        createdAt: new Date(gameAd.createdAt),
        updatedAt: new Date(gameAd.updatedAt)
      }

      await prisma.gameAd.create({
        data: gameAdData
      })
      migrated++
    }
    
    console.log(`✅ Successfully migrated ${migrated} game ads`)
  } catch (error) {
    console.error('❌ Error migrating game ads:', error)
  }
}

async function migrateGameAdPerformance() {
  console.log('📊 Migrating Game Ad Performance...')
  
  try {
    const performancePath = join(process.cwd(), 'data/game-ad-performance.json')
    const content = await readFile(performancePath, 'utf8')
    const data: { performanceData: GameAdPerformanceData[] } = JSON.parse(content)
    
    let migrated = 0
    for (const perf of data.performanceData) {
      // Check if the gameAd exists in the database
      const gameAdExists = await prisma.gameAd.findUnique({
        where: { id: perf.gameAdId }
      })
      
      if (!gameAdExists) {
        console.log(`⚠️ GameAd ${perf.gameAdId} not found, skipping performance record ${perf.id}`)
        continue
      }
      
      const perfData = {
        id: perf.id,
        gameAdId: perf.gameAdId,
        gameId: perf.gameId,
        playlistId: perf.playlistId || null,
        date: new Date(perf.date),
        metrics: JSON.stringify(perf.metrics || {}),
        demographics: JSON.stringify(perf.demographics || {}),
        engagements: JSON.stringify(perf.engagements || []),
        playerDetails: JSON.stringify(perf.playerDetails || {}),
        timeDistribution: JSON.stringify(perf.timeDistribution || {}),
        performanceTrends: JSON.stringify(perf.performanceTrends || {}),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await prisma.gameAdPerformance.create({
        data: perfData
      })
      migrated++
    }
    
    console.log(`✅ Successfully migrated ${migrated} performance records`)
  } catch (error) {
    console.error('❌ Error migrating game ad performance:', error)
  }
}

async function migratePlaylists() {
  console.log('🎵 Migrating Playlists...')
  
  try {
    const playlistsPath = join(process.cwd(), 'data/playlists.json')
    const content = await readFile(playlistsPath, 'utf8')
    const data: { playlists: PlaylistData[] } = JSON.parse(content)
    
    let migrated = 0
    for (const playlist of data.playlists) {
      const playlistData = {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || null,
        type: 'standard', // Default type
        metadata: JSON.stringify({
          schedules: playlist.schedules || [],
          deployments: playlist.deployments || [],
          status: playlist.status || 'active'
        }),
        createdAt: new Date(playlist.createdAt),
        updatedAt: new Date(playlist.updatedAt)
      }

      await prisma.playlist.create({
        data: playlistData
      })
      migrated++
    }
    
    console.log(`✅ Successfully migrated ${migrated} playlists`)
  } catch (error) {
    console.error('❌ Error migrating playlists:', error)
  }
}

async function migrateAllData() {
  console.log('🚀 Starting comprehensive data migration from JSON to PostgreSQL...\n')
  
  try {
    // Run migrations in sequence to avoid foreign key issues
    await migrateAssets()
    await migrateGameAds()
    await migrateGameAdPerformance()
    await migratePlaylists()
    
    console.log('\n🎉 All data migration completed successfully!')
    
    // Summary
    const counts = await Promise.all([
      prisma.asset.count(),
      prisma.gameAd.count(),
      prisma.gameAdPerformance.count(),
      prisma.playlist.count()
    ])
    
    console.log('\n📊 Final Database Summary:')
    console.log(`   Assets: ${counts[0]}`)
    console.log(`   Game Ads: ${counts[1]}`)
    console.log(`   Game Ad Performance: ${counts[2]}`)
    console.log(`   Playlists: ${counts[3]}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateAllData().catch(console.error) 