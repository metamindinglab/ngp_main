import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

async function addGameMediaFields() {
  try {
    console.log('🚀 Adding missing fields to GameMedia table...')
    
    // Read the SQL file
    const sqlPath = join(__dirname, 'add_game_media_fields.sql')
    const sql = await readFile(sqlPath, 'utf8')
    
    // Execute the SQL
    await prisma.$executeRawUnsafe(sql)
    
    console.log('✅ Successfully added missing fields to GameMedia table')
  } catch (error) {
    console.error('❌ Error adding fields:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  addGameMediaFields()
} 