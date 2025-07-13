import { Metadata } from 'next'
import { BrandUserAuthProvider } from '@/components/gap/auth/auth-context'
import RegisterForm from '@/components/gap/auth/register-form'

export const metadata: Metadata = {
  title: 'Create Account - Game Advertising Portal',
  description: 'Create your Game Advertising Portal account to start managing your game advertisements'
}

export default function RegisterPage() {
  return (
    <BrandUserAuthProvider>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Game Advertising Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Create, manage, and optimize your game advertisements
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </BrandUserAuthProvider>
  )
} 