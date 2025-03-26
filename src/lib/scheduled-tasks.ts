import { cleanupOldMedia } from './media-storage';

// Configuration
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

let cleanupInterval: NodeJS.Timeout | null = null;

export function startScheduledTasks() {
  if (cleanupInterval) {
    return; // Already running
  }

  // Run cleanup every 24 hours
  setInterval(() => {
    cleanupOldMedia().catch((error: Error) => {
      console.error('Failed to run media cleanup:', error);
    });
  }, CLEANUP_INTERVAL);

  // Run cleanup immediately
  cleanupOldMedia().catch((error: Error) => {
    console.error('Failed to run media cleanup:', error);
  });
}

export function stopScheduledTasks() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
} 