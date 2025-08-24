import { Metadata } from 'next'
import { BrandUserAuthProvider } from '@/components/gap/auth/auth-context'
import { ProtectedRoute } from '@/components/gap/auth/protected-route'
import { GAPLayout } from '@/components/gap/layout/gap-layout'
import { GAPPlaylistManager } from '@/components/gap/playlists/gap-playlist-manager'

export const metadata: Metadata = {
  title: 'Playlist Manager - Game Advertising Portal',
  description: 'Create and manage playlists for your game advertisements'
}

export default function GAPPlaylistsPage() {
  return (
    <BrandUserAuthProvider>
      <ProtectedRoute>
        <GAPLayout>
          <GAPPlaylistManager />
        </GAPLayout>
      </ProtectedRoute>
    </BrandUserAuthProvider>
  )
} 