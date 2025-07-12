"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AssetsClient } from "@/components/assets/assets-client";
import { usePlatformAdminAuth } from '@/components/platform-admin/auth/auth-context';
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function PlatformAdminAssetsPage() {
  const { user, isLoading: authLoading } = usePlatformAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/platform-admin/login');
    }
  }, [user, authLoading, router]);

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
                onClick={() => router.push('/platform-admin')}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Back to Platform Admin</span>
              </Button>
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-slate-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Assets Manager</h1>
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
        <AssetsClient />
      </div>
    </div>
  );
} 