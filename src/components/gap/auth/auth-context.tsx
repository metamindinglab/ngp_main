'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { BrandUser, BrandUserAuthResult, BrandUserRegistrationData, BrandUserLoginData } from '@/types/brand-user'

interface BrandUserAuthContextType {
  user: BrandUser | null
  isLoading: boolean
  login: (data: BrandUserLoginData) => Promise<BrandUserAuthResult>
  register: (data: BrandUserRegistrationData) => Promise<BrandUserAuthResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const BrandUserAuthContext = createContext<BrandUserAuthContextType | undefined>(undefined)

export function useBrandUserAuth() {
  const context = useContext(BrandUserAuthContext)
  if (context === undefined) {
    throw new Error('useBrandUserAuth must be used within a BrandUserAuthProvider')
  }
  return context
}

export function BrandUserAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BrandUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Helper function to set HTTP-only cookie
  const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`
  }

  // Helper function to delete cookie
  const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  }

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/gap/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Brand user auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (data: BrandUserLoginData): Promise<BrandUserAuthResult> => {
    try {
      const response = await fetch('/api/gap/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        // Cookie is now set by the server, just refresh user data
        await checkAuth() // Refresh user data
        return { success: true, user: result.user }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Brand user login failed:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  const register = async (data: BrandUserRegistrationData): Promise<BrandUserAuthResult> => {
    try {
      const response = await fetch('/api/gap/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        // Set session token as cookie
        setCookie('brandUserSessionToken', result.sessionToken)
        await checkAuth() // Refresh user data
        return { success: true, user: result.user }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Brand user registration failed:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      // Delete session cookie
      deleteCookie('brandUserSessionToken')
      setUser(null)
    } catch (error) {
      console.error('Brand user logout failed:', error)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return (
    <BrandUserAuthContext.Provider value={value}>
      {children}
    </BrandUserAuthContext.Provider>
  )
} 