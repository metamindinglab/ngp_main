import { Metadata } from 'next'
import { BrandUserAuthProvider } from '@/components/gap/auth/auth-context'
import { ProtectedRoute } from '@/components/gap/auth/protected-route'
import { GAPLayout } from '@/components/gap/layout/gap-layout'
import { GAPPerformanceDashboard } from '@/components/gap/performance/gap-performance-dashboard'

export const metadata: Metadata = {
  title: 'Performance Dashboard - Game Advertising Portal',
  description: 'Track and analyze your game advertisement performance metrics'
}

export default function GAPPerformancePage() {
  return (
    <BrandUserAuthProvider>
      <ProtectedRoute>
        <GAPLayout>
          <GAPPerformanceDashboard />
        </GAPLayout>
      </ProtectedRoute>
    </BrandUserAuthProvider>
  )
} 