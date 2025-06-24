import { prisma } from '.';
import type { Prisma } from '@prisma/client';

export type AssetCreateInput = Prisma.AssetCreateInput;
export type AssetUpdateInput = Prisma.AssetUpdateInput;

export async function getAllAssets() {
  return prisma.asset.findMany({
    include: {
      games: true,
      playlists: true,
    },
    orderBy: {
      updatedAt: 'desc'  // Sort by most recently updated first
    }
  });
}

export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      games: true,
      playlists: true,
    },
  });
}

export async function createAsset(data: AssetCreateInput) {
  return prisma.asset.create({
    data,
    include: {
      games: true,
      playlists: true,
    },
  });
}

export async function updateAsset(id: string, data: AssetUpdateInput) {
  return prisma.asset.update({
    where: { id },
    data,
    include: {
      games: true,
      playlists: true,
    },
  });
}

export async function deleteAsset(id: string) {
  return prisma.asset.delete({
    where: { id },
  });
}

export async function getAssetsByGameId(gameId: string) {
  return prisma.asset.findMany({
    where: {
      games: {
        some: {
          id: gameId,
        },
      },
    },
    include: {
      games: true,
      playlists: true,
    },
  });
}

export async function getAssetsByPlaylistId(playlistId: string) {
  return prisma.asset.findMany({
    where: {
      playlists: {
        some: {
          id: playlistId,
        },
      },
    },
    include: {
      games: true,
      playlists: true,
    },
  });
} 