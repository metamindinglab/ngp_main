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

    // Find platform admin in database
    const admin = await prisma.platformAdmin.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await compare(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token
    const sessionToken = sign(
      { 
        userId: admin.id,
        role: admin.role,
        type: 'platform-admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Return success with admin data
    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        type: 'platform-admin',
        lastLogin: new Date().toISOString()
      },
      sessionToken
    })
  } catch (error) {
    console.error('Platform admin login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
} 