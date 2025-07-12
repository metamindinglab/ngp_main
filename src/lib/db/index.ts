import { PrismaClient } from '@prisma/client';
import { monitoredPrisma } from './monitoring';

// Create a single instance of Prisma Client
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Use monitored client in production, regular client in development/test
export const prisma = process.env.NODE_ENV === 'production' 
  ? monitoredPrisma 
  : (globalForPrisma.prisma || new PrismaClient());

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma as PrismaClient;
}

export * from './games';
export * from './assets';
export * from './playlists';
export * from './gameAds';
export * from './gameAdPerformance';
export * from './removableAssets'; 