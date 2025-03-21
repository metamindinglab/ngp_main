"use server"

import { revalidatePath } from "next/cache"
import { getGames, getGameById as getGameFromDb, addGame, updateGameById, deleteGameById } from "./robloxGamesDb"
import type { RobloxGame } from "./types/robloxGames"

// Get all games
export async function getAllGames() {
  try {
    return await getGames()
  } catch (error) {
    console.error("Error fetching games:", error)
    throw new Error("Failed to fetch games")
  }
}

// Get game by ID
export async function getGameById(id: string) {
  try {
    const game = await getGameFromDb(id)
    if (!game) throw new Error(`Game with ID ${id} not found`)
    return game
  } catch (error) {
    console.error("Error fetching game:", error)
    throw new Error("Failed to fetch game")
  }
}

// Add a new game
export async function createGame(game: Omit<RobloxGame, "id">) {
  try {
    const newGame = await addGame(game)
    revalidatePath("/games")
    return newGame
  } catch (error) {
    console.error("Error creating game:", error)
    throw new Error("Failed to create game")
  }
}

// Update a game
export async function updateGame(id: string, updates: Partial<RobloxGame>) {
  try {
    const updatedGame = await updateGameById(id, updates)
    if (!updatedGame) throw new Error(`Game with ID ${id} not found`)
    revalidatePath("/games")
    return updatedGame
  } catch (error) {
    console.error("Error updating game:", error)
    throw new Error("Failed to update game")
  }
}

// Delete a game
export async function deleteGame(id: string) {
  try {
    const success = await deleteGameById(id)
    if (!success) throw new Error(`Game with ID ${id} not found`)
    revalidatePath("/games")
    return success
  } catch (error) {
    console.error("Error deleting game:", error)
    throw new Error("Failed to delete game")
  }
} 