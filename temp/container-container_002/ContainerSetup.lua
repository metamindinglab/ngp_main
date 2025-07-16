--[[
    MML Network Container: Plaza Central Display
    Container ID: container_002
    Type: DISPLAY
    
    FIRST DOWNLOAD
    
    This script creates a single ad container in your game.
    
--]]

-- Wait for game to be loaded
game.Loaded:Wait()

local ContainerModel = require(script.Parent.ContainerModel)

-- Container configuration
local containerConfig = {
    id = "container_002",
    name = "Plaza Central Display",
    type = "DISPLAY",
    position = Vector3.new(20, 3, 0),
    gameId = "game_b2e6f7b7"
}

print("🏗️ Setting up MML Container: Plaza Central Display")

-- Check for existing container to prevent duplicates
local existingContainer = workspace:FindFirstChild("container_002")
if existingContainer then
    
    warn("⚠️ Container 'Plaza Central Display' already exists in workspace!")
    warn("❌ Skipping creation to prevent duplicates")
    print("💡 If you want to recreate it, delete the existing container first")
    return
end

-- Create the container
local success, result = pcall(function()
    return ContainerModel.createContainer(containerConfig)
end)

if success then
    print("✅ Container 'Plaza Central Display' created successfully!")
    print("📍 Position:", containerConfig.position)
    print("🎮 Container is ready for MML Network integration")
    
else
    warn("❌ Failed to create container:", result)
end

-- Auto-cleanup script after execution
wait(2)
script:Destroy()
