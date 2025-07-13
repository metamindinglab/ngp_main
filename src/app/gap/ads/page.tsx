import { Metadata } from 'next'
import { BrandUserAuthProvider } from '@/components/gap/auth/auth-context'
import { ProtectedRoute } from '@/components/gap/auth/protected-route'
import { GAPLayout } from '@/components/gap/layout/gap-layout'
import { GAPAdsManager } from '@/components/gap/ads/ads-manager'

export const metadata: Metadata = {
  title: 'Game Ads Manager - Game Advertising Portal',
  description: 'Create, manage, and optimize your game advertisements'
}

export default function GAPAdsPage() {
  return (
    <BrandUserAuthProvider>
      <ProtectedRoute>
        <GAPLayout>
          <GAPAdsManager />
        </GAPLayout>
      </ProtectedRoute>
    </BrandUserAuthProvider>
  )
} 