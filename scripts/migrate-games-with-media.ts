import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'
import path from 'path'

// Environment check
if (process.env.NODE_ENV === 'production') {
  console.error('❌ This script cannot be run in production')
  process.exit(1)
}

const prisma = new PrismaClient()

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
  robloxInfo?: {
    media?: {
      images?: Array<{
        id: string
        robloxId?: number | null
        type: string
        approved: boolean
        title?: string
        altText?: string
        localPath: string
        thumbnailUrl: string
        width: number
        height: number
        uploadedAt: string
      }>
      videos?: Array<{
        id: string
        robloxId: string
        type: string
        approved: boolean
        title: string
        localPath: string
        thumbnailUrl?: string
        duration?: number
        uploadedAt: string
      }>
    }
  }
}

interface GameAdData {
  id: string
  name: string
  templateType: string
  createdAt: string
  updatedAt: string
  assets: Array<{
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
  engagements?: any
  playerDetails?: any
  timeDistribution?: any
  performanceTrends?: any
}

async function migrateGames() {
  console.log('🎮 Migrating Games...')
  
  try {
    const gamesPath = join(process.cwd(), 'data/games.json')
    const content = await readFile(gamesPath, 'utf8')
    const data: { games: GameData[] } = JSON.parse(content)
    
    let migrated = 0
    for (const game of data.games) {
      try {
        // Create or update the game
        const upsertedGame = await prisma.game.upsert({
          where: { id: game.id },
          update: {
            name: game.name,
            description: game.description,
            genre: game.genre,
            robloxLink: game.robloxLink,
            metrics: game.metrics || {},
            dates: game.dates || {},
            owner: game.owner || {},
            robloxAuthorization: game.authorization || null,
            updatedAt: new Date()
          },
          create: {
            id: game.id,
            name: game.name,
            description: game.description,
            genre: game.genre,
            robloxLink: game.robloxLink,
            metrics: game.metrics || {},
            dates: game.dates || {},
            owner: game.owner || {},
            robloxAuthorization: game.authorization || null
          }
        })

        // Create GameMedia for thumbnail if it exists
        if (game.thumbnail) {
          await prisma.gameMedia.upsert({
            where: {
              id: `thumbnail_${game.id}`
            },
            update: {
              type: 'image',
              title: 'Game Thumbnail',
              localPath: game.thumbnail,
              thumbnailUrl: game.thumbnail,
              approved: true,
              uploadedAt: new Date()
            },
            create: {
              id: `thumbnail_${game.id}`,
              gameId: game.id,
              type: 'image',
              title: 'Game Thumbnail',
              localPath: game.thumbnail,
              thumbnailUrl: game.thumbnail,
              approved: true
            }
          })
        }

        // Handle game media from robloxInfo if present
        if (game.robloxInfo?.media) {
          const { images = [], videos = [] } = game.robloxInfo.media

          // Process images
          for (const image of images) {
            await prisma.gameMedia.upsert({
              where: {
                id: image.id
              },
              update: {
                type: 'image',
                robloxId: image.robloxId?.toString(),
                title: image.title,
                altText: image.altText,
                localPath: image.localPath,
                thumbnailUrl: image.thumbnailUrl,
                width: image.width,
                height: image.height,
                approved: image.approved,
                uploadedAt: new Date(image.uploadedAt)
              },
              create: {
                id: image.id,
                gameId: upsertedGame.id,
                type: 'image',
                robloxId: image.robloxId?.toString(),
                title: image.title,
                altText: image.altText,
                localPath: image.localPath,
                thumbnailUrl: image.thumbnailUrl,
                width: image.width,
                height: image.height,
                approved: image.approved,
                uploadedAt: new Date(image.uploadedAt)
              }
            })
          }

          // Process videos
          for (const video of videos) {
            await prisma.gameMedia.upsert({
              where: {
                id: video.id
              },
              update: {
                type: 'video',
                robloxId: video.robloxId,
                title: video.title,
                localPath: video.localPath,
                thumbnailUrl: video.thumbnailUrl,
                duration: video.duration,
                approved: video.approved,
                uploadedAt: new Date(video.uploadedAt)
              },
              create: {
                id: video.id,
                gameId: upsertedGame.id,
                type: 'video',
                robloxId: video.robloxId,
                title: video.title,
                localPath: video.localPath,
                thumbnailUrl: video.thumbnailUrl,
                duration: video.duration,
                approved: video.approved,
                uploadedAt: new Date(video.uploadedAt)
              }
            })
          }
        }

        migrated++
        console.log(`✅ Migrated game: ${game.name}`)
      } catch (error) {
        console.error(`❌ Error migrating game ${game.name}:`, error)
      }
    }
    
    console.log(`🎉 Successfully migrated ${migrated} games`)
  } catch (error) {
    console.error('❌ Error migrating games:', error)
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
          name: gameAd.name,
          type: gameAd.templateType,
          status: 'active',
          assets: gameAd.assets,
          updatedAt: new Date(gameAd.updatedAt),
          gameId: defaultGame.id // We'll update this later when we have game-ad mappings
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
        // Check if the gameAd exists
        const gameAd = await prisma.gameAd.findUnique({
          where: { id: perf.gameAdId }
        })
        
        if (!gameAd) {
          console.log(`⚠️ GameAd ${perf.gameAdId} not found, skipping performance record ${perf.id}`)
          continue
        }
        
        // Check if the game exists
        const game = await prisma.game.findUnique({
          where: { id: perf.gameId }
        })
        
        if (!game) {
          console.log(`⚠️ Game ${perf.gameId} not found, skipping performance record ${perf.id}`)
          continue
        }

        const perfData = {
          gameAdId: perf.gameAdId,
          gameId: perf.gameId,
          playlistId: perf.playlistId,
          date: new Date(perf.date),
          metrics: perf.metrics,
          demographics: perf.demographics,
          engagements: perf.engagements,
          playerDetails: perf.playerDetails,
          timeDistribution: perf.timeDistribution,
          performanceTrends: perf.performanceTrends,
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

async function main() {
  try {
    // First migrate games and their media
    await migrateGames()
    
    // Then migrate game ads
    await migrateGameAds()
    
    // Finally migrate game ad performance
    await migrateGameAdPerformance()
    
    console.log('🎉 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 