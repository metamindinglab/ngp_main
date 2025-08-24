/// <reference types="jest" />
import { Prisma } from '@prisma/client'
import path from 'path'
import fs from 'fs/promises'
import { prismaTestClient as prisma } from '@/lib/db/test-client'

// Mock data
const mockGame = {
  id: 'test_game_001',
  name: 'Test Game',
  description: 'A test game',
  genre: 'Test',
  metrics: { players: 100 },
  dates: { created: '2024-03-20T00:00:00Z' }
}

describe('Database Migration Tests', () => {
  beforeAll(async () => {
    // Create a test database connection
    await prisma.$connect()
  })

  beforeEach(async () => {
    // Clean up any existing test records before each test
    await prisma.gameAdPerformance.deleteMany({ where: { gameId: { in: ['test_game_001', 'test_game_002'] } } });
    await prisma.gameAd.deleteMany({ where: { gameId: { in: ['test_game_001', 'test_game_002'] } } });
    await prisma.game.deleteMany({ where: { id: { in: ['test_game_001', 'test_game_002'] } } });
  })

  afterAll(async () => {
    // Clean up test data and close connection
    await prisma.gameAdPerformance.deleteMany({ where: { gameId: { in: ['test_game_001', 'test_game_002'] } } });
    await prisma.gameAd.deleteMany({ where: { gameId: { in: ['test_game_001', 'test_game_002'] } } });
    await prisma.game.deleteMany({ where: { id: { in: ['test_game_001', 'test_game_002'] } } });
    await prisma.$disconnect();
  })

  it('should successfully migrate a game', async () => {
    // Create a game
    const game = await prisma.game.create({
      data: {
        id: mockGame.id,
        name: mockGame.name,
        description: mockGame.description,
        genre: mockGame.genre,
        metrics: mockGame.metrics as Prisma.InputJsonValue,
        dates: mockGame.dates as Prisma.InputJsonValue,
        createdAt: new Date(mockGame.dates.created),
        updatedAt: new Date(mockGame.dates.created)
      }
    })

    // Verify the game was created
    expect(game).toBeDefined()
    expect(game.id).toBe(mockGame.id)
    expect(game.name).toBe(mockGame.name)
    expect(game.metrics).toEqual(mockGame.metrics)
  })

  it('should handle null JSON fields correctly', async () => {
    const gameWithNulls = await prisma.game.create({
      data: {
        id: 'test_game_002',
        name: 'Test Game 2',
        metrics: Prisma.JsonNull,
        dates: Prisma.JsonNull,
        owner: Prisma.JsonNull,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    expect(gameWithNulls).toBeDefined()
    expect(gameWithNulls.metrics).toBeNull()
    expect(gameWithNulls.dates).toBeNull()
    expect(gameWithNulls.owner).toBeNull()
  })
}) 