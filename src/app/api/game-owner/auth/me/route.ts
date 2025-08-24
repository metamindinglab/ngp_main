import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify JWT token
    let userId: string
    try {
      const decoded = verify(sessionToken, JWT_SECRET) as { userId: string }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.gameOwner.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get games for this user
    const games = await prisma.game.findMany({
      where: {
        gameOwnerId: user.id
      },
      select: {
        id: true,
        name: true,
        genre: true,
        thumbnail: true,
        metrics: true
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        gameOwnerId: user.id,
        emailVerified: true,
        lastLogin: new Date().toISOString()
      },
      games,
      gamesCount: games.length
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get user info' },
      { status: 500 }
    )
  }
} 