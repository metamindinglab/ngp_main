import { prisma } from '.';
import type { Prisma } from '@prisma/client';

export type GameAdCreateInput = Prisma.GameAdCreateInput;
export type GameAdUpdateInput = Prisma.GameAdUpdateInput;

export async function getAllGameAds() {
  return prisma.gameAd.findMany({
    include: {
      game: true,
      performance: true,
    },
  });
}

export async function getGameAdById(id: string) {
  return prisma.gameAd.findUnique({
    where: { id },
    include: {
      game: true,
      performance: true,
    },
  });
}

export async function createGameAd(data: GameAdCreateInput) {
  return prisma.gameAd.create({
    data,
    include: {
      game: true,
      performance: true,
    },
  });
}

export async function updateGameAd(id: string, data: GameAdUpdateInput) {
  return prisma.gameAd.update({
    where: { id },
    data,
    include: {
      game: true,
      performance: true,
    },
  });
}

export async function deleteGameAd(id: string) {
  return prisma.gameAd.delete({
    where: { id },
  });
}

export async function getGameAdsByGameId(gameId: string) {
  return prisma.gameAd.findMany({
    where: {
      gameId,
    },
    include: {
      game: true,
      performance: true,
    },
  });
} 