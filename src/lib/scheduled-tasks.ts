import { cleanupOldMedia } from './media-storage';

// Configuration
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

let cleanupInterval: NodeJS.Timeout | null = null;

export function startScheduledTasks() {
  if (cleanupInterval) {
    return; // Already running
  }

  // Run cleanup immediately
  cleanupOldMedia(MAX_AGE).catch(error => {
    console.error('Failed to run media cleanup:', error);
  });

  // Schedule regular cleanup
  cleanupInterval = setInterval(() => {
    cleanupOldMedia(MAX_AGE).catch(error => {
      console.error('Failed to run media cleanup:', error);
    });
  }, CLEANUP_INTERVAL);
}

export function stopScheduledTasks() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
} 