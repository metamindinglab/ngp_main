import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function restoreDatabase() {
  try {
    // Parse DATABASE_URL to get credentials
    const dbUrl = new URL(process.env.DATABASE_URL || '');
    const database = dbUrl.pathname.slice(1); // Remove leading '/'
    const username = dbUrl.username;
    const password = dbUrl.password;
    const host = dbUrl.hostname;
    const port = dbUrl.port;

    // Get backup file from command line argument or use latest
    const backupDir = join(process.cwd(), 'backups');
    let backupFile = process.argv[2];

    if (!backupFile) {
      // Find latest backup
      const files = await fs.readdir(backupDir);
      const backups = files.filter(f => f.startsWith('backup-')).sort();
      
      if (backups.length === 0) {
        throw new Error('No backup files found');
      }
      
      backupFile = join(backupDir, backups[backups.length - 1]);
    } else {
      backupFile = join(backupDir, backupFile);
    }

    // Verify backup file exists
    try {
      await fs.access(backupFile);
    } catch {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    // Environment check
    if (process.env.NODE_ENV === 'production') {
      const answer = await askQuestion(
        '⚠️  WARNING: You are about to restore the production database. Are you sure? (yes/no): '
      );
      if (answer.toLowerCase() !== 'yes') {
        console.log('Restore cancelled');
        process.exit(0);
      }
    }

    // Set environment variables for pg_restore
    const env = {
      PGPASSWORD: password,
      ...process.env
    };

    console.log('🔄 Starting database restore...');
    console.log(`📦 Using backup file: ${backupFile}`);

    // Drop all connections to the database
    await execAsync(
      `psql -h ${host} -p ${port} -U ${username} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database}' AND pid <> pg_backend_pid();"`,
      { env }
    );

    // Drop and recreate the database
    await execAsync(
      `dropdb -h ${host} -p ${port} -U ${username} --if-exists ${database}`,
      { env }
    );
    await execAsync(
      `createdb -h ${host} -p ${port} -U ${username} ${database}`,
      { env }
    );

    // Restore the backup
    await execAsync(
      `pg_restore -h ${host} -p ${port} -U ${username} -d ${database} -v "${backupFile}"`,
      { env }
    );

    console.log('✅ Database restore completed successfully');
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  }
}

// Helper function to ask for confirmation
function askQuestion(question: string): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run if called directly
if (require.main === module) {
  restoreDatabase();
} 