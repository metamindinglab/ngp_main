import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  const result = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
  `;
  console.log('Tables in database:', result);

  // Check if _GameToAds exists and has data
  const gameToAdsCount = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "_GameToAds";
  `;
  console.log('Records in _GameToAds:', gameToAdsCount);
}

checkTables()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 