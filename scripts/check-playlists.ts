import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Fetching all playlists...')
    const playlists = await prisma.playlist.findMany({
      include: {
        AssetPlaylists: true,
        GamePlaylists: true,
        schedules: true,
      }
    })
    
    console.log('\nFound', playlists.length, 'playlists:')
    playlists.forEach(playlist => {
      console.log('\n-------------------')
      console.log('ID:', playlist.id)
      console.log('Name:', playlist.name)
      console.log('Description:', playlist.description)
      console.log('Type:', playlist.type)
      console.log('Created By:', playlist.createdBy)
      console.log('Created At:', playlist.createdAt)
      console.log('Updated At:', playlist.updatedAt)
      console.log('Metadata:', playlist.metadata)
      console.log('Number of Assets:', playlist.AssetPlaylists.length)
      console.log('Number of Games:', playlist.GamePlaylists.length)
      console.log('Number of Schedules:', playlist.schedules.length)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 