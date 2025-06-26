import { NextRequest, NextResponse } from 'next/server'
import { jsonAuthService } from '@/lib/json-auth'
import { extractGameOwners } from '@/utils/extractGameOwners'

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
    const extractedOwners = extractGameOwners()
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

    const result = await jsonAuthService.registerUser(email, password, name, country, discordId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user!.id,
        gameOwnerId: result.user!.gameOwnerId,
        email: result.user!.email,
        name: result.user!.name,
        country: result.user!.country,
        discordId: result.user!.discordId
      },
      gamesCount: validOwner.games.length
    })

    // Set httpOnly cookie for session
    response.cookies.set('game-owner-session', result.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
} 