import { prisma } from '.';
import type { Prisma } from '@prisma/client';

export type AssetCreateInput = Prisma.AssetCreateInput;
export type AssetUpdateInput = Prisma.AssetUpdateInput;

export async function getAllAssets() {
  return prisma.asset.findMany({
    orderBy: {
      updatedAt: 'desc'  // Sort by most recently updated first
    }
  });
}

export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
  });
}

export async function createAsset(data: AssetCreateInput) {
  return prisma.asset.create({
    data,
  });
}

export async function updateAsset(id: string, data: AssetUpdateInput) {
  return prisma.asset.update({
    where: { id },
    data,
  });
}

export async function deleteAsset(id: string) {
  return prisma.asset.delete({
    where: { id },
  });
}

export async function getAssetsByGameId(gameId: string) {
  // TODO: Implement proper many-to-many relationship query
  return prisma.asset.findMany({});
}

export async function getAssetsByPlaylistId(playlistId: string) {
  // TODO: Implement proper many-to-many relationship query
  return prisma.asset.findMany({});
}