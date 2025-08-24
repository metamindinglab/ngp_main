import { PlatformAdminAuthProvider } from '@/components/platform-admin/auth/auth-context'

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PlatformAdminAuthProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </PlatformAdminAuthProvider>
  )
} 