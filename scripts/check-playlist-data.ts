import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPlaylistData() {
  try {
    console.log('Checking Playlist table data...')
    
    const playlists = await prisma.playlist.findMany()
    console.log(`\nFound ${playlists.length} playlists:`)
    
    for (const playlist of playlists) {
      console.log('\n-------------------')
      console.log('ID:', playlist.id)
      console.log('Name:', playlist.name)
      console.log('Description:', playlist.description)
      console.log('Type:', playlist.type)
      console.log('Created By:', playlist.createdBy)
      console.log('Created At:', playlist.createdAt)
      console.log('Updated At:', playlist.updatedAt)
      console.log('Metadata:', JSON.stringify(playlist.metadata, null, 2))
    }
    
    console.log('\nChecking PlaylistSchedule table...')
    const schedules = await prisma.playlistSchedule.findMany()
    console.log(`Found ${schedules.length} schedules`)
    
    console.log('\nChecking GameDeployment table...')
    const deployments = await prisma.gameDeployment.findMany()
    console.log(`Found ${deployments.length} deployments`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPlaylistData() 