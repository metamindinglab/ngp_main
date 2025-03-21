'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Box, Gamepad2, MonitorPlay, PlaySquare, BarChart3 } from 'lucide-react';

const navItems = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Assets Manager',
    href: '/dashboard/assets',
    icon: Box,
  },
  {
    title: 'Games Manager',
    href: '/dashboard/games',
    icon: Gamepad2,
  },
  {
    title: 'Game Ads Manager',
    href: '/dashboard/game-ads',
    icon: MonitorPlay,
  },
  {
    title: 'Playlist Manager',
    href: '/dashboard/playlists',
    icon: PlaySquare,
  },
  {
    title: 'Game Ads Performance',
    href: '/dashboard/performance',
    icon: BarChart3,
  },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-800">
              MGN Asset Manager
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/dashboard')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/games"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/dashboard/games')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Games
            </Link>
            <Link
              href="/dashboard/assets"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/dashboard/assets')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Assets
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 