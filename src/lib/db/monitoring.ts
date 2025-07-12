import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// Create a custom Prisma client with logging
const prismaWithLogging = new PrismaClient().$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const startTime = Date.now();
      
      // Log delete operations
      if (operation === 'delete' || operation === 'deleteMany') {
        await logDatabaseOperation({
          operation,
          model,
          args,
          timestamp: new Date().toISOString()
        });
      }

      // Monitor for mass deletions
      if (operation === 'deleteMany' && model) {
        await checkForMassDeletion(model);
      }

      const result = await query(args);
      const duration = Date.now() - startTime;

      // Log slow queries (over 1 second)
      if (duration > 1000) {
        await logSlowQuery({
          operation,
          model,
          args,
          duration,
          timestamp: new Date().toISOString()
        });
      }

      return result;
    }
  }
});

async function logDatabaseOperation(data: any) {
  const logDir = path.join(process.cwd(), 'logs');
  await fs.mkdir(logDir, { recursive: true });

  const logFile = path.join(logDir, 'database-operations.log');
  const logEntry = JSON.stringify({
    ...data,
    environment: process.env.NODE_ENV
  }) + '\n';

  await fs.appendFile(logFile, logEntry);
}

async function logSlowQuery(data: any) {
  const logDir = path.join(process.cwd(), 'logs');
  await fs.mkdir(logDir, { recursive: true });

  const logFile = path.join(logDir, 'slow-queries.log');
  const logEntry = JSON.stringify({
    ...data,
    environment: process.env.NODE_ENV
  }) + '\n';

  await fs.appendFile(logFile, logEntry);
}

async function checkForMassDeletion(model: string) {
  if (process.env.NODE_ENV === 'production') {
    // Get current record count
    const count = await (prismaWithLogging as any)[model.toLowerCase()].count();
    
    // Threshold for mass deletion warning (50% of records)
    const threshold = Math.max(count * 0.5, 100);
    
    if (count > threshold) {
      // Log warning
      await logDatabaseOperation({
        operation: 'MASS_DELETION_WARNING',
        model,
        currentCount: count,
        threshold,
        timestamp: new Date().toISOString()
      });

      // You could also implement additional safeguards here:
      // - Send alerts to administrators
      // - Require additional confirmation
      // - Block the operation
      throw new Error(
        `Mass deletion warning: Attempting to delete more than ${threshold} records from ${model}. ` +
        'This operation is not allowed in production. Please contact an administrator.'
      );
    }
  }
}

// Export the monitored client
export const monitoredPrisma = prismaWithLogging; 