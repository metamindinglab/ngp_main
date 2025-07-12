'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/platform-admin/auth/login-form'
import { usePlatformAdminAuth } from '@/components/platform-admin/auth/auth-context'

export default function PlatformAdminLoginPage() {
  const { user, isLoading } = usePlatformAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/platform-admin')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <LoginForm 
      onSuccess={() => router.push('/platform-admin')}
    />
  )
} 