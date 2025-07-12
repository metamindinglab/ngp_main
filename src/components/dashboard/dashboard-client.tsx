'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { MMLLogo } from "@/components/ui/mml-logo";
import { PlaySquare, ListVideo, BarChart3, Users, Shield } from "lucide-react";

export function DashboardClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center space-y-6">
          <Link href="/" className="self-start transform hover:scale-105 transition-transform">
            <MMLLogo />
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
            Welcome to New Gen Pulse
          </h1>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
          {/* Game Ads Manager */}
          <Link href="/dashboard/game-ads" className="group perspective">
            <Card className="border-2 border-transparent bg-white dark:bg-slate-900 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-blue-500/20 group-hover:rotate-2 hover:border-blue-500/20">
              <CardHeader className="pb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="flex items-center gap-3 relative">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50 transform group-hover:rotate-12 transition-transform">
                    <PlaySquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">Game Ads Manager</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                  Create and manage game advertisements
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {/* Playlist Manager */}
          <Link href="/dashboard/playlists" className="group perspective">
            <Card className="border-2 border-transparent bg-white dark:bg-slate-900 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-emerald-500/20 group-hover:-rotate-2 hover:border-emerald-500/20">
              <CardHeader className="pb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="flex items-center gap-3 relative">
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 transform group-hover:-rotate-12 transition-transform">
                    <ListVideo className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-emerald-600 transition-colors">Playlist Manager</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                  Manage game playlists and rotations
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {/* Game Ads Performance */}
          <Link href="/dashboard/game-ads/performance" className="group perspective">
            <Card className="border-2 border-transparent bg-white dark:bg-slate-900 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-rose-500/20 group-hover:rotate-2 hover:border-rose-500/20">
              <CardHeader className="pb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-red-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="flex items-center gap-3 relative">
                  <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/50 transform group-hover:rotate-12 transition-transform">
                    <BarChart3 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-rose-600 transition-colors">Game Ads Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-rose-500 transition-colors">
                  View performance metrics for game ads
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {/* Platform Administration Portal */}
          <Link href="/platform-admin" className="group perspective">
            <Card className="border-2 border-transparent bg-white dark:bg-slate-900 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-slate-500/20 group-hover:rotate-2 hover:border-slate-500/20">
              <CardHeader className="pb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="flex items-center gap-3 relative">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 transform group-hover:rotate-12 transition-transform">
                    <Shield className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-slate-600 transition-colors">Platform Administration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-500 transition-colors">
                  Manage platform games and assets (Admin Only)
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {/* Game Owner Portal */}
          <Link href="/game-owner" className="group perspective">
            <Card className="border-2 border-transparent bg-white dark:bg-slate-900 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-amber-500/20 group-hover:-rotate-2 hover:border-amber-500/20">
              <CardHeader className="pb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="flex items-center gap-3 relative">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/50 transform group-hover:-rotate-12 transition-transform">
                    <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-amber-600 transition-colors">Game Owner Portal</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-amber-500 transition-colors">
                  Access the game owner management dashboard
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
} 