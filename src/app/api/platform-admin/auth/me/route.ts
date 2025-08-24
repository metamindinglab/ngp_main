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
    let tokenType: string
    try {
      const decoded = verify(sessionToken, JWT_SECRET) as { userId: string; type: string }
      userId = decoded.userId
      tokenType = decoded.type
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Ensure this is a platform admin token
    if (tokenType !== 'platform-admin') {
      return NextResponse.json(
        { success: false, error: 'Invalid token type' },
        { status: 401 }
      )
    }

    // Get platform admin from database
    const admin = await prisma.platformAdmin.findUnique({
      where: { id: userId }
    })

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Platform admin not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        type: 'platform-admin',
        lastLogin: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Platform admin session validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate session' },
      { status: 500 }
    )
  }
} 