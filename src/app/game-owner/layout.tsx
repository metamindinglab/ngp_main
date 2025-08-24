import { GameOwnerAuthProvider } from '@/components/game-owner/auth/auth-context'

export default function GameOwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GameOwnerAuthProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </GameOwnerAuthProvider>
  )
} 