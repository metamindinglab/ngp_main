import { prisma } from '.';
import type { Prisma } from '@prisma/client';

export type AssetCreateInput = Prisma.AssetCreateInput;
export type AssetUpdateInput = Prisma.AssetUpdateInput;

export async function getAllAssets() {
  return prisma.asset.findMany({
    include: {
      GameAssets: {
        include: {
          Game: true
        }
      },
      AssetPlaylists: {
        include: {
          Playlist: true
        }
      },
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
      GameAssets: {
        include: {
          Game: true
        }
      },
      AssetPlaylists: {
        include: {
          Playlist: true
        }
      },
    },
  });
}

export async function createAsset(data: AssetCreateInput) {
  return prisma.asset.create({
    data,
    include: {
      GameAssets: {
        include: {
          Game: true
        }
      },
      AssetPlaylists: {
        include: {
          Playlist: true
        }
      },
    },
  });
}

export async function updateAsset(id: string, data: AssetUpdateInput) {
  return prisma.asset.update({
    where: { id },
    data,
    include: {
      GameAssets: {
        include: {
          Game: true
        }
      },
      AssetPlaylists: {
        include: {
          Playlist: true
        }
      },
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
      GameAssets: {
        some: {
          B: gameId,
        },
      },
    },
    include: {
      GameAssets: {
        include: {
          Game: true
        }
      },
      AssetPlaylists: {
        include: {
          Playlist: true
        }
      },
    },
  });
}

export async function getAssetsByPlaylistId(playlistId: string) {
  return prisma.asset.findMany({
    where: {
      AssetPlaylists: {
        some: {
          B: playlistId,
        },
      },
    },
    include: {
      GameAssets: {
        include: {
          Game: true
        }
      },
      AssetPlaylists: {
        include: {
          Playlist: true
        }
      },
    },
  });
}