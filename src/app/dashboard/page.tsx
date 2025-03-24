import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gamepad2, Box, MonitorPlay, PlaySquare, BarChart3 } from 'lucide-react'

const modules = [
  {
    title: 'Games Manager',
    description: 'Manage your Roblox games and their configurations',
    href: '/dashboard/games',
    icon: Gamepad2,
  },
  {
    title: 'Assets Manager',
    description: 'Upload and manage game assets',
    href: '/dashboard/assets',
    icon: Box,
  },
  {
    title: 'Game Ads Manager',
    description: 'Create and manage game advertisements',
    href: '/dashboard/game-ads',
    icon: MonitorPlay,
  },
  {
    title: 'Playlist Manager',
    description: 'Manage game playlists and rotations',
    href: '/dashboard/playlists',
    icon: PlaySquare,
  },
  {
    title: 'Game Ads Performance',
    description: 'View performance metrics for game ads',
    href: '/dashboard/performance',
    icon: BarChart3,
  },
]

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome to MGN Asset Manager</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link key={module.href} href={module.href}>
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-6 w-6" />
                    <CardTitle>{module.title}</CardTitle>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Click to manage {module.title.toLowerCase()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 