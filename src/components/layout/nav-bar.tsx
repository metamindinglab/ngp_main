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

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto">
        <div className="flex items-center space-x-4 h-14">
          <Link
            href="/dashboard"
            className="text-lg font-bold text-gray-900 mr-8"
          >
            New Gen Pulse
          </Link>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
} 