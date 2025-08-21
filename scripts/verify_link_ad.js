const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const adId = 'ad_1742883681966';
const gameId = 'game_90648d31';
const playlistId = 'e0980524-65ab-4278-ad32-9f24a38c5ecf';

async function main() {
  const ad = await prisma.gameAd.findUnique({ where: { id: adId } });
  console.log('GameAd:', ad);
  const maps = await prisma.('SELECT * FROM _GameToAds WHERE B = ', adId);
  console.log('Map:', maps);
  const scheds = await prisma.playlistSchedule.findMany({ where: { gameAdId: adId } });
  console.log('Schedules:', scheds);
  const exists = await prisma.('SELECT 1 FROM _GameToAds WHERE A= AND B= LIMIT 1', gameId, adId);
  if (exists.length === 0) {
    await prisma.('INSERT INTO _GameToAds (A,B) VALUES (,) ON CONFLICT DO NOTHING', gameId, adId);
    console.log('Linked game to ad');
  } else {
    console.log('Mapping already exists');
  }
  let schedule = await prisma.playlistSchedule.findFirst({ where: { playlistId, gameAdId: adId } });
    schedule = await prisma.playlistSchedule.create({ data: { id: crypto.randomUUID(), playlistId, gameAdId: adId, startDate: new Date(), duration: 43200, status: 'active', createdAt: new Date(), updatedAt: new Date() } });
    console.log('Created schedule', schedule.id);
  } else if (!(schedule.status === 'active')) {
    schedule = await prisma.playlistSchedule.update({ where: { id: schedule.id }, data: { status: 'active', updatedAt: new Date() } });
    console.log('Activated schedule', schedule.id);
  } else {
    console.log('Schedule already active', schedule.id);
  }
}

main().catch(e => { console.error('ERR', e); process.exit(1); }).finally(async () => { await prisma.(); });
