import { PrismaClient } from '@prisma/client';

// Ensure we're using test database
if (!process.env.DATABASE_URL?.includes('test')) {
  throw new Error('Must use test database for testing');
}

// Create a singleton instance for tests
const prismaTestClient = new PrismaClient();

export { prismaTestClient }; 