'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/game-owner/auth/register-form'
import { useGameOwnerAuth } from '@/components/game-owner/auth/auth-context'

export default function GameOwnerRegisterPage() {
  const router = useRouter()
  const { user, isLoading } = useGameOwnerAuth()

  useEffect(() => {
    // Redirect if already logged in
    if (!isLoading && user) {
      router.push('/game-owner')
    }
  }, [user, isLoading, router])

  const handleRegisterSuccess = () => {
    router.push('/game-owner')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return <RegisterForm onSuccess={handleRegisterSuccess} />
} 