import { prisma } from '.';
import type { Game, Prisma } from '@prisma/client';

export type GameCreateInput = Prisma.GameCreateInput;
export type GameUpdateInput = Prisma.GameUpdateInput;

export async function getAllGames() {
  return prisma.game.findMany({
    include: {
      assets: true,
      ads: true,
      playlists: true,
    },
  });
}

export async function getGameById(id: string) {
  return prisma.game.findUnique({
    where: { id },
    include: {
      assets: true,
      ads: true,
      playlists: true,
    },
  });
}

export async function createGame(data: GameCreateInput) {
  return prisma.game.create({
    data,
    include: {
      assets: true,
      ads: true,
      playlists: true,
    },
  });
}

export async function updateGame(id: string, data: GameUpdateInput) {
  return prisma.game.update({
    where: { id },
    data,
    include: {
      assets: true,
      ads: true,
      playlists: true,
    },
  });
}

export async function deleteGame(id: string) {
  return prisma.game.delete({
    where: { id },
  });
} 