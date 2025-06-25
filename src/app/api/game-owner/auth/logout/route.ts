import { NextRequest, NextResponse } from 'next/server'
import { jsonAuthService } from '@/lib/json-auth'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('game-owner-session')?.value

    if (sessionToken) {
      await jsonAuthService.logout(sessionToken)
    }

    // Clear session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('game-owner-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expire immediately
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
} 