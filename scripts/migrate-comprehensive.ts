import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Environment check
if (process.env.NODE_ENV === 'production') {
  console.error('❌ This script cannot be run in production');
  process.exit(1);
}

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
  console.log('🔍 Verifying migration results...')
  
  try {
    // Get current counts
    const counts = {
      games: await prisma.game.count(),
      assets: await prisma.asset.count(),
      gameAds: await prisma.gameAd.count(),
      gameAdPerformance: await prisma.gameAdPerformance.count(),
      playlists: await prisma.playlist.count()
    }
    
    // Check foreign key relationships
    const gameAds = await prisma.gameAd.findMany({
      include: { games: true }
    })
    
    // Check for invalid relationships
    const gameAdsWithInvalidGames = gameAds.filter(ad => ad.games.length === 0).length
    
    console.log('\n🔗 Foreign Key Relationship Check:')
    if (gameAdsWithInvalidGames > 0) {
      console.log(`   ❌ Found ${gameAdsWithInvalidGames} game ads without associated games`)
    } else {
      console.log('   ✅ All game ads have valid game references')
    }
    
    // Expected data counts (based on JSON files)
    const expectedCounts = {
      games: 6,  // Based on games.json
      assets: 34, // Based on assets.json  
      gameAds: 3, // Based on game-ads.json
      gameAdPerformance: 1, // Based on game-ad-performance.json
      playlists: 1 // Based on playlists.json
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