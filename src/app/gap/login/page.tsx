import { Metadata } from 'next'
import { BrandUserAuthProvider } from '@/components/gap/auth/auth-context'
import LoginForm from '@/components/gap/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In - Game Advertising Portal',
  description: 'Sign in to your Game Advertising Portal account'
}

export default function LoginPage() {
  return (
    <BrandUserAuthProvider>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Game Advertising Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </BrandUserAuthProvider>
  )
} 