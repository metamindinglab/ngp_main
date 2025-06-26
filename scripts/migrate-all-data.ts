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

interface GameData {
  id: string
  name: string
  description?: string
  genre?: string
  robloxLink?: string
  thumbnail?: string
  metrics?: any
  dates?: any
  owner?: any
  authorization?: any
}

interface GamesDatabase {
  version: string
  lastUpdated: string
  games: GameData[]
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

async function migrateGames() {
  console.log('🎮 Migrating Games...')
  
  try {
    const gamesPath = join(process.cwd(), 'data/games.json')
    const content = await readFile(gamesPath, 'utf8')
    const data: GamesDatabase = JSON.parse(content)
    
    let migrated = 0
    for (const game of data.games) {
      try {
        // Use upsert to handle duplicates gracefully
        await prisma.game.upsert({
          where: { id: game.id },
          update: {
            name: game.name,
            description: game.description || null,
            genre: game.genre || null,
            robloxLink: game.robloxLink || null,
            thumbnail: game.thumbnail || null,
            metrics: game.metrics || null,
            dates: game.dates || null,
            owner: game.owner || null,
            robloxAuthorization: game.authorization || null,
            serverApiKey: game.authorization?.apiKey || null,
            serverApiKeyStatus: game.authorization?.status || null,
            serverApiKeyCreatedAt: game.authorization?.apiKey ? new Date() : null,
            updatedAt: new Date()
          },
          create: {
            id: game.id,
            name: game.name,
            description: game.description || null,
            genre: game.genre || null,
            robloxLink: game.robloxLink || null,
            thumbnail: game.thumbnail || null,
            metrics: game.metrics || null,
            dates: game.dates || null,
            owner: game.owner || null,
            robloxAuthorization: game.authorization || null,
            serverApiKey: game.authorization?.apiKey || null,
            serverApiKeyStatus: game.authorization?.status || null,
            serverApiKeyCreatedAt: game.authorization?.apiKey ? new Date() : null,
          }
        })
        migrated++
      } catch (error) {
        console.error(`❌ Failed to migrate game ${game.id}:`, error)
      }
    }
    
    console.log(`✅ Successfully migrated ${migrated} games`)
  } catch (error) {
    console.error('❌ Error migrating games:', error)
  }
}

async function migrateAssets() {
  console.log('📦 Migrating Assets...')
  
  try {
    const assetsPath = join(process.cwd(), 'data/assets.json')
    const content = await readFile(assetsPath, 'utf8')
    const data: { assets: AssetData[] } = JSON.parse(content)
    
    let migrated = 0
    for (const asset of data.assets) {
      try {
        // Use upsert to handle duplicates gracefully
        const assetData = {
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
          updatedAt: new Date(asset.updatedAt)
        }

        await prisma.asset.upsert({
          where: { id: asset.id },
          update: assetData,
          create: {
            id: asset.id,
            ...assetData,
            createdAt: new Date(asset.createdAt)
          }
        })
        migrated++
      } catch (error) {
        console.error(`❌ Failed to migrate asset ${asset.id}:`, error)
      }
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
      try {
        const gameAdData = {
          gameId: defaultGame.id, // Use default game for now
          name: gameAd.name,
          type: gameAd.templateType || null,
          status: 'active', // Default status
          assets: JSON.stringify(gameAd.assets || []),
          updatedAt: new Date(gameAd.updatedAt)
        }

        await prisma.gameAd.upsert({
          where: { id: gameAd.id },
          update: gameAdData,
          create: {
            id: gameAd.id,
            ...gameAdData,
            createdAt: new Date(gameAd.createdAt)
          }
        })
        migrated++
      } catch (error) {
        console.error(`❌ Failed to migrate game ad ${gameAd.id}:`, error)
      }
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
      try {
        // Check if the gameAd exists in the database
        const gameAdExists = await prisma.gameAd.findUnique({
          where: { id: perf.gameAdId }
        })
        
        if (!gameAdExists) {
          console.log(`⚠️ GameAd ${perf.gameAdId} not found, skipping performance record ${perf.id}`)
          continue
        }
        
        const perfData = {
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
          updatedAt: new Date()
        }

        await prisma.gameAdPerformance.upsert({
          where: { id: perf.id },
          update: perfData,
          create: {
            id: perf.id,
            ...perfData,
            createdAt: new Date()
          }
        })
        migrated++
      } catch (error) {
        console.error(`❌ Failed to migrate performance record ${perf.id}:`, error)
      }
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
      try {
        const playlistData = {
          name: playlist.name,
          description: playlist.description || null,
          type: 'standard', // Default type
          metadata: JSON.stringify({
            schedules: playlist.schedules || [],
            deployments: playlist.deployments || [],
            status: playlist.status || 'active'
          }),
          updatedAt: new Date(playlist.updatedAt)
        }

        await prisma.playlist.upsert({
          where: { id: playlist.id },
          update: playlistData,
          create: {
            id: playlist.id,
            ...playlistData,
            createdAt: new Date(playlist.createdAt)
          }
        })
        migrated++
      } catch (error) {
        console.error(`❌ Failed to migrate playlist ${playlist.id}:`, error)
      }
    }
    
    console.log(`✅ Successfully migrated ${migrated} playlists`)
  } catch (error) {
    console.error('❌ Error migrating playlists:', error)
  }
}

async function migrateAllData() {
  console.log('🚀 Starting comprehensive data migration from JSON to PostgreSQL...\n')
  
  try {
    // CRITICAL: Run migrations in sequence to respect foreign key dependencies
    // 1. Games first (no dependencies)
    await migrateGames()
    
    // 2. Assets (no dependencies)
    await migrateAssets()
    
    // 3. Game Ads (depends on Games)
    await migrateGameAds()
    
    // 4. Game Ad Performance (depends on Game Ads)
    await migrateGameAdPerformance()
    
    // 5. Playlists (no dependencies)
    await migratePlaylists()
    
    console.log('\n🎉 All data migration completed successfully!')
    
    // Summary
    const counts = await Promise.all([
      prisma.game.count(),
      prisma.asset.count(),
      prisma.gameAd.count(),
      prisma.gameAdPerformance.count(),
      prisma.playlist.count()
    ])
    
    console.log('\n📊 Final Database Summary:')
    console.log(`   Games: ${counts[0]}`)
    console.log(`   Assets: ${counts[1]}`)
    console.log(`   Game Ads: ${counts[2]}`)
    console.log(`   Game Ad Performance: ${counts[3]}`)
    console.log(`   Playlists: ${counts[4]}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Export the function for use by other scripts
export { migrateAllData }

// Run the migration if called directly
if (require.main === module) {
  migrateAllData().catch(console.error)
} 