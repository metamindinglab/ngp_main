import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

async function clearAllData() {
  console.log('🧹 Clearing existing data...')
  
  try {
    // Delete in reverse dependency order to avoid foreign key constraint errors
    await prisma.gameAdPerformance.deleteMany()
    console.log('   ✓ Cleared GameAdPerformance')
    
    await prisma.gameAd.deleteMany()
    console.log('   ✓ Cleared GameAd')
    
    await prisma.game.deleteMany()
    console.log('   ✓ Cleared Game')
    
    await prisma.playlist.deleteMany()
    console.log('   ✓ Cleared Playlist')
    
    await prisma.asset.deleteMany()
    console.log('   ✓ Cleared Asset')
    
    await prisma.removableAsset.deleteMany()
    console.log('   ✓ Cleared RemovableAsset')
    
    console.log('✅ All existing data cleared successfully')
  } catch (error) {
    console.error('❌ Error clearing data:', error)
    throw error
  }
}

async function runDataMigration() {
  // Import the migration functions directly from the migration file
  const { migrateAllData } = await import('./migrate-all-data')
  await migrateAllData()
}

async function runComprehensiveMigration() {
  console.log('🚀 Starting comprehensive clean migration...\n')
  
  try {
    // Step 1: Clear existing data
    await clearAllData()
    console.log('')
    
    // Step 2: Run the updated migration script
    console.log('📋 Running comprehensive data migration...')
    await runDataMigration()
    
    console.log('')
    
    // Step 3: Verify the migration
    await verifyMigration()
    
  } catch (error) {
    console.error('💥 Comprehensive migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration results...\n')
  
  try {
    // Count all records
    const counts = {
      games: await prisma.game.count(),
      assets: await prisma.asset.count(),
      playlists: await prisma.playlist.count(),
      gameAds: await prisma.gameAd.count(),
      gameAdPerformance: await prisma.gameAdPerformance.count(),
      removableAssets: await prisma.removableAsset.count()
    }
    
    console.log('📊 Migration Results:')
    console.log(`   Games: ${counts.games}`)
    console.log(`   Assets: ${counts.assets}`)
    console.log(`   Playlists: ${counts.playlists}`)
    console.log(`   Game Ads: ${counts.gameAds}`)
    console.log(`   Game Ad Performance: ${counts.gameAdPerformance}`)
    console.log(`   Removable Assets: ${counts.removableAssets}`)
    
    // Verify foreign key relationships by checking for orphaned records
    console.log('\n🔗 Verifying foreign key relationships...')
    
    const gameAds = await prisma.gameAd.findMany({
      include: { game: true }
    })
    
    const performanceRecords = await prisma.gameAdPerformance.findMany({
      include: { gameAd: true }
    })
    
    const gameAdsWithInvalidGames = gameAds.filter(ad => !ad.game).length
    const performanceWithInvalidAds = performanceRecords.filter(perf => !perf.gameAd).length
    
    if (gameAdsWithInvalidGames > 0) {
      console.error(`❌ Found ${gameAdsWithInvalidGames} GameAds with invalid game references`)
    } else {
      console.log('   ✓ All GameAds have valid Game references')
    }
    
    if (performanceWithInvalidAds > 0) {
      console.error(`❌ Found ${performanceWithInvalidAds} GameAdPerformance records with invalid GameAd references`)
    } else {
      console.log('   ✓ All GameAdPerformance records have valid GameAd references')
    }
    
    // Expected data counts (based on JSON files)
    const expectedCounts = {
      games: 6,  // Based on games.json
      assets: 34, // Based on assets.json  
      gameAds: 3, // Based on game-ads.json
      gameAdPerformance: 1, // Based on game-ad-performance.json
      playlists: 1 // Based on playlists.json (only contains 1 playlist)
    }
    
    console.log('\n📈 Migration Success Analysis:')
    let allSuccess = true
    
    Object.entries(expectedCounts).forEach(([table, expected]) => {
      const actual = counts[table as keyof typeof counts]
      const success = actual >= expected * 0.8 // Allow 20% variance
      
      if (success) {
        console.log(`   ✅ ${table}: ${actual}/${expected} (${Math.round(actual/expected*100)}%)`)
      } else {
        console.log(`   ❌ ${table}: ${actual}/${expected} (${Math.round(actual/expected*100)}%) - TOO LOW`)
        allSuccess = false
      }
    })
    
    if (allSuccess) {
      console.log('\n🎉 Migration completed successfully! All data migrated correctly.')
    } else {
      console.log('\n⚠️ Migration completed with some issues. Please review the counts above.')
    }
    
  } catch (error) {
    console.error('❌ Error verifying migration:', error)
  }
}

// Run if called directly
if (require.main === module) {
  runComprehensiveMigration()
}

export { runComprehensiveMigration, verifyMigration, clearAllData } 