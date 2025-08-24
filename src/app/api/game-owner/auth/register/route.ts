import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { extractGameOwners } from '@/utils/extractGameOwners'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, country, discordId } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if this email is in our extracted game owners (for validation)
    const extractedOwners = await extractGameOwners()
    const validOwner = extractedOwners.validOwners.find(
      owner => owner.email.toLowerCase() === email.toLowerCase()
    )

    if (!validOwner) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This email is not associated with any games in our system. Please contact support.' 
        },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.gameOwner.findUnique({
      where: {
        email: email.toLowerCase()
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create new user
    const userId = uuidv4()
    const user = await prisma.gameOwner.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update games with this owner's email to use the new gameOwnerId
    await prisma.game.updateMany({
      where: {
        owner: {
          path: ['email'],
          equals: email.toLowerCase()
        }
      },
      data: {
        gameOwnerId: userId,
        owner: {
          name,
          email: email.toLowerCase(),
          country: country || '',
          discordId: discordId || ''
        }
      }
    })

    // Get user's games
    const games = await prisma.game.findMany({
      where: { gameOwnerId: userId },
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
      { userId },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        gameOwnerId: userId,
        emailVerified: true,
        lastLogin: new Date().toISOString()
      },
      games,
      gamesCount: games.length,
      sessionToken
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
} 