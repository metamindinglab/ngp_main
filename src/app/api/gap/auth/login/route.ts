import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcrypt'
import { sign } from 'jsonwebtoken'

const prisma = new PrismaClient()

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

    // Find brand user in database
    const brandUser = await (prisma as any).brandUser.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!brandUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!brandUser.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is suspended. Please contact support.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await compare(password, brandUser.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    await (prisma as any).brandUser.update({
      where: { id: brandUser.id },
      data: { lastLogin: new Date() }
    })

    // Create JWT token
    const sessionToken = sign(
      { 
        userId: brandUser.id,
        type: 'brand-user',
        subscriptionTier: brandUser.subscriptionTier
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Return success with user data (excluding password)
    const { password: _, ...userWithoutPassword } = brandUser
    
    const response = NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        lastLogin: new Date().toISOString()
      },
      sessionToken
    })

    // Set the session token as an HTTP-only cookie
    response.cookies.set('brandUserSessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Brand user login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
} 