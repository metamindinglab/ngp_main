import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/game-ad-performance/route'
import { prismaTestClient as prisma } from '@/lib/db/test-client'

// Mock data
const mockGame = {
  id: 'game_001',
  name: 'Test Game',
  description: 'A test game',
  genre: 'Action',
  robloxLink: 'https://roblox.com/games/123',
  thumbnail: 'https://example.com/thumbnail.jpg',
  metrics: { dau: 1000 },
  dates: { created: '2024-01-01' },
  owner: { name: 'Test Owner' },
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockGameAd = {
  id: 'ad_001',
  name: 'Test Ad',
  type: 'multimedia_display',
  gameId: 'game_001',
  status: 'active',
  schedule: { startDate: '2024-01-01' },
  targeting: { age: '13+' },
  metrics: { budget: 1000 },
  assets: [
    {
      assetType: 'image',
      assetId: 'asset_001',
      robloxAssetId: 'rbx_001'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
}

const createPerformanceData = (date: Date, metrics = {}) => ({
  gameAdId: 'ad_001',
  gameId: 'game_001',
  date,
  metrics: {
    totalImpressions: 1000,
    uniqueImpressions: 800,
    totalEngagements: 200,
    uniqueEngagements: 150,
    averageEngagementDuration: 30,
    engagementRate: 20,
    completionRate: 80,
    conversionRate: 10,
    ...metrics
  }
})

describe('Game Ad Performance API', () => {
  beforeEach(async () => {
    // Clear database and create test data
    await prisma.gameAdPerformance.deleteMany()
    await prisma.gameAd.deleteMany()
    await prisma.game.deleteMany()

    await prisma.game.create({ data: mockGame })
    await prisma.gameAd.create({ data: mockGameAd })
  })

  afterEach(async () => {
    // Clean up
    await prisma.gameAdPerformance.deleteMany()
    await prisma.gameAd.deleteMany()
    await prisma.game.deleteMany()
  })

  describe('GET /api/game-ad-performance', () => {
    it('should return empty performance data when no metrics exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/game-ad-performance?gameAdId=ad_001')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.performance).toEqual([])
    })

    it('should return performance data for a specific game ad', async () => {
      // Create test performance data
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      await prisma.gameAdPerformance.createMany({
        data: [
          createPerformanceData(today),
          createPerformanceData(yesterday, {
            totalImpressions: 2000,
            uniqueImpressions: 1600
          })
        ]
      })

      const request = new NextRequest('http://localhost:3000/api/game-ad-performance?gameAdId=ad_001')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.performance).toHaveLength(2)
      expect(data.performance[0].metrics.totalImpressions).toBeDefined()
      expect(data.performance[0].metrics.uniqueImpressions).toBeDefined()
    })

    it('should filter performance data by date range', async () => {
      // Create test performance data
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)

      await prisma.gameAdPerformance.createMany({
        data: [
          createPerformanceData(today),
          createPerformanceData(yesterday),
          createPerformanceData(lastWeek)
        ]
      })

      const startDate = yesterday.toISOString().split('T')[0]
      const endDate = today.toISOString().split('T')[0]
      const request = new NextRequest(
        `http://localhost:3000/api/game-ad-performance?gameAdId=ad_001&startDate=${startDate}&endDate=${endDate}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.performance).toHaveLength(2)
    })

    it('should return 400 when gameAdId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/game-ad-performance')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Game ad ID is required')
    })

    it('should return 404 when game ad does not exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/game-ad-performance?gameAdId=non-existent')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Game ad not found')
    })

    it('should validate date range format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/game-ad-performance?gameAdId=ad_001&startDate=invalid-date'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid date format')
    })
  })
}) 