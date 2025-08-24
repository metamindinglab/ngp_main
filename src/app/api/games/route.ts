import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET() {
  try {
    // Fetch games with media and latest metrics using raw SQL
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          select: {
            id: true,
            type: true,
            title: true,
            localPath: true,
            thumbnailUrl: true
          }
        }
      }
    });

    // For each game, fetch the latest metrics
    const gamesWithMetrics = await Promise.all(games.map(async (game) => {
      // Fetch latest metrics for DAU, MAU, and D1 Retention using raw SQL
      const [latestDAU, latestMAU, latestD1Retention] = await Promise.all([
        prisma.$queryRaw<Array<{ value: number, date: Date }>>`
          SELECT value, date
          FROM "GameMetricData"
          WHERE "gameId" = ${game.id} AND "metricType"::text = 'daily_active_users'
          ORDER BY date DESC
          LIMIT 1
        `,
        prisma.$queryRaw<Array<{ value: number, date: Date }>>`
          SELECT value, date
          FROM "GameMetricData"
          WHERE "gameId" = ${game.id} AND "metricType"::text = 'monthly_active_users_by_day'
          ORDER BY date DESC
          LIMIT 1
        `,
        prisma.$queryRaw<Array<{ value: number, date: Date }>>`
          SELECT value, date
          FROM "GameMetricData"
          WHERE "gameId" = ${game.id} AND "metricType"::text = 'd1_retention'
          ORDER BY date DESC
          LIMIT 1
        `
      ]);

      // Update the game object with latest metrics
      const updatedGame = {
        ...game,
        latestMetrics: {
          dau: latestDAU[0]?.value || 0,
          mau: latestMAU[0]?.value || 0,
          day1Retention: latestD1Retention[0]?.value || 0
        }
      };

      return updatedGame;
    }));

    return NextResponse.json({ games: gamesWithMetrics });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate a unique ID for the game
    const gameId = `game_${crypto.randomUUID().slice(0, 8)}`;
    
    // Create the new game
    const newGame = await prisma.game.create({
      data: {
        id: gameId,
        name: body.name,
        description: body.description,
        genre: body.genre,
        robloxLink: body.robloxLink,
        thumbnail: body.thumbnail,
        metrics: body.metrics,
        dates: body.dates,
        owner: body.owner,
        robloxAuthorization: body.robloxAuthorization,
        updatedAt: new Date()
      },
      include: {
        media: {
          select: {
            id: true,
            type: true,
            title: true,
            localPath: true,
            thumbnailUrl: true
          }
        }
      }
    });

    return NextResponse.json(newGame);
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json()
    
    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id }
    })
    
    if (!existingGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    
    // Update the game
    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ success: true, game: updatedGame })
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }
    
    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id }
    })
    
    if (!existingGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    
    // Delete the game
    await prisma.game.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  }
} 