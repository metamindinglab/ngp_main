"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformAdminAuth } from '@/components/platform-admin/auth/auth-context';
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserManagement } from '@/components/platform-admin/settings/user-management';

export default function PlatformAdminSettingsPage() {
  const { user, isLoading: authLoading } = usePlatformAdminAuth();
  const router = useRouter();
  const [showBackToMainDialog, setShowBackToMainDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/platform-admin/login');
    }
  }, [user, authLoading, router]);

  const handleBackToMainConfirm = () => {
    setShowBackToMainDialog(false);
    router.push('/platform-admin');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
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
                <span className="text-sm">Back to Platform Admin</span>
              </Button>
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-slate-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Platform Settings</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Platform Admin: {user.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Platform Administration Settings</h2>
          <p className="text-gray-600">Manage platform administrators and system configuration</p>
        </div>

        {/* User Management Section */}
        <UserManagement />
      </div>

      {/* Back to Platform Admin Confirmation Dialog */}
      <AlertDialog open={showBackToMainDialog} onOpenChange={setShowBackToMainDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave the settings page and return to the Platform Administration Portal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBackToMainConfirm}>
              Go Back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 