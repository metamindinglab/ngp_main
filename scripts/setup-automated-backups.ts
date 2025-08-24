import cron from 'node-cron';
import { backupDatabase } from './backup-db';

// Schedule daily backup at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting scheduled backup...');
  try {
    await backupDatabase();
    console.log('Scheduled backup completed successfully');
  } catch (error) {
    console.error('Scheduled backup failed:', error);
  }
});

console.log('Automated backup scheduler started. Backups will run daily at 2 AM.');

// Keep the process running
process.stdin.resume(); 