import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'
import { hash } from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Middleware function to verify platform admin authentication
async function verifyPlatformAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (!sessionToken) {
    return { isValid: false, error: 'Unauthorized' }
  }

  try {
    const decoded = verify(sessionToken, JWT_SECRET) as { userId: string; type: string; role: string }
    
    if (decoded.type !== 'platform-admin') {
      return { isValid: false, error: 'Invalid token type' }
    }

    // Get admin from database to verify they still exist
    const admin = await prisma.platformAdmin.findUnique({
      where: { id: decoded.userId }
    })

    if (!admin) {
      return { isValid: false, error: 'Admin not found' }
    }

    return { isValid: true, admin }
  } catch (error) {
    return { isValid: false, error: 'Invalid token' }
  }
}

// GET - List all platform admin users
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyPlatformAdmin(request)
    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    // Get all platform admins (excluding passwords)
    const admins = await prisma.platformAdmin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      users: admins,
      total: admins.length
    })
  } catch (error) {
    console.error('Error fetching platform admin users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new platform admin user
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyPlatformAdmin(request)
    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const { email, password, name, role = 'admin' } = await request.json()

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
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

    // Check if admin already exists
    const existingAdmin = await prisma.platformAdmin.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create new platform admin
    const adminId = uuidv4()
    const newAdmin = await prisma.platformAdmin.create({
      data: {
        id: adminId,
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user: newAdmin,
      message: 'Platform admin user created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating platform admin user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 