export interface BrandUser {
  id: string
  email: string
  name: string
  companyName?: string
  companySize: CompanySize
  jobTitle: string
  country: string
  industry?: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
  subscriptionExpiresAt?: Date | string
  isActive: boolean
  emailVerified: boolean
  lastLogin?: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface BrandUserSubscription {
  id: string
  brandUserId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  startDate: Date | string
  endDate?: Date | string
  features?: SubscriptionFeatures
  createdAt: Date | string
  updatedAt: Date | string
}

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise'

export type SubscriptionTier = 'free_trial' | 'starter' | 'professional' | 'enterprise'

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'suspended'

export interface SubscriptionFeatures {
  maxGameAds: number
  maxPlaylists: number
  analyticsLevel: 'basic' | 'advanced' | 'premium' | 'enterprise'
  support: 'email' | 'priority_email' | 'phone_email' | 'dedicated_manager'
  customTemplates: boolean
  abTesting: boolean
  whiteLabel: boolean
  customIntegrations: boolean
}

export interface SubscriptionTierDefinition {
  id: SubscriptionTier
  name: string
  price: string
  duration: string
  features: string[]
  limitations?: string[]
  popular?: boolean
  current?: boolean
  featureSet: SubscriptionFeatures
}

export interface BrandUserRegistrationData {
  email: string
  password: string
  name: string
  companyName?: string
  companySize: CompanySize
  jobTitle: string
  country: string
  industry?: string
}

export interface BrandUserLoginData {
  email: string
  password: string
}

export interface BrandUserAuthResult {
  success: boolean
  user?: BrandUser
  sessionToken?: string
  error?: string
}

export interface CompanySizeOption {
  value: CompanySize
  label: string
}

export interface CountryOption {
  value: string
  label: string
}

export interface UsageStats {
  gameAdsCreated: number
  gameAdsLimit: number
  playlistsCreated: number
  playlistsLimit: number
  analyticsLevel: string
  daysRemaining?: number
}

// Company size options
export const COMPANY_SIZE_OPTIONS: CompanySizeOption[] = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small Business (11-50 employees)' },
  { value: 'medium', label: 'Medium Business (51-200 employees)' },
  { value: 'large', label: 'Large Business (201-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
]

// Country options (major markets for gaming advertising)
export const COUNTRY_OPTIONS: CountryOption[] = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'CN', label: 'China' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'IN', label: 'India' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'RU', label: 'Russia' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'TR', label: 'Turkey' },
  { value: 'IL', label: 'Israel' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'TH', label: 'Thailand' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'PH', label: 'Philippines' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'MY', label: 'Malaysia' }
]

// Subscription tier definitions
export const SUBSCRIPTION_TIERS: SubscriptionTierDefinition[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: '$0',
    duration: '30 days',
    features: [
      'Up to 5 game ads',
      'Basic performance analytics',
      '1 active playlist',
      'Email support',
      'Standard ad templates'
    ],
    limitations: [
      'Limited to 5 ads',
      'Basic analytics only',
      'Single playlist'
    ],
    current: true,
    featureSet: {
      maxGameAds: 5,
      maxPlaylists: 1,
      analyticsLevel: 'basic',
      support: 'email',
      customTemplates: false,
      abTesting: false,
      whiteLabel: false,
      customIntegrations: false
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$99',
    duration: 'per month',
    features: [
      'Up to 25 game ads',
      'Advanced performance analytics',
      '5 active playlists',
      'Priority email support',
      'All ad templates',
      'Campaign scheduling'
    ],
    popular: false,
    featureSet: {
      maxGameAds: 25,
      maxPlaylists: 5,
      analyticsLevel: 'advanced',
      support: 'priority_email',
      customTemplates: true,
      abTesting: false,
      whiteLabel: false,
      customIntegrations: false
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$299',
    duration: 'per month',
    features: [
      'Up to 100 game ads',
      'Premium analytics & reporting',
      'Unlimited playlists',
      'Phone & email support',
      'Custom ad templates',
      'Advanced targeting',
      'A/B testing tools'
    ],
    popular: true,
    featureSet: {
      maxGameAds: 100,
      maxPlaylists: -1, // unlimited
      analyticsLevel: 'premium',
      support: 'phone_email',
      customTemplates: true,
      abTesting: true,
      whiteLabel: false,
      customIntegrations: false
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    duration: 'contact us',
    features: [
      'Unlimited game ads',
      'White-label analytics',
      'Unlimited everything',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantees',
      'Custom reporting'
    ],
    popular: false,
    featureSet: {
      maxGameAds: -1, // unlimited
      maxPlaylists: -1, // unlimited
      analyticsLevel: 'enterprise',
      support: 'dedicated_manager',
      customTemplates: true,
      abTesting: true,
      whiteLabel: true,
      customIntegrations: true
    }
  }
] 