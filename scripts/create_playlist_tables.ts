import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createPlaylistTables() {
  try {
    // First, check if tables exist
    console.log('Checking if tables exist...')
    
    try {
      await prisma.$queryRaw`SELECT * FROM "PlaylistSchedule" LIMIT 1`
      console.log('PlaylistSchedule table already exists')
      return
    } catch (error) {
      console.log('Creating new tables...')
      
      // Create PlaylistSchedule table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "PlaylistSchedule" (
          "id" TEXT NOT NULL,
          "playlistId" TEXT NOT NULL,
          "gameAdId" TEXT NOT NULL,
          "startDate" TIMESTAMP(3) NOT NULL,
          "duration" INTEGER NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'scheduled',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "PlaylistSchedule_pkey" PRIMARY KEY ("id")
        )
      `
      
      // Create GameDeployment table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "GameDeployment" (
          "id" TEXT NOT NULL,
          "scheduleId" TEXT NOT NULL,
          "gameId" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "GameDeployment_pkey" PRIMARY KEY ("id")
        )
      `
      
      // Create indexes
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PlaylistSchedule_playlistId_idx" ON "PlaylistSchedule"("playlistId")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PlaylistSchedule_gameAdId_idx" ON "PlaylistSchedule"("gameAdId")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "GameDeployment_scheduleId_idx" ON "GameDeployment"("scheduleId")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "GameDeployment_gameId_idx" ON "GameDeployment"("gameId")`
      
      // Add foreign key constraints
      await prisma.$executeRaw`
        ALTER TABLE "PlaylistSchedule" 
        ADD CONSTRAINT "PlaylistSchedule_playlistId_fkey" 
        FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `
      
      await prisma.$executeRaw`
        ALTER TABLE "PlaylistSchedule" 
        ADD CONSTRAINT "PlaylistSchedule_gameAdId_fkey" 
        FOREIGN KEY ("gameAdId") REFERENCES "GameAd"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `
      
      await prisma.$executeRaw`
        ALTER TABLE "GameDeployment" 
        ADD CONSTRAINT "GameDeployment_scheduleId_fkey" 
        FOREIGN KEY ("scheduleId") REFERENCES "PlaylistSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `
      
      await prisma.$executeRaw`
        ALTER TABLE "GameDeployment" 
        ADD CONSTRAINT "GameDeployment_gameId_fkey" 
        FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `
      
      console.log('Successfully created tables and constraints')
    }
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  createPlaylistTables()
    .catch(console.error)
} 