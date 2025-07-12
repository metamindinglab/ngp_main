import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// CORS headers for Roblox compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
}

// Rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function addCorsHeaders(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function handleAuth(request: NextRequest): Promise<{ isValid: boolean; gameId?: string; apiKey?: string; error?: string }> {
  // Check for API key in header (Roblox-friendly)
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!apiKey) {
    return { isValid: false, error: 'Missing API key' }
  }

  // Validate API key format
  if (!apiKey.startsWith('RBXG-')) {
    return { isValid: false, error: 'Invalid API key format' }
  }

  try {
    // Find game by API key
    const game = await prisma.game.findFirst({
      where: { 
        serverApiKey: apiKey,
        serverApiKeyStatus: 'active'
      }
    })

    if (!game) {
      return { isValid: false, error: 'Invalid or inactive API key' }
    }

    return { isValid: true, gameId: game.id, apiKey }
  } catch (error) {
    console.error('Auth error:', error)
    return { isValid: false, error: 'Authentication failed' }
  }
}

export function applyRateLimit(apiKey: string): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 100 // per minute

  const current = rateLimitStore.get(apiKey)
  
  if (!current || now > current.resetTime) {
    // New window
    const resetTime = now + windowMs
    rateLimitStore.set(apiKey, { count: 1, resetTime })
    return { allowed: true, remainingRequests: maxRequests - 1, resetTime }
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remainingRequests: 0, resetTime: current.resetTime }
  }

  current.count++
  rateLimitStore.set(apiKey, current)
  return { allowed: true, remainingRequests: maxRequests - current.count, resetTime: current.resetTime }
}

export function addRateLimitHeaders(response: NextResponse, rateLimit: { remainingRequests: number; resetTime: number }) {
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', rateLimit.remainingRequests.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString())
  return response
}

export async function handleOptions() {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
} 