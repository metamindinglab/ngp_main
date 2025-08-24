import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function backupDatabase() {
  try {
    // Parse DATABASE_URL to get credentials
    const dbUrl = new URL(process.env.DATABASE_URL || '');
    const database = dbUrl.pathname.slice(1); // Remove leading '/'
    const username = dbUrl.username;
    const password = dbUrl.password;
    const host = dbUrl.hostname;
    const port = dbUrl.port;

    // Create backups directory if it doesn't exist
    const backupDir = join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(backupDir, `backup-${timestamp}.sql`);

    // Set environment variables for pg_dump
    const env = {
      PGPASSWORD: password,
      ...process.env
    };

    // Run pg_dump
    console.log('📦 Starting database backup...');
    await execAsync(
      `pg_dump -h ${host} -p ${port} -U ${username} -F c -b -v -f "${backupFile}" ${database}`,
      { env }
    );

    console.log(`✅ Backup completed successfully: ${backupFile}`);

    // Keep only last 7 backups
    const files = await fs.readdir(backupDir);
    const backups = files.filter(f => f.startsWith('backup-')).sort();
    
    if (backups.length > 7) {
      const toDelete = backups.slice(0, backups.length - 7);
      for (const file of toDelete) {
        await fs.unlink(join(backupDir, file));
        console.log(`🗑️  Removed old backup: ${file}`);
      }
    }

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  backupDatabase();
} 