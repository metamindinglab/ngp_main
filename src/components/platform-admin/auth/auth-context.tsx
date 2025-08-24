'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface PlatformAdminUser {
  id: string
  email: string
  name: string
  role: string
  type: 'platform-admin'
  lastLogin?: string
}

interface AuthContextType {
  user: PlatformAdminUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function usePlatformAdminAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('usePlatformAdminAuth must be used within a PlatformAdminAuthProvider')
  }
  return context
}

export function PlatformAdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PlatformAdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      // Only access localStorage on the client side
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      const sessionToken = localStorage.getItem('platformAdminSessionToken')
      if (!sessionToken) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/platform-admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.success) {
        setUser(data.user)
      } else {
        // Clear invalid token
        localStorage.removeItem('platformAdminSessionToken')
        setUser(null)
      }
    } catch (error) {
      console.error('Platform admin auth check failed:', error)
      // Clear token on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('platformAdminSessionToken')
      }
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/platform-admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Store session token
        localStorage.setItem('platformAdminSessionToken', data.sessionToken)
        await checkAuth() // Refresh user data
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Platform admin login failed:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/platform-admin/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (data.success) {
        // Store session token
        localStorage.setItem('platformAdminSessionToken', data.sessionToken)
        await checkAuth() // Refresh user data
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Platform admin registration failed:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      // Clear session token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('platformAdminSessionToken')
      }
      setUser(null)
    } catch (error) {
      console.error('Platform admin logout failed:', error)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
} 