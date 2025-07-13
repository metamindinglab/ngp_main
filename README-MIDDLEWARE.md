# Next.js JWT Authentication Middleware

## Overview

This implementation provides a comprehensive JWT-based authentication middleware for Next.js that automatically protects routes and manages user sessions using HTTP-only cookies.

## Files Created

### 1. `middleware.ts` (Root Level)
The main middleware file that runs on every request to check authentication and redirect users appropriately.

**Key Features:**
- Checks for JWT tokens in cookies (`gameOwnerSessionToken`, `platformAdminSessionToken`, `session`)
- Protects specific routes (`/dashboard/*`, `/game-owner/*`, `/platform-admin/*`)
- Redirects unauthenticated users to appropriate login pages
- Preserves original URL for post-login redirects
- Supports multiple user types with role-based access control

### 2. `src/lib/session.ts`
Session management utilities for server-side operations.

**Key Features:**
- Enhanced JWT functions using `jose` library for better security
- HTTP-only cookie management
- Session creation, validation, and deletion
- Support for multiple authentication types
- Backward compatibility with existing JWT patterns

### 3. `docs/middleware-authentication.md`
Comprehensive documentation explaining how to use the middleware.

### 4. `docs/migration-example.md`
Step-by-step migration guide from localStorage to HTTP-only cookies.

## Installation

The middleware is ready to use. Make sure you have the required dependencies:

```bash
npm install jose jsonwebtoken
```

## Environment Variables

Ensure you have the JWT secret configured:

```env
JWT_SECRET=your-super-secret-jwt-key-here
```

## How It Works

### 1. Route Protection
The middleware automatically protects these routes:
- `/dashboard/*` - Main dashboard
- `/game-owner/*` - Game owner portal  
- `/platform-admin/*` - Platform administration

### 2. Authentication Flow
1. User visits a protected route
2. Middleware checks for JWT tokens in cookies
3. If valid token exists, user proceeds
4. If no token or invalid token, user is redirected to login
5. After successful login, user is redirected back to original destination

### 3. Cookie Management
- **HTTP-only cookies**: Prevent XSS attacks
- **Secure cookies**: Only sent over HTTPS in production
- **SameSite protection**: Prevents CSRF attacks
- **7-day expiration**: Automatic token expiration

## Usage Examples

### Setting Up Login Routes

```typescript
// Example login route
import { createGameOwnerSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  // Validate credentials...
  const user = await validateUser(email, password)
  
  if (user) {
    // Create HTTP-only cookie session
    await createGameOwnerSession(user.id)
    
    return NextResponse.json({ success: true, user })
  }
  
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
```

### Reading Session Data

```typescript
// In a server component or API route
import { getGameOwnerSession } from '@/lib/session'

export async function GET() {
  const session = await getGameOwnerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use session.userId for database operations
  return NextResponse.json({ userId: session.userId })
}
```

### Logout Functionality

```typescript
import { deleteAllSessions } from '@/lib/session'

export async function POST() {
  await deleteAllSessions()
  return NextResponse.json({ success: true })
}
```

## Security Features

- **JWT token validation**: Ensures tokens are valid and not expired
- **Role-based access control**: Different user types can only access their areas
- **Automatic redirects**: Seamless user experience with proper redirects
- **CSRF protection**: SameSite cookie settings prevent cross-site attacks
- **XSS protection**: HTTP-only cookies prevent JavaScript access

## Migration from localStorage

If you're currently using localStorage for session management:

1. Update login routes to use `createGameOwnerSession()` or `createPlatformAdminSession()`
2. Remove localStorage token management from client-side code
3. Update API calls to rely on automatic cookie inclusion
4. Test authentication flows thoroughly

## Configuration

The middleware configuration can be adjusted in `middleware.ts`:

```typescript
// Add or remove protected routes
const protectedRoutes = [
  '/dashboard',
  '/game-owner',
  '/platform-admin',
  '/your-new-protected-route'  // Add custom routes here
]

// Add or remove public routes
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth',
  '/',
  '/about',
  '/contact'
]
```

## Testing

The middleware has been tested with:
- ✅ JWT token creation and validation
- ✅ Route matching logic
- ✅ Cookie management
- ✅ Build compilation
- ✅ Multiple user types

## Troubleshooting

### Common Issues

1. **Middleware not running**: Check route matcher configuration
2. **Cookies not set**: Ensure you're using server-side session functions
3. **Redirect loops**: Verify login pages are in public routes
4. **Token validation errors**: Check JWT_SECRET environment variable

### Debug Mode

Set `NODE_ENV=development` to see detailed JWT verification logs in the console.

## Next Steps

1. Test the middleware in your development environment
2. Update existing login routes to use the new session utilities
3. Remove localStorage-based authentication code
4. Deploy and test in production environment
5. Monitor authentication flows and adjust as needed

The middleware provides a robust, secure foundation for authentication in your Next.js application while maintaining backward compatibility with existing patterns. 