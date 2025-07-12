import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Note: With JWT tokens, we don't need to do anything server-side
    // The client should simply remove the token from localStorage
    // If we want to implement token blacklisting in the future,
    // we can add that functionality here

    // Return success response
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
} 