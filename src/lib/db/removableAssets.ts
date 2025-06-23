import { prisma } from '.';
import type { Prisma } from '@prisma/client';

export type RemovableAssetCreateInput = Prisma.RemovableAssetCreateInput;
export type RemovableAssetUpdateInput = Prisma.RemovableAssetUpdateInput;

export async function getAllRemovableAssets() {
  return prisma.removableAsset.findMany();
}

export async function getRemovableAssetById(id: string) {
  return prisma.removableAsset.findUnique({
    where: { id },
  });
}

export async function createRemovableAsset(data: RemovableAssetCreateInput) {
  return prisma.removableAsset.create({
    data,
  });
}

export async function updateRemovableAsset(id: string, data: RemovableAssetUpdateInput) {
  return prisma.removableAsset.update({
    where: { id },
    data,
  });
}

export async function deleteRemovableAsset(id: string) {
  return prisma.removableAsset.delete({
    where: { id },
  });
}

export async function getRemovableAssetByRobloxId(robloxAssetId: string) {
  return prisma.removableAsset.findFirst({
    where: {
      robloxAssetId,
    },
  });
} 