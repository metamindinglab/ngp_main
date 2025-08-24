'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { usePlatformAdminAuth } from '@/components/platform-admin/auth/auth-context'
import { Shield, Gamepad2, Upload, ArrowLeft, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'

export function PlatformAdminDashboard() {
  const { user, logout, isLoading } = usePlatformAdminAuth()
  const router = useRouter()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showBackToMainDialog, setShowBackToMainDialog] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/platform-admin/login')
    }
  }, [user, isLoading, router])

  const handleLogoutConfirm = async () => {
    await logout()
    setShowLogoutDialog(false)
    router.push('/dashboard') // Take user back to main dashboard after logout
  }

  const handleBackToMainConfirm = () => {
    setShowBackToMainDialog(false)
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="flex items-center text-gray-600 hover:text-slate-600 transition-colors"
                onClick={() => setShowBackToMainDialog(true)}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Back to Main Dashboard</span>
              </Button>
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-slate-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Platform Administration Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutDialog(true)}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Platform Management</h2>
          <p className="text-gray-600">Manage core platform data including games and assets</p>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Games Manager */}
          <Link href="/platform-admin/games" className="group perspective">
            <Card className="border-2 border-transparent bg-white transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-slate-500/20 group-hover:rotate-2 hover:border-slate-500/20">
              <CardHeader className="pb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="flex items-center gap-3 relative">
                  <div className="p-3 rounded-xl bg-slate-100 transform group-hover:rotate-12 transition-transform">
                    <Gamepad2 className="w-6 h-6 text-slate-600" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-slate-600 transition-colors">Games Manager</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600 group-hover:text-slate-500 transition-colors">
                  Manage all platform games, configurations, and metadata
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {/* Assets Manager */}
          <Link href="/platform-admin/assets" className="group perspective">
            <Card className="border-2 border-transparent bg-white transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-slate-500/20 group-hover:-rotate-2 hover:border-slate-500/20">
              <CardHeader className="pb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="flex items-center gap-3 relative">
                  <div className="p-3 rounded-xl bg-slate-100 transform group-hover:-rotate-12 transition-transform">
                    <Upload className="w-6 h-6 text-slate-600" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-slate-600 transition-colors">Assets Manager</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600 group-hover:text-slate-500 transition-colors">
                  Upload and manage platform assets and media files
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {/* Platform Settings */}
          <Link href="/platform-admin/settings" className="group perspective">
            <Card className="border-2 border-transparent bg-white transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-slate-500/20 group-hover:rotate-2 hover:border-slate-500/20">
              <CardHeader className="pb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="flex items-center gap-3 relative">
                  <div className="p-3 rounded-xl bg-slate-100 transform group-hover:rotate-12 transition-transform">
                    <Settings className="w-6 h-6 text-slate-600" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-slate-600 transition-colors">Platform Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600 group-hover:text-slate-500 transition-colors">
                  Configure platform settings and administrative options
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout from the Platform Administration Portal? You will be redirected to the main dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Back to Main Dashboard Confirmation Dialog */}
      <AlertDialog open={showBackToMainDialog} onOpenChange={setShowBackToMainDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Platform Administration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave the Platform Administration Portal and return to the main dashboard?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBackToMainConfirm}>
              Go to Main Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 