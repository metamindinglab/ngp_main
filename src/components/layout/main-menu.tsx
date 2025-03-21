'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Box,
  Gamepad2,
  Megaphone,
  PlaySquare,
  BarChart2,
} from 'lucide-react';

interface MenuItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  {
    title: 'Assets Manager',
    description: 'Manage all your assets in one place',
    href: '/dashboard/assets',
    icon: <Box className="h-6 w-6" />,
  },
  {
    title: 'Games Manager',
    description: 'Manage your games and their settings',
    href: '/dashboard/games',
    icon: <Gamepad2 className="h-6 w-6" />,
  },
  {
    title: 'Game Ads Manager',
    description: 'Create and manage game advertisements',
    href: '/dashboard/game-ads',
    icon: <Megaphone className="h-6 w-6" />,
  },
  {
    title: 'Playlist Manager',
    description: 'Organize your game playlists',
    href: '/dashboard/playlists',
    icon: <PlaySquare className="h-6 w-6" />,
  },
  {
    title: 'Game Ads Performance',
    description: 'Track your game ads performance',
    href: '/dashboard/game-ads-performance',
    icon: <BarChart2 className="h-6 w-6" />,
  },
];

export default function MainMenu() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">New Gen Pulse</h1>
      </div>
      {menuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-start space-x-4 rounded-lg p-3 transition-colors hover:bg-gray-200',
            pathname === item.href && 'bg-gray-200'
          )}
        >
          <div className="mt-1 text-gray-500">{item.icon}</div>
          <div>
            <div className="font-medium">{item.title}</div>
            <div className="text-sm text-gray-500">{item.description}</div>
          </div>
        </Link>
      ))}
    </nav>
  );
} 