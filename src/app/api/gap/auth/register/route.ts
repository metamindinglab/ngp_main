import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, companyName, companySize, jobTitle, country, industry } = await request.json()

    // Validate required fields
    if (!email || !password || !name || !companySize || !jobTitle || !country) {
      return NextResponse.json(
        { success: false, error: 'Email, password, name, company size, job title, and country are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (at least 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate company size
    const validCompanySizes = ['startup', 'small', 'medium', 'large', 'enterprise']
    if (!validCompanySizes.includes(companySize)) {
      return NextResponse.json(
        { success: false, error: 'Invalid company size' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.brandUser.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create new brand user with free trial
    const userId = uuidv4()
    const trialExpiresAt = new Date()
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 30) // 30-day trial

    const brandUser = await prisma.brandUser.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        companyName: companyName || null,
        companySize,
        jobTitle,
        country,
        industry: industry || null,
        subscriptionTier: 'free_trial',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: trialExpiresAt,
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create initial subscription record
    await prisma.brandUserSubscription.create({
      data: {
        id: uuidv4(),
        brandUserId: userId,
        tier: 'free_trial',
        status: 'active',
        startDate: new Date(),
        endDate: trialExpiresAt,
        features: {
          maxGameAds: 5,
          maxPlaylists: 1,
          analyticsLevel: 'basic',
          support: 'email',
          customTemplates: false,
          abTesting: false,
          whiteLabel: false,
          customIntegrations: false
        }
      }
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

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      sessionToken
    })
  } catch (error) {
    console.error('Brand user registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
} 