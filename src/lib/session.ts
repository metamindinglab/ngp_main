import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { sign, verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const encodedKey = new TextEncoder().encode(JWT_SECRET)

export interface SessionPayload {
  userId: string
  type?: string
  role?: string
  expiresAt?: Date
  [key: string]: any // Allow additional properties for jose compatibility
}

// Enhanced JWT functions using jose library for better security
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch (error) {
    console.log('Failed to verify session:', error)
    return null
  }
}

// Legacy JWT functions for compatibility with existing code
export function createJWT(payload: SessionPayload): string {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyJWT(token: string): SessionPayload | null {
  try {
    const decoded = verify(token, JWT_SECRET) as SessionPayload
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Session management functions
export async function createSession(userId: string, type: string = 'user', role: string = 'user'): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const session = await encrypt({ userId, type, role, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function createGameOwnerSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const session = createJWT({ userId, type: 'game-owner' })
  const cookieStore = await cookies()

  cookieStore.set('gameOwnerSessionToken', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function createPlatformAdminSession(userId: string, role: string = 'admin'): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const session = createJWT({ userId, type: 'platform-admin', role })
  const cookieStore = await cookies()

  cookieStore.set('platformAdminSessionToken', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  
  if (!session) return null
  
  return await decrypt(session)
}

export async function getGameOwnerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('gameOwnerSessionToken')?.value
  
  if (!session) return null
  
  return verifyJWT(session)
}

export async function getPlatformAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('platformAdminSessionToken')?.value
  
  if (!session) return null
  
  return verifyJWT(session)
}

export async function updateSession(): Promise<void> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!session || !payload) {
    return
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const newSession = await encrypt({ ...payload, expiresAt: expires })

  cookieStore.set('session', newSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function deleteGameOwnerSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('gameOwnerSessionToken')
}

export async function deletePlatformAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('platformAdminSessionToken')
}

export async function deleteAllSessions(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  cookieStore.delete('gameOwnerSessionToken')
  cookieStore.delete('platformAdminSessionToken')
} 