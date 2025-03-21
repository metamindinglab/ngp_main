import fs from "fs/promises"
import path from "path"
import type { RobloxAsset } from "./types"
import { assets as initialAssets } from "./initialData"

// Path to the database file
const DB_PATH = path.join(process.cwd(), "data/assets.json")

// Database structure
interface AssetDatabase {
  assets: RobloxAsset[]
}

// Ensure the data directory exists
async function ensureDbExists() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    await fs.mkdir(dataDir, { recursive: true })

    // Check if the database file exists, if not create it
    try {
      await fs.access(DB_PATH)
    } catch {
      // Initialize with provided sample data
      await fs.writeFile(DB_PATH, JSON.stringify({ assets: initialAssets }, null, 2))
    }
  } catch (error) {
    console.error("Error ensuring database exists:", error)
    throw error
  }
}

// Read the database
export async function readDb(): Promise<AssetDatabase> {
  await ensureDbExists()

  try {
    const data = await fs.readFile(DB_PATH, "utf-8")
    return JSON.parse(data) as AssetDatabase
  } catch (error) {
    console.error("Error reading database:", error)
    throw error
  }
}

// Write to the database
export async function writeDb(db: AssetDatabase): Promise<void> {
  await ensureDbExists()

  try {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
  } catch (error) {
    console.error("Error writing to database:", error)
    throw error
  }
}

// Get all assets
export async function getAssets(): Promise<RobloxAsset[]> {
  const db = await readDb()
  return db.assets
}

// Get asset by ID
export async function getAssetById(id: string): Promise<RobloxAsset | undefined> {
  const db = await readDb()
  return db.assets.find((asset) => asset.id === id)
}

// Add a new asset
export async function addAsset(asset: Omit<RobloxAsset, "id" | "createdAt" | "updatedAt">): Promise<RobloxAsset> {
  const db = await readDb()

  const newAsset = {
    ...asset,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: asset.tags || [],
  } as RobloxAsset

  db.assets.push(newAsset)
  await writeDb(db)

  return newAsset
}

// Update an existing asset
export async function updateAssetById(id: string, updates: Partial<RobloxAsset>): Promise<RobloxAsset | undefined> {
  const db = await readDb()

  const index = db.assets.findIndex((asset) => asset.id === id)
  if (index === -1) return undefined

  // Ensure we maintain the correct asset type
  const currentAsset = db.assets[index]

  const updatedAsset = {
    ...currentAsset,
    ...updates,
    assetType: currentAsset.assetType, // Ensure asset type cannot be changed
    updatedAt: new Date().toISOString(),
  } as RobloxAsset

  db.assets[index] = updatedAsset
  await writeDb(db)

  return updatedAsset
}

// Delete an asset
export async function deleteAssetById(id: string): Promise<boolean> {
  const db = await readDb()

  const initialLength = db.assets.length
  db.assets = db.assets.filter((asset) => asset.id !== id)

  await writeDb(db)

  return db.assets.length < initialLength
}

