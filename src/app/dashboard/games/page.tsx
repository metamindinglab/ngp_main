import { GamesClient } from '@/components/games/games-client';

async function getGames() {
  try {
    const response = await fetch('http://localhost:3000/api/games', { cache: 'no-store' });
    const data = await response.json();
    return data.games;
  } catch (error) {
    console.error('Error loading games:', error);
    return [];
  }
}

export default async function GamesPage() {
  const games = await getGames();
  
  return <GamesClient initialGames={games} />;
} 