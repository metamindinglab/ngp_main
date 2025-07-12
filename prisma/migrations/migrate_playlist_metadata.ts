import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface PlaylistMetadata {
  schedules?: Array<{
    id: string
    gameAdId: string
    startDate: string
    duration: number
    status?: string
  }>
  deployments?: Array<{
    id: string
    scheduleId: string
    gameId: string
    deploymentStatus?: string
  }>
}

async function migratePlaylistMetadata() {
  console.log('Starting playlist metadata migration...')
  
  try {
    // Get all playlists with metadata
    const playlists = await prisma.playlist.findMany()
    console.log(`Found ${playlists.length} playlists to migrate`)
    
    for (const playlist of playlists) {
      console.log(`\nMigrating playlist: ${playlist.id}`)
      
      try {
        const metadata = playlist.metadata as PlaylistMetadata
        
        if (!metadata?.schedules) {
          console.log('No schedules found in metadata, skipping...')
          continue
        }
        
        // Create PlaylistSchedule records
        for (const schedule of metadata.schedules) {
          console.log(`Creating schedule: ${schedule.id}`)
          
          const newSchedule = await prisma.$transaction(async (tx) => {
            const schedule_record = await tx.playlistSchedule.create({
              data: {
                id: schedule.id,
                playlistId: playlist.id,
                gameAdId: schedule.gameAdId,
                startDate: new Date(schedule.startDate),
                duration: schedule.duration,
                status: schedule.status || 'scheduled',
                createdAt: playlist.createdAt,
                updatedAt: new Date()
              }
            })
            
            // Create GameDeployment records for this schedule
            const deployments = metadata.deployments?.filter(d => d.scheduleId === schedule.id) || []
            
            for (const deployment of deployments) {
              console.log(`Creating deployment: ${deployment.id} for game: ${deployment.gameId}`)
              
              await tx.gameDeployment.create({
                data: {
                  id: deployment.id,
                  scheduleId: schedule_record.id,
                  gameId: deployment.gameId,
                  status: deployment.deploymentStatus || 'pending',
                  createdAt: playlist.createdAt,
                  updatedAt: new Date()
                }
              })
            }
            
            return schedule_record
          })
          
          console.log(`Created schedule ${newSchedule.id} with its deployments`)
        }
        
        console.log('Successfully migrated playlist data')
      } catch (error) {
        console.error(`Error migrating playlist ${playlist.id}:`, error)
      }
    }
    
    console.log('\nMigration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if executed directly
if (require.main === module) {
  migratePlaylistMetadata()
    .catch(console.error)
} 