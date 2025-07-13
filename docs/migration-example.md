# Migration Example: Login Route

This example shows how to update an existing login API route to use the new cookie-based session management.

## Before: Using localStorage

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  
  // Validate credentials...
  const user = await validateUser(email, password)
  
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  
  // Create JWT token
  const token = sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })
  
  // Return token to be stored in localStorage
  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
    sessionToken: token
  })
}
```

```typescript
// Client-side login handler
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  const data = await response.json()
  
  if (data.success) {
    // Store token in localStorage
    localStorage.setItem('sessionToken', data.sessionToken)
    router.push('/dashboard')
  }
}
```

## After: Using HTTP-only Cookies

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  
  // Validate credentials...
  const user = await validateUser(email, password)
  
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  
  // Create HTTP-only cookie session
  await createSession(user.id, 'user', user.role)
  
  // Return user data without token (token is now in HTTP-only cookie)
  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name }
  })
}
```

```typescript
// Client-side login handler (simplified)
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  const data = await response.json()
  
  if (data.success) {
    // No need to store token - it's automatically set as HTTP-only cookie
    // Middleware will handle authentication for subsequent requests
    router.push('/dashboard')
  }
}
```

## Game Owner Login Example

```typescript
// src/app/api/game-owner/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { createGameOwnerSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await prisma.gameOwner.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create HTTP-only cookie session
    await createGameOwnerSession(user.id)

    // Get user's games
    const games = await prisma.game.findMany({
      where: { gameOwnerId: user.id },
      select: {
        id: true,
        name: true,
        genre: true,
        thumbnail: true,
        metrics: true
      }
    })

    // Return success with user data (no token needed)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        gameOwnerId: user.id,
        emailVerified: true,
        lastLogin: new Date().toISOString()
      },
      games,
      gamesCount: games.length
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
```

## Platform Admin Login Example

```typescript
// src/app/api/platform-admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { createPlatformAdminSession } from '@/lib/session'

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

    // Create HTTP-only cookie session
    await createPlatformAdminSession(admin.id, admin.role)

    // Return success with admin data (no token needed)
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
    console.error('Platform admin login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
```

## Logout Route

```typescript
// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { deleteAllSessions } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    // Delete all session cookies
    await deleteAllSessions()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
```

## Key Benefits of the Migration

1. **Enhanced Security**: HTTP-only cookies prevent XSS attacks
2. **Automatic Authentication**: Middleware handles all authentication checks
3. **Simplified Client Code**: No need to manage tokens in localStorage
4. **Better UX**: Seamless redirects and route protection
5. **CSRF Protection**: SameSite cookie settings prevent CSRF attacks

## Migration Checklist

- [ ] Update login API routes to use session utilities
- [ ] Remove localStorage token management from client code
- [ ] Update logout functionality to clear cookies
- [ ] Test authentication flows
- [ ] Verify middleware is protecting routes correctly
- [ ] Update any API calls that manually include Authorization headers 