import fs from "fs/promises"
import path from "path"
import type { RobloxGame, RobloxGamesDatabase } from "./types/robloxGames"

// Path to the database file
const DB_PATH = path.join(process.cwd(), "data/robloxGames.json")

// Ensure the data directory exists
async function ensureDbExists() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    await fs.mkdir(dataDir, { recursive: true })

    // Check if the database file exists
    try {
      await fs.access(DB_PATH)
    } catch {
      // Initialize with empty games array if file doesn't exist
      await fs.writeFile(DB_PATH, JSON.stringify({ games: [] }, null, 2))
    }
  } catch (error) {
    console.error("Error ensuring database exists:", error)
    throw error
  }
}

// Read the database
export async function readDb(): Promise<RobloxGamesDatabase> {
  await ensureDbExists()

  try {
    const data = await fs.readFile(DB_PATH, "utf-8")
    return JSON.parse(data) as RobloxGamesDatabase
  } catch (error) {
    console.error("Error reading database:", error)
    throw error
  }
}

// Write to the database
export async function writeDb(db: RobloxGamesDatabase): Promise<void> {
  await ensureDbExists()

  try {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
  } catch (error) {
    console.error("Error writing to database:", error)
    throw error
  }
}

// Get all games
export async function getGames(): Promise<RobloxGame[]> {
  const db = await readDb()
  return db.games
}

// Get game by ID
export async function getGameById(id: string): Promise<RobloxGame | undefined> {
  const db = await readDb()
  return db.games.find((game) => game.id === id)
}

// Add a new game
export async function addGame(game: Omit<RobloxGame, "id">): Promise<RobloxGame> {
  const db = await readDb()

  const newGame = {
    ...game,
    id: `RBXG${String(db.games.length + 1).padStart(3, "0")}`,
  }

  db.games.push(newGame)
  await writeDb(db)

  return newGame
}

// Update an existing game
export async function updateGameById(id: string, updates: Partial<RobloxGame>): Promise<RobloxGame | undefined> {
  const db = await readDb()

  const index = db.games.findIndex((game) => game.id === id)
  if (index === -1) return undefined

  const currentGame = db.games[index]
  const updatedGame = {
    ...currentGame,
    ...updates,
  }

  db.games[index] = updatedGame
  await writeDb(db)

  return updatedGame
}

// Delete a game
export async function deleteGameById(id: string): Promise<boolean> {
  const db = await readDb()

  const initialLength = db.games.length
  db.games = db.games.filter((game) => game.id !== id)

  await writeDb(db)

  return db.games.length < initialLength
} 