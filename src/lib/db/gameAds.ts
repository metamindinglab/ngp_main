import { prisma } from '.';
import type { Prisma, GameAd, Game, GameAdPerformance, AdContainer } from '@prisma/client';

export type GameAdCreateInput = Prisma.GameAdCreateInput;
export type GameAdUpdateInput = Prisma.GameAdUpdateInput;

export type GameAdWithRelations = GameAd & {
  games: {
    id: string;
    name: string;
    thumbnail: string | null;
  }[];
  performance: GameAdPerformance[];
  containers: AdContainer[];
};

type PrismaGameAd = GameAd & {
  games: Game[];
  performance: GameAdPerformance[];
  containers: AdContainer[];
};

function convertToGameAdWithRelations(result: unknown): GameAdWithRelations {
  const prismaResult = result as PrismaGameAd;
  return {
    ...prismaResult,
    games: prismaResult.games.map(game => ({
      id: game.id,
      name: game.name,
      thumbnail: game.thumbnail
    }))
  };
}

export async function getAllGameAds(): Promise<GameAdWithRelations[]> {
  const results = await prisma.gameAd.findMany({
    include: {
      games: {
        select: {
          id: true,
          name: true,
          thumbnail: true
        }
      },
      performance: true,
      containers: true
    },
  });
  return results;
}

export async function getGameAdById(id: string): Promise<GameAdWithRelations | null> {
  const result = await prisma.gameAd.findUnique({
    where: { id },
    include: {
      games: {
        select: {
          id: true,
          name: true,
          thumbnail: true
        }
      },
      performance: true,
      containers: true
    },
  });
  return result;
}

export async function createGameAd(data: Prisma.GameAdCreateInput): Promise<GameAdWithRelations> {
  const result = await prisma.gameAd.create({
    data: {
      ...data,
      id: data.id || crypto.randomUUID(),
      updatedAt: new Date(),
    },
    include: {
      games: {
        select: {
          id: true,
          name: true,
          thumbnail: true
        }
      },
      performance: true,
      containers: true
    },
  });
  return result;
}

export async function updateGameAd(id: string, data: Prisma.GameAdUpdateInput): Promise<GameAdWithRelations> {
  const result = await prisma.gameAd.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      games: {
        select: {
          id: true,
          name: true,
          thumbnail: true
        }
      },
      performance: true,
      containers: true
    },
  });
  return result;
}

export async function deleteGameAd(id: string): Promise<GameAdWithRelations> {
  const result = await prisma.gameAd.delete({
    where: { id },
    include: {
      games: {
        select: {
          id: true,
          name: true,
          thumbnail: true
        }
      },
      performance: true,
      containers: true
    },
  });
  return result;
}

export async function getGameAdsByGameId(gameId: string): Promise<GameAdWithRelations[]> {
  const results = await prisma.gameAd.findMany({
    where: {
      games: {
        some: {
          id: gameId
        }
      }
    },
    include: {
      games: {
        select: {
          id: true,
          name: true,
          thumbnail: true
        }
      },
      performance: true,
      containers: true
    },
  });
  return results;
}

export async function connectGameToAd(gameId: string, adId: string): Promise<GameAdWithRelations> {
  const result = await prisma.gameAd.update({
    where: { id: adId },
    data: {
      games: {
        connect: { id: gameId }
      },
      updatedAt: new Date(),
    },
    include: {
      games: {
        select: {
          id: true,
          name: true,
          thumbnail: true
        }
      },
      performance: true,
      containers: true
    },
  });
  return result;
}

export async function disconnectGameFromAd(gameId: string, adId: string): Promise<GameAdWithRelations> {
  const result = await prisma.gameAd.update({
    where: { id: adId },
    data: {
      games: {
        disconnect: { id: gameId }
      },
      updatedAt: new Date(),
    },
    include: {
      games: {
        select: {
          id: true,
          name: true,
          thumbnail: true
        }
      },
      performance: true,
      containers: true
    },
  });
  return result;
}