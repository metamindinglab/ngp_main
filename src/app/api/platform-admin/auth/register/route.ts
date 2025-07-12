import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if admin already exists
    const existingAdmin = await prisma.platformAdmin.findUnique({
      where: {
        email: email.toLowerCase()
      }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin user already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create new platform admin
    const adminId = uuidv4()
    const admin = await prisma.platformAdmin.create({
      data: {
        id: adminId,
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create JWT token
    const sessionToken = sign(
      { 
        userId: adminId,
        role: 'admin',
        type: 'platform-admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      user: {
        id: adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        type: 'platform-admin',
        lastLogin: new Date().toISOString()
      },
      sessionToken
    })
  } catch (error) {
    console.error('Platform admin registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
} 