'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { Edit2, Trash2, Users, Calendar, BarChart } from "lucide-react";

interface Game {
  id: string;
  name: string;
  description: string;
  genre: string;
  metrics: {
    dau: number;
    mau: number;
    day1Retention: number;
  };
  owner: {
    name: string;
    country: string;
  };
  thumbnail: string;
}

interface GamesClientProps {
  initialGames: Game[];
}

export function GamesClient({ initialGames }: GamesClientProps) {
  const [games] = useState(initialGames);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || game.genre.toLowerCase() === selectedGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header with Logo */}
        <div className="flex flex-col space-y-6">
          <Link href="/" className="self-start transform hover:scale-105 transition-transform">
            <Image
              src="/MML-logo.png"
              alt="MML Logo"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
          </Link>
          
          {/* Search and Filter Bar */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 flex items-center gap-4">
              <Input
                placeholder="Search games..."
                className="max-w-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  <SelectItem value="role-playing">Role-Playing</SelectItem>
                  <SelectItem value="fighting">Fighting</SelectItem>
                  <SelectItem value="fps">First-Person Shooter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
              Add New Game
            </Button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game: Game) => (
            <div key={game.id} className="group perspective">
              <Card className="h-full border-2 border-transparent bg-white dark:bg-slate-900 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-indigo-500/20 group-hover:rotate-2 hover:border-indigo-500/20">
                <CardHeader className="pb-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                    <Image
                      src={game.thumbnail || '/games/default.png'}
                      alt={game.name}
                      fill
                      className="object-cover transform group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                      {game.name}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                      {game.genre}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {game.description}
                  </CardDescription>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        <Users className="h-4 w-4" />
                        <span>Daily Active</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {game.metrics.dau.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                        <Calendar className="h-4 w-4" />
                        <span>Monthly Active</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {game.metrics.mau.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      <BarChart className="h-4 w-4" />
                      <span>Day 1 Retention</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {game.metrics.day1Retention}%
                    </p>
                  </div>

                  <div className="pt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <p>Owner: {game.owner.name}</p>
                    <p>Country: {game.owner.country}</p>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="group-hover:border-indigo-500 group-hover:text-indigo-600">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 