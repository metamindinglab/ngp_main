import fs from "fs/promises"
import path from "path"
import { GameObject } from "./types/gameObjects"

const GAME_OBJECTS_PATH = path.join(process.cwd(), "data/gameObjects.json")

interface GameObjectsDatabase {
  [gameId: string]: GameObject[];
}

// Ensure the game objects file exists
async function ensureGameObjectsExists() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    await fs.mkdir(dataDir, { recursive: true })

    try {
      await fs.access(GAME_OBJECTS_PATH)
    } catch {
      await fs.writeFile(GAME_OBJECTS_PATH, JSON.stringify({}, null, 2))
    }
  } catch (error) {
    console.error("Error ensuring game objects file exists:", error)
    throw error
  }
}

// Read game objects
async function readGameObjects(): Promise<GameObjectsDatabase> {
  await ensureGameObjectsExists()
  const data = await fs.readFile(GAME_OBJECTS_PATH, "utf-8")
  return JSON.parse(data)
}

// Write game objects
async function writeGameObjects(db: GameObjectsDatabase): Promise<void> {
  await ensureGameObjectsExists()
  await fs.writeFile(GAME_OBJECTS_PATH, JSON.stringify(db, null, 2))
}

// Get all objects for a game
export async function getGameObjects(gameId: string): Promise<GameObject[]> {
  const db = await readGameObjects()
  return db[gameId] || []
}

// Get a specific object from a game
export async function getGameObject(gameId: string, objectId: string): Promise<GameObject | undefined> {
  const objects = await getGameObjects(gameId)
  return objects.find(obj => obj.id === objectId)
}

// Add a new object to a game
export async function addGameObject(gameId: string, object: Omit<GameObject, "id">): Promise<GameObject> {
  const db = await readGameObjects()
  const objects = db[gameId] || []

  const newObject = {
    ...object,
    id: `${gameId}_obj_${objects.length + 1}`,
  } as GameObject

  db[gameId] = [...objects, newObject]
  await writeGameObjects(db)

  return newObject
}

// Update an object in a game
export async function updateGameObject(
  gameId: string,
  objectId: string,
  updates: Partial<GameObject>
): Promise<GameObject | undefined> {
  const db = await readGameObjects()
  const objects = db[gameId] || []

  const index = objects.findIndex(obj => obj.id === objectId)
  if (index === -1) return undefined

  const currentObject = objects[index]
  const updatedObject = {
    ...currentObject,
    ...updates,
    type: currentObject.type, // Prevent type changes
  } as GameObject

  objects[index] = updatedObject
  db[gameId] = objects
  await writeGameObjects(db)

  return updatedObject
}

// Delete an object from a game
export async function deleteGameObject(gameId: string, objectId: string): Promise<boolean> {
  const db = await readGameObjects()
  const objects = db[gameId] || []

  const filteredObjects = objects.filter(obj => obj.id !== objectId)
  if (filteredObjects.length === objects.length) return false

  db[gameId] = filteredObjects
  await writeGameObjects(db)

  return true
}

// Validate session token (in production, use proper JWT validation)
export function validateSessionToken(token: string): { gameId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const [gameId, timestamp] = decoded.split('_')
    
    // Check if token is expired (24 hours)
    const tokenTime = parseInt(timestamp)
    if (Date.now() - tokenTime > 24 * 60 * 60 * 1000) {
      return null
    }

    return { gameId, timestamp: tokenTime }
  } catch {
    return null
  }
} 