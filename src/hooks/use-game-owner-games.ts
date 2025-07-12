import { useState, useEffect } from 'react'
import { Game } from '@/types/game'

export function useGameOwnerGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // Only run on client side
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }

        const sessionToken = localStorage.getItem('gameOwnerSessionToken')
        if (!sessionToken) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const response = await fetch('/api/game-owner/games', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          }
        })
        const data = await response.json()

        if (data.success) {
          setGames(data.games)
          setError(null)
        } else {
          // Handle authentication errors
          if (response.status === 401) {
            localStorage.removeItem('gameOwnerSessionToken')
            setError('Authentication expired. Please log in again.')
          } else {
            throw new Error(data.error || 'Failed to fetch games')
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch games')
        setGames([])
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  return { games, loading, error }
} 