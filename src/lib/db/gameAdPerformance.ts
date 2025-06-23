import { prisma } from '.';
import type { Prisma } from '@prisma/client';

export type GameAdPerformanceCreateInput = Prisma.GameAdPerformanceCreateInput;
export type GameAdPerformanceUpdateInput = Prisma.GameAdPerformanceUpdateInput;

export async function getAllGameAdPerformance() {
  return prisma.gameAdPerformance.findMany({
    include: {
      gameAd: true,
    },
  });
}

export async function getGameAdPerformanceById(id: string) {
  return prisma.gameAdPerformance.findUnique({
    where: { id },
    include: {
      gameAd: true,
    },
  });
}

export async function createGameAdPerformance(data: GameAdPerformanceCreateInput) {
  return prisma.gameAdPerformance.create({
    data,
    include: {
      gameAd: true,
    },
  });
}

export async function updateGameAdPerformance(id: string, data: GameAdPerformanceUpdateInput) {
  return prisma.gameAdPerformance.update({
    where: { id },
    data,
    include: {
      gameAd: true,
    },
  });
}

export async function deleteGameAdPerformance(id: string) {
  return prisma.gameAdPerformance.delete({
    where: { id },
  });
}

export async function getGameAdPerformanceByGameAdId(gameAdId: string) {
  return prisma.gameAdPerformance.findMany({
    where: {
      gameAdId,
    },
    include: {
      gameAd: true,
    },
  });
}

export async function getGameAdPerformanceByGameId(gameId: string) {
  return prisma.gameAdPerformance.findMany({
    where: {
      gameId,
    },
    include: {
      gameAd: true,
    },
  });
}

export async function getGameAdPerformanceByPlaylistId(playlistId: string) {
  return prisma.gameAdPerformance.findMany({
    where: {
      playlistId,
    },
    include: {
      gameAd: true,
    },
  });
} 