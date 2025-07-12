import { prisma } from '.';
import type { Prisma } from '@prisma/client';

export type GameAdPerformanceCreateInput = Prisma.GameAdPerformanceCreateInput;
export type GameAdPerformanceUpdateInput = Prisma.GameAdPerformanceUpdateInput;

export async function getAllGameAdPerformance() {
  return prisma.gameAdPerformance.findMany({
    include: {
      ad: true,
    },
  });
}

export async function getGameAdPerformanceById(id: string) {
  return prisma.gameAdPerformance.findUnique({
    where: { id },
    include: {
      ad: true,
    },
  });
}

export async function createGameAdPerformance(data: GameAdPerformanceCreateInput) {
  return prisma.gameAdPerformance.create({
    data,
    include: {
      ad: true,
    },
  });
}

export async function updateGameAdPerformance(id: string, data: GameAdPerformanceUpdateInput) {
  return prisma.gameAdPerformance.update({
    where: { id },
    data,
    include: {
      ad: true,
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
      ad: true,
    },
  });
}

export async function getGameAdPerformanceByGameId(gameId: string) {
  return prisma.gameAdPerformance.findMany({
    where: {
      gameId,
    },
    include: {
      ad: true,
    },
  });
}

export async function getGameAdPerformanceByPlaylistId(playlistId: string) {
  return prisma.gameAdPerformance.findMany({
    where: {
      playlistId,
    },
    include: {
      ad: true,
    },
  });
} 