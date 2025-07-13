import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'
import { hash } from 'bcrypt'

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

// GET - Get specific platform admin user
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyPlatformAdmin(request)
    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const userId = params.id

    // Get specific platform admin (excluding password)
    const admin = await prisma.platformAdmin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: admin
    })
  } catch (error) {
    console.error('Error fetching platform admin user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT - Update platform admin user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyPlatformAdmin(request)
    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const userId = params.id
    const { email, name, role, password } = await request.json()

    // Check if user exists
    const existingAdmin = await prisma.platformAdmin.findUnique({
      where: { id: userId }
    })

    if (!existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-deletion or role change (basic protection)
    if (userId === auth.admin?.id && role && role !== existingAdmin.role) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    if (email && email.toLowerCase() !== existingAdmin.email) {
      const emailExists = await prisma.platformAdmin.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
      updateData.email = email.toLowerCase()
    }

    if (name) updateData.name = name
    if (role) updateData.role = role

    // Handle password update
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 8 characters long' },
          { status: 400 }
        )
      }
      updateData.password = await hash(password, 10)
    }

    // Update the admin
    const updatedAdmin = await prisma.platformAdmin.update({
      where: { id: userId },
      data: updateData,
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
      user: updatedAdmin,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating platform admin user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete platform admin user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyPlatformAdmin(request)
    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const userId = params.id

    // Check if user exists
    const existingAdmin = await prisma.platformAdmin.findUnique({
      where: { id: userId }
    })

    if (!existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-deletion
    if (userId === auth.admin?.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if this is the last admin
    const adminCount = await prisma.platformAdmin.count()
    if (adminCount <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last platform admin' },
        { status: 400 }
      )
    }

    // Delete the admin
    await prisma.platformAdmin.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting platform admin user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 