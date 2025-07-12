"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GamesClient } from "@/components/games/games-client";
import { Game } from "@/types/game";
import { useToast } from "@/components/ui/use-toast";
import { usePlatformAdminAuth } from '@/components/platform-admin/auth/auth-context';
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PlatformAdminGamesPage() {
  const { user, isLoading: authLoading } = usePlatformAdminAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/platform-admin/login');
    }
  }, [user, authLoading, router]);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast({
        title: "Error",
        description: "Failed to load games",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGames();
    }
  }, [user, toast]);

  if (authLoading || loading) {
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
                <h1 className="text-xl font-semibold text-gray-900">Games Manager</h1>
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
        <GamesClient initialGames={games} onGameUpdated={fetchGames} />
      </div>
    </div>
  );
}