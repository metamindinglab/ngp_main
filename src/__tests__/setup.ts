import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ensure we're using test database
if (!process.env.DATABASE_URL?.includes('test')) {
  throw new Error('Must use test database for testing');
}

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up test database and disconnect
  await prisma.gameAdPerformance.deleteMany();
  await prisma.gameAd.deleteMany();
  await prisma.game.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.removableAsset.deleteMany();
  await prisma.$disconnect();
}); 