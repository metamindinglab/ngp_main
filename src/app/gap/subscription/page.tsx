import { Metadata } from 'next'
import { BrandUserAuthProvider } from '@/components/gap/auth/auth-context'
import SubscriptionTiers from '@/components/gap/subscription/subscription-tiers'

export const metadata: Metadata = {
  title: 'Subscription Plans - Game Advertising Portal',
  description: 'Choose the perfect subscription plan for your game advertising needs'
}

export default function SubscriptionPage() {
  return (
    <BrandUserAuthProvider>
      <div className="min-h-screen bg-gray-50">
        <SubscriptionTiers />
      </div>
    </BrandUserAuthProvider>
  )
} 