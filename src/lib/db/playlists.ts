import { prisma } from '.';
import type { Prisma } from '@prisma/client';

export type PlaylistCreateInput = Prisma.PlaylistCreateInput;
export type PlaylistUpdateInput = Prisma.PlaylistUpdateInput;

export async function getAllPlaylists() {
  return prisma.playlist.findMany({
    include: {
      AssetPlaylists: true,
      GamePlaylists: true,
      schedules: true,
    },
  });
}

export async function getPlaylistById(id: string) {
  return prisma.playlist.findUnique({
    where: { id },
    include: {
      AssetPlaylists: true,
      GamePlaylists: true,
      schedules: true,
    },
  });
}

export async function createPlaylist(data: PlaylistCreateInput) {
  return prisma.playlist.create({
    data,
    include: {
      AssetPlaylists: true,
      GamePlaylists: true,
      schedules: true,
    },
  });
}

export async function updatePlaylist(id: string, data: PlaylistUpdateInput) {
  return prisma.playlist.update({
    where: { id },
    data,
    include: {
      AssetPlaylists: true,
      GamePlaylists: true,
      schedules: true,
    },
  });
}

export async function deletePlaylist(id: string) {
  return prisma.playlist.delete({
    where: { id },
  });
}

export async function getPlaylistsByGameId(gameId: string) {
  return prisma.playlist.findMany({
    where: {
      GamePlaylists: {
        some: {
          A: gameId,
        },
      },
    },
    include: {
      AssetPlaylists: true,
      GamePlaylists: true,
      schedules: true,
    },
  });
}

export async function getPlaylistsByAssetId(assetId: string) {
  return prisma.playlist.findMany({
    where: {
      AssetPlaylists: {
        some: {
          A: assetId,
        },
      },
    },
    include: {
      AssetPlaylists: true,
      GamePlaylists: true,
      schedules: true,
    },
  });
} 