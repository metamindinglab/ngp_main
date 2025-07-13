# Next.js Middleware Authentication

This document explains how to use the JWT-based authentication middleware in your Next.js application.

## Overview

The middleware provides automatic authentication checks for protected routes and redirects unauthenticated users to the appropriate login page. It supports multiple authentication types:

- **Game Owner Authentication**: For game developers and owners
- **Platform Admin Authentication**: For platform administrators
- **General Session Authentication**: For other authenticated users

## How It Works

The middleware runs on every request and:

1. **Checks for JWT tokens** in cookies (`gameOwnerSessionToken`, `platformAdminSessionToken`, `session`)
2. **Verifies token validity** using the JWT secret
3. **Protects routes** by redirecting unauthenticated users to login pages
4. **Redirects authenticated users** away from login pages to their dashboards

## Protected Routes

The following routes require authentication:

- `/dashboard/*` - Main dashboard
- `/game-owner/*` - Game owner portal
- `/platform-admin/*` - Platform administration portal

## Public Routes

These routes are accessible without authentication:

- `/login` - Login page
- `/register` - Registration page
- `/api/auth/*` - Authentication API routes
- `/` - Home page
- `/about` - About page
- `/contact` - Contact page

## Cookie-Based Session Management

### Setting Session Cookies

Use the session utility functions to set HTTP-only, secure cookies:

```typescript
import { createGameOwnerSession, createPlatformAdminSession } from '@/lib/session'

// For game owners
await createGameOwnerSession(userId)

// For platform admins
await createPlatformAdminSession(userId, 'admin')
```

### Reading Session Data

```typescript
import { getGameOwnerSession, getPlatformAdminSession } from '@/lib/session'

// Get current game owner session
const gameOwnerSession = await getGameOwnerSession()

// Get current platform admin session
const platformAdminSession = await getPlatformAdminSession()
```

### Deleting Sessions

```typescript
import { deleteGameOwnerSession, deletePlatformAdminSession, deleteAllSessions } from '@/lib/session'

// Delete specific session
await deleteGameOwnerSession()
await deletePlatformAdminSession()

// Delete all sessions
await deleteAllSessions()
```

## Migration from localStorage

If you're currently using localStorage for session tokens, you can migrate to cookies:

### Before (localStorage)
```typescript
// Setting token
localStorage.setItem('gameOwnerSessionToken', token)

// Getting token
const token = localStorage.getItem('gameOwnerSessionToken')
```

### After (HTTP-only cookies)
```typescript
// Setting token (server-side)
await createGameOwnerSession(userId)

// Getting session data (server-side)
const session = await getGameOwnerSession()
```

## API Route Authentication

For API routes that need authentication, the middleware automatically handles:

- **Protected API routes**: Routes under `/api/game-owner/*` and `/api/platform-admin/*`
- **Public API routes**: Routes under `/api/auth/*`, `/api/roblox-game/*`, `/api/assets/*`

## Configuration

### Environment Variables

Make sure to set your JWT secret:

```env
JWT_SECRET=your-super-secret-jwt-key
```

### Middleware Configuration

The middleware is configured in `middleware.ts` with specific route matchers:

```typescript
export const config = {
  matcher: [
    '/((?!api/auth|api/roblox-game|api/assets|_next/static|_next/image|favicon.ico|public|.*\\..*).*)',
  ],
}
```

## Security Features

- **HTTP-only cookies**: Prevents XSS attacks by making cookies inaccessible to JavaScript
- **Secure cookies**: Ensures cookies are only sent over HTTPS in production
- **SameSite protection**: Prevents CSRF attacks
- **Token expiration**: Automatic token expiration after 7 days
- **Route-based access control**: Different user types can only access their designated areas

## Error Handling

The middleware handles various error scenarios:

- **Invalid tokens**: Redirects to login page
- **Expired tokens**: Redirects to login page
- **Missing tokens**: Redirects to login page
- **Wrong user type**: Redirects to appropriate login page

## Examples

### Protecting a Page Component

```typescript
// The middleware automatically protects this page
export default function GameOwnerDashboard() {
  return <div>Protected Game Owner Content</div>
}
```

### Server Action with Session

```typescript
import { getGameOwnerSession } from '@/lib/session'

export async function serverAction() {
  const session = await getGameOwnerSession()
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  // Use session.userId for database operations
  console.log('User ID:', session.userId)
}
```

### API Route with Session

```typescript
import { getGameOwnerSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getGameOwnerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Handle authenticated request
  return NextResponse.json({ userId: session.userId })
}
```

## Troubleshooting

### Common Issues

1. **Middleware not running**: Check that your route matches the middleware configuration
2. **Token not found**: Ensure cookies are being set correctly server-side
3. **Redirect loops**: Verify that login pages are in the public routes list
4. **CORS issues**: Make sure API routes are properly excluded from middleware

### Debug Mode

Enable debug logging by setting the environment variable:

```env
NODE_ENV=development
```

This will show JWT verification errors in the console. 