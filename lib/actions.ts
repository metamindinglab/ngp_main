"use server"

import { revalidatePath } from "next/cache"
import { getAssets, getAssetById as getAssetFromDb, addAsset, updateAssetById, deleteAssetById } from "./db"
import type { RobloxAsset } from "./types"

// Get all assets
export async function getAllAssets() {
  try {
    return await getAssets()
  } catch (error) {
    console.error("Error fetching assets:", error)
    throw new Error("Failed to fetch assets")
  }
}

// Get a single asset by ID
export async function getAssetById(id: string) {
  try {
    return await getAssetFromDb(id)
  } catch (error) {
    console.error(`Error fetching asset with ID ${id}:`, error)
    throw new Error("Failed to fetch asset")
  }
}

// Create a new asset
export async function createAsset(data: any) {
  try {
    // Prepare the asset for database storage
    await addAsset(data as Omit<RobloxAsset, "id" | "createdAt" | "updatedAt">)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error creating asset:", error)
    throw new Error("Failed to create asset")
  }
}

// Update an existing asset
export async function updateAsset(id: string, data: any) {
  try {
    await updateAssetById(id, data)
    revalidatePath("/")
    revalidatePath(`/assets/edit/${id}`)
    return { success: true }
  } catch (error) {
    console.error(`Error updating asset with ID ${id}:`, error)
    throw new Error("Failed to update asset")
  }
}

// Delete an asset
export async function deleteAsset(id: string) {
  try {
    await deleteAssetById(id)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error(`Error deleting asset with ID ${id}:`, error)
    throw new Error("Failed to delete asset")
  }
}

