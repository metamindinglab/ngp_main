import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/game-ads/route'
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/game-ads/[id]/route'
import { prisma } from '@/lib/db'

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
  ]
}

const mockGameAdPerformance = {
  gameAdId: 'ad_001',
  gameId: 'game_001',
  date: new Date(),
  metrics: {
    totalImpressions: 1000,
    uniqueImpressions: 800,
    totalEngagements: 200,
    uniqueEngagements: 150,
    averageEngagementDuration: 30,
    engagementRate: 20,
    completionRate: 80,
    conversionRate: 10
  }
}

describe('Game Ads API', () => {
  beforeEach(async () => {
    // Clear database and create test data
    await prisma.gameAdPerformance.deleteMany()
    await prisma.gameAd.deleteMany()
    await prisma.game.deleteMany()

    await prisma.game.create({ data: mockGame })
  })

  afterEach(async () => {
    // Clean up
    await prisma.gameAdPerformance.deleteMany()
    await prisma.gameAd.deleteMany()
    await prisma.game.deleteMany()
  })

  describe('GET /api/game-ads', () => {
    it('should return empty list when no ads exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/game-ads')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.gameAds).toHaveLength(0)
      expect(data.total).toBe(0)
      expect(data.page).toBe(1)
      expect(data.totalPages).toBe(0)
    })

    it('should return list of game ads with pagination', async () => {
      // Create test ads
      await prisma.gameAd.createMany({
        data: [
          { ...mockGameAd, id: 'ad_001', name: 'Test Ad 1' },
          { ...mockGameAd, id: 'ad_002', name: 'Test Ad 2' },
          { ...mockGameAd, id: 'ad_003', name: 'Test Ad 3' }
        ]
      })

      const request = new NextRequest('http://localhost:3000/api/game-ads?page=1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.gameAds).toHaveLength(3)
      expect(data.total).toBe(3)
      expect(data.page).toBe(1)
      expect(data.totalPages).toBe(1)
    })

    it('should filter game ads by search term', async () => {
      // Create test ads
      await prisma.gameAd.createMany({
        data: [
          { ...mockGameAd, id: 'ad_001', name: 'Test Ad Alpha' },
          { ...mockGameAd, id: 'ad_002', name: 'Test Ad Beta' },
          { ...mockGameAd, id: 'ad_003', name: 'Different Name' }
        ]
      })

      const request = new NextRequest('http://localhost:3000/api/game-ads?search=Test Ad')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.gameAds).toHaveLength(2)
      expect(data.gameAds[0].name).toContain('Test Ad')
      expect(data.gameAds[1].name).toContain('Test Ad')
    })

    it('should filter game ads by status', async () => {
      // Create test ads
      await prisma.gameAd.createMany({
        data: [
          { ...mockGameAd, id: 'ad_001', status: 'active' },
          { ...mockGameAd, id: 'ad_002', status: 'inactive' },
          { ...mockGameAd, id: 'ad_003', status: 'active' }
        ]
      })

      const request = new NextRequest('http://localhost:3000/api/game-ads?status=active')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.gameAds).toHaveLength(2)
      expect(data.gameAds[0].status).toBe('active')
      expect(data.gameAds[1].status).toBe('active')
    })
  })

  describe('POST /api/game-ads', () => {
    it('should create a new game ad', async () => {
      const request = new NextRequest('http://localhost:3000/api/game-ads', {
        method: 'POST',
        body: JSON.stringify(mockGameAd)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe(mockGameAd.name)
      expect(data.templateType).toBe(mockGameAd.type)
      expect(data.assets).toEqual(mockGameAd.assets)
    })

    it('should validate required fields', async () => {
      const invalidAd = {
        name: '', // Invalid: empty name
        templateType: 'multimedia_display',
        assets: [] // Invalid: empty assets array
      }

      const request = new NextRequest('http://localhost:3000/api/game-ads', {
        method: 'POST',
        body: JSON.stringify(invalidAd)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })
  })

  describe('GET /api/game-ads/[id]', () => {
    it('should return a single game ad', async () => {
      // Create test ad
      const ad = await prisma.gameAd.create({
        data: { ...mockGameAd, id: 'ad_001' }
      })

      const request = new NextRequest('http://localhost:3000/api/game-ads/ad_001')
      const response = await GET_BY_ID(request, { params: { id: ad.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(ad.id)
      expect(data.name).toBe(ad.name)
    })

    it('should return 404 for non-existent ad', async () => {
      const request = new NextRequest('http://localhost:3000/api/game-ads/non-existent')
      const response = await GET_BY_ID(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Game ad not found')
    })
  })

  describe('PUT /api/game-ads/[id]', () => {
    it('should update an existing game ad', async () => {
      // Create test ad
      const ad = await prisma.gameAd.create({
        data: { ...mockGameAd, id: 'ad_001' }
      })

      const updates = {
        ...mockGameAd,
        name: 'Updated Ad Name',
        status: 'inactive'
      }

      const request = new NextRequest('http://localhost:3000/api/game-ads/ad_001', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      const response = await PUT(request, { params: { id: ad.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe(updates.name)
      expect(data.status).toBe(updates.status)
    })

    it('should validate update data', async () => {
      // Create test ad
      const ad = await prisma.gameAd.create({
        data: { ...mockGameAd, id: 'ad_001' }
      })

      const invalidUpdates = {
        name: '', // Invalid: empty name
        templateType: 'multimedia_display',
        assets: [] // Invalid: empty assets array
      }

      const request = new NextRequest('http://localhost:3000/api/game-ads/ad_001', {
        method: 'PUT',
        body: JSON.stringify(invalidUpdates)
      })

      const response = await PUT(request, { params: { id: ad.id } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })
  })

  describe('DELETE /api/game-ads/[id]', () => {
    it('should delete an existing game ad', async () => {
      // Create test ad
      const ad = await prisma.gameAd.create({
        data: { ...mockGameAd, id: 'ad_001' }
      })

      const request = new NextRequest('http://localhost:3000/api/game-ads/ad_001')
      const response = await DELETE(request, { params: { id: ad.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify deletion
      const deleted = await prisma.gameAd.findUnique({
        where: { id: ad.id }
      })
      expect(deleted).toBeNull()
    })

    it('should return 404 for non-existent ad', async () => {
      const request = new NextRequest('http://localhost:3000/api/game-ads/non-existent')
      const response = await DELETE(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Game ad not found')
    })
  })
}) 