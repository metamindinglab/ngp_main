import { PrismaClient } from '@prisma/client';

// Environment check
if (process.env.NODE_ENV === 'production') {
  console.error('❌ This script cannot be run in production');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  try {
    const perfDeleted = await prisma.gameAdPerformance.deleteMany();
    const adDeleted = await prisma.gameAd.deleteMany();
    console.log(`Deleted ${perfDeleted.count} GameAdPerformance records.`);
    console.log(`Deleted ${adDeleted.count} GameAd records.`);
  } catch (error) {
    console.error('Error deleting GameAd/GameAdPerformance records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 