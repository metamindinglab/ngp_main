'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface GameOwnerUser {
  id: string
  gameOwnerId: string  // Unique game owner identifier for game mapping
  email: string
  name: string
  country: string
  discordId?: string
  lastLogin?: string
  emailVerified: boolean
}

export interface GameOwnerGame {
  id: string
  name: string
  genre: string
  thumbnail: string
  metrics: {
    dau: number
    mau: number
    day1Retention: number
  }
}

interface AuthContextType {
  user: GameOwnerUser | null
  games: GameOwnerGame[]
  gamesCount: number
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string, country: string, discordId?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useGameOwnerAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useGameOwnerAuth must be used within a GameOwnerAuthProvider')
  }
  return context
}

export function GameOwnerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GameOwnerUser | null>(null)
  const [games, setGames] = useState<GameOwnerGame[]>([])
  const [gamesCount, setGamesCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      // Only access localStorage on the client side
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      if (!sessionToken) {
        setUser(null)
        setGames([])
        setGamesCount(0)
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/game-owner/auth/me', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setGames(data.games || [])
        setGamesCount(data.gamesCount || 0)
      } else {
        // Clear invalid token
        localStorage.removeItem('gameOwnerSessionToken')
        setUser(null)
        setGames([])
        setGamesCount(0)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear token on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gameOwnerSessionToken')
      }
      setUser(null)
      setGames([])
      setGamesCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/game-owner/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Store session token
        localStorage.setItem('gameOwnerSessionToken', data.sessionToken)
        await checkAuth() // Refresh user data
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    country: string,
    discordId?: string
  ) => {
    try {
      const response = await fetch('/api/game-owner/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, country, discordId }),
      })

      const data = await response.json()

      if (data.success) {
        // Store session token
        localStorage.setItem('gameOwnerSessionToken', data.sessionToken)
        await checkAuth() // Refresh user data
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Registration failed:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('gameOwnerSessionToken')
      await fetch('/api/game-owner/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      // Clear session token
      localStorage.removeItem('gameOwnerSessionToken')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      setGames([])
      setGamesCount(0)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const value = {
    user,
    games,
    gamesCount,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 