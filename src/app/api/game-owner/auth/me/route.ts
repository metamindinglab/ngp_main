import { NextRequest, NextResponse } from 'next/server'
import { jsonAuthService } from '@/lib/json-auth'
import { getOwnerGames } from '@/utils/extractGameOwners'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('game-owner-session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'No session found' },
        { status: 401 }
      )
    }

    const user = await jsonAuthService.validateSession(sessionToken)

    if (!user) {
      // Clear invalid session cookie
      const response = NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
      response.cookies.set('game-owner-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0
      })
      return response
    }

    // Get user's games
    const userGames = getOwnerGames(user.email)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        gameOwnerId: user.gameOwnerId,
        email: user.email,
        name: user.name,
        country: user.country,
        discordId: user.discordId,
        lastLogin: user.lastLogin,
        emailVerified: user.emailVerified
      },
      gamesCount: userGames.length,
      games: userGames.map(game => ({
        id: game.id,
        name: game.name,
        genre: game.genre,
        thumbnail: game.thumbnail,
        metrics: game.metrics
      }))
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get user info' },
      { status: 500 }
    )
  }
} 