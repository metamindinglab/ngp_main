import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Define protected and public routes
const protectedRoutes = [
  '/dashboard',
  '/game-owner',
  '/platform-admin',
  '/gap/dashboard',
  '/gap/ads',
  '/gap/playlists',
  '/gap/performance'
]

const publicRoutes = [
  '/login',
  '/register',
  '/api/auth',
  '/',
  '/about',
  '/contact',
  '/gap/login',
  '/gap/register',
  '/gap/subscription'
]

// Routes that don't require authentication
const apiRoutes = [
  '/api/auth',
  '/api/roblox-game',
  '/api/assets',
  '/api/gap/auth'
]

interface JWTPayload {
  userId: string
  type?: string
  role?: string
  exp?: number
}

async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, images, and API routes that don't need auth
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    apiRoutes.some(route => pathname.startsWith(route))
  ) {
    return NextResponse.next()
  }

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Get session tokens from cookies
  const gameOwnerToken = request.cookies.get('gameOwnerSessionToken')?.value
  const platformAdminToken = request.cookies.get('platformAdminSessionToken')?.value
  const brandUserToken = request.cookies.get('brandUserSessionToken')?.value
  const sessionToken = request.cookies.get('session')?.value

  let user: JWTPayload | null = null

  // Try to verify tokens in order of preference
  if (sessionToken) {
    user = await verifyJWT(sessionToken)
  } else if (gameOwnerToken) {
    user = await verifyJWT(gameOwnerToken)
  } else if (platformAdminToken) {
    user = await verifyJWT(platformAdminToken)
  } else if (brandUserToken) {
    user = await verifyJWT(brandUserToken)
  }

  // Handle protected routes
  if (isProtectedRoute) {
    if (!user) {
      // Redirect to appropriate login page based on route
      let loginUrl = '/login'
      
      if (pathname.startsWith('/game-owner')) {
        loginUrl = '/game-owner/login'
      } else if (pathname.startsWith('/platform-admin')) {
        loginUrl = '/platform-admin/login'
      } else if (pathname.startsWith('/gap')) {
        loginUrl = '/gap/login'
      }

      // Preserve the original URL for redirect after login
      const redirectUrl = new URL(loginUrl, request.url)
      redirectUrl.searchParams.set('from', pathname)
      
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user has access to the specific protected area
    if (pathname.startsWith('/platform-admin') && user.type !== 'platform-admin') {
      return NextResponse.redirect(new URL('/platform-admin/login', request.url))
    }

    if (pathname.startsWith('/gap') && user.type !== 'brand-user') {
      return NextResponse.redirect(new URL('/gap/login', request.url))
    }

    // Allow access to protected route
    return NextResponse.next()
  }

  // Handle public routes - redirect authenticated users to their dashboard
  if (isPublicRoute && user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    let dashboardUrl = '/dashboard'
    
    if (user.type === 'platform-admin') {
      dashboardUrl = '/platform-admin'
    } else if (user.type === 'brand-user') {
      dashboardUrl = '/gap/dashboard'
    } else {
      dashboardUrl = '/game-owner'
    }

    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  // Handle login pages - redirect authenticated users to their dashboard
  if ((pathname.includes('/login') || pathname.includes('/register')) && user) {
    let dashboardUrl = '/dashboard'
    
    if (user.type === 'platform-admin') {
      dashboardUrl = '/platform-admin'
    } else if (user.type === 'brand-user') {
      dashboardUrl = '/gap/dashboard'
    } else {
      dashboardUrl = '/game-owner'
    }

    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that don't need auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|api/roblox-game|api/assets|_next/static|_next/image|favicon.ico|public|.*\\..*).*)',
  ],
} 