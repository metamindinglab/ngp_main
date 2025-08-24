import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcrypt'
import { sign } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await prisma.gameOwner.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Get user's games
    const games = await prisma.game.findMany({
      where: { gameOwnerId: user.id },
      select: {
        id: true,
        name: true,
        genre: true,
        thumbnail: true,
        metrics: true
      }
    })

    // Create JWT token
    const sessionToken = sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Return success with user data
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
      gamesCount: games.length,
      sessionToken
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
} 