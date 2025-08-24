'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, Crown } from 'lucide-react'

interface SubscriptionTier {
  id: string
  name: string
  price: string
  period: string
  description: string
  features: string[]
  limitations: string[]
  isPopular?: boolean
  icon: React.ReactNode
  buttonText: string
  buttonVariant: 'default' | 'outline' | 'secondary'
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: '$0',
    period: 'month',
    description: 'Perfect for getting started with game advertising',
    features: [
      'Up to 3 game ads',
      'Basic analytics dashboard',
      'Standard ad placements',
      'Email support',
      'Basic playlist management',
      '1 GB asset storage'
    ],
    limitations: [
      'Limited to 1,000 ad impressions/month',
      'Basic targeting options',
      'Standard reporting frequency'
    ],
    icon: <Star className="h-6 w-6" />,
    buttonText: 'Current Plan',
    buttonVariant: 'outline'
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: 'month',
    description: 'Great for small businesses and indie developers',
    features: [
      'Up to 10 game ads',
      'Advanced analytics dashboard',
      'Priority ad placements',
      'Email & chat support',
      'Advanced playlist management',
      '5 GB asset storage',
      'Custom ad scheduling',
      'Basic A/B testing'
    ],
    limitations: [
      'Limited to 10,000 ad impressions/month',
      'Standard targeting options'
    ],
    icon: <Zap className="h-6 w-6" />,
    buttonText: 'Upgrade to Starter',
    buttonVariant: 'default'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$99',
    period: 'month',
    description: 'Ideal for growing businesses and marketing teams',
    features: [
      'Up to 50 game ads',
      'Premium analytics dashboard',
      'Premium ad placements',
      'Priority support',
      'Advanced playlist automation',
      '25 GB asset storage',
      'Advanced A/B testing',
      'Custom audience targeting',
      'Performance optimization tools',
      'API access',
      'White-label reporting'
    ],
    limitations: [
      'Limited to 100,000 ad impressions/month'
    ],
    isPopular: true,
    icon: <Crown className="h-6 w-6" />,
    buttonText: 'Upgrade to Professional',
    buttonVariant: 'default'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For large organizations with advanced needs',
    features: [
      'Unlimited game ads',
      'Enterprise analytics suite',
      'Premium ad placements',
      'Dedicated account manager',
      'Enterprise playlist automation',
      'Unlimited asset storage',
      'Advanced A/B testing suite',
      'Custom audience targeting',
      'Performance optimization tools',
      'Full API access',
      'Custom integrations',
      'White-label solution',
      'SLA guarantee',
      'Custom reporting',
      'Team collaboration tools'
    ],
    limitations: [],
    icon: <Crown className="h-6 w-6 text-purple-600" />,
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary'
  }
]

export default function SubscriptionTiers() {
  const [currentTier] = useState('free_trial')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Choose Your Subscription Plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the perfect plan for your game advertising needs. All plans include our core features 
          with different limits and advanced capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative ${tier.isPopular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
          >
            {tier.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {tier.icon}
              </div>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">{tier.price}</span>
                {tier.period !== 'contact us' && (
                  <span className="text-gray-500">/{tier.period}</span>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">Included Features:</h4>
                  <ul className="space-y-1">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {tier.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-orange-600">Limitations:</h4>
                    <ul className="space-y-1">
                      {tier.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          <span className="text-sm text-gray-600">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Button 
                  className="w-full mt-6" 
                  variant={tier.buttonVariant}
                  disabled={tier.id === currentTier}
                >
                  {tier.id === currentTier ? 'Current Plan' : tier.buttonText}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Need Help Choosing?</CardTitle>
            <CardDescription>
              Our team is here to help you find the perfect plan for your business needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">
                Schedule a Demo
              </Button>
              <Button variant="outline">
                Contact Sales
              </Button>
              <Button variant="outline">
                View Feature Comparison
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>All plans include a 14-day free trial. No credit card required.</p>
        <p>Prices shown are in USD. Enterprise pricing available upon request.</p>
      </div>
    </div>
  )
} 