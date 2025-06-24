import { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - MML Roblox Asset Management',
  description: 'Manage your Roblox assets, games, and advertisements',
}

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {children}
      </main>
    </div>
  )
}
