--[[
    MML Network Container Creation Script
    This script creates all containers registered for this game
    Run this once to set up all containers
--]]

-- Wait for game to be loaded
game.Loaded:Wait()

print("🏗️ Creating MML Network ad containers for this game...")


-- Create container: Spawn Area Billboard
local Spawn_Area_Billboard = Instance.new("Part")
Spawn_Area_Billboard.Name = "container_001"
Spawn_Area_Billboard.Size = Vector3.new(10, 5, 0.5)
Spawn_Area_Billboard.Position = Vector3.new(0, 5, -10)
Spawn_Area_Billboard.Anchored = true
Spawn_Area_Billboard.Material = Enum.Material.Neon
Spawn_Area_Billboard.BrickColor = BrickColor.new("Bright blue")
Spawn_Area_Billboard.Parent = workspace

-- Add container info
local info = Instance.new("StringValue")
info.Name = "ContainerInfo"
info.Value = "Spawn Area Billboard (DISPLAY)"
info.Parent = Spawn_Area_Billboard

-- Add MML metadata
local metadata = Instance.new("Folder")
metadata.Name = "MMLMetadata"
metadata.Parent = Spawn_Area_Billboard

local containerIdValue = Instance.new("StringValue")
containerIdValue.Name = "ContainerId"
containerIdValue.Value = "container_001"
containerIdValue.Parent = metadata


-- Add SurfaceGui for display ads
local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Name = "MMLDisplaySurface"
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.Parent = Spawn_Area_Billboard

local frame = Instance.new("Frame")
frame.Size = UDim2.new(1, 0, 1, 0)
frame.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
frame.Parent = surfaceGui

local textLabel = Instance.new("TextLabel")
textLabel.Size = UDim2.new(1, 0, 1, 0)
textLabel.BackgroundTransparency = 1
textLabel.Text = "MML Ad Loading..."
textLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
textLabel.TextScaled = true
textLabel.Parent = frame

print("📦 Container created:", "Spawn Area Billboard", "at position:", Spawn_Area_Billboard.Position)

-- Create container: Plaza Central Display
local Plaza_Central_Display = Instance.new("Part")
Plaza_Central_Display.Name = "container_002"
Plaza_Central_Display.Size = Vector3.new(10, 5, 0.5)
Plaza_Central_Display.Position = Vector3.new(20, 3, 0)
Plaza_Central_Display.Anchored = true
Plaza_Central_Display.Material = Enum.Material.Neon
Plaza_Central_Display.BrickColor = BrickColor.new("Bright blue")
Plaza_Central_Display.Parent = workspace

-- Add container info
local info = Instance.new("StringValue")
info.Name = "ContainerInfo"
info.Value = "Plaza Central Display (DISPLAY)"
info.Parent = Plaza_Central_Display

-- Add MML metadata
local metadata = Instance.new("Folder")
metadata.Name = "MMLMetadata"
metadata.Parent = Plaza_Central_Display

local containerIdValue = Instance.new("StringValue")
containerIdValue.Name = "ContainerId"
containerIdValue.Value = "container_002"
containerIdValue.Parent = metadata


-- Add SurfaceGui for display ads
local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Name = "MMLDisplaySurface"
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.Parent = Plaza_Central_Display

local frame = Instance.new("Frame")
frame.Size = UDim2.new(1, 0, 1, 0)
frame.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
frame.Parent = surfaceGui

local textLabel = Instance.new("TextLabel")
textLabel.Size = UDim2.new(1, 0, 1, 0)
textLabel.BackgroundTransparency = 1
textLabel.Text = "MML Ad Loading..."
textLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
textLabel.TextScaled = true
textLabel.Parent = frame

print("📦 Container created:", "Plaza Central Display", "at position:", Plaza_Central_Display.Position)

-- Create container: Side Building Ad
local Side_Building_Ad = Instance.new("Part")
Side_Building_Ad.Name = "container_003"
Side_Building_Ad.Size = Vector3.new(10, 5, 0.5)
Side_Building_Ad.Position = Vector3.new(-15, 8, 10)
Side_Building_Ad.Anchored = true
Side_Building_Ad.Material = Enum.Material.Neon
Side_Building_Ad.BrickColor = BrickColor.new("Bright blue")
Side_Building_Ad.Parent = workspace

-- Add container info
local info = Instance.new("StringValue")
info.Name = "ContainerInfo"
info.Value = "Side Building Ad (DISPLAY)"
info.Parent = Side_Building_Ad

-- Add MML metadata
local metadata = Instance.new("Folder")
metadata.Name = "MMLMetadata"
metadata.Parent = Side_Building_Ad

local containerIdValue = Instance.new("StringValue")
containerIdValue.Name = "ContainerId"
containerIdValue.Value = "container_003"
containerIdValue.Parent = metadata


-- Add SurfaceGui for display ads
local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Name = "MMLDisplaySurface"
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.Parent = Side_Building_Ad

local frame = Instance.new("Frame")
frame.Size = UDim2.new(1, 0, 1, 0)
frame.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
frame.Parent = surfaceGui

local textLabel = Instance.new("TextLabel")
textLabel.Size = UDim2.new(1, 0, 1, 0)
textLabel.BackgroundTransparency = 1
textLabel.Text = "MML Ad Loading..."
textLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
textLabel.TextScaled = true
textLabel.Parent = frame

print("📦 Container created:", "Side Building Ad", "at position:", Side_Building_Ad.Position)

print("✅ All containers created successfully!")
print("💡 You can now delete this script if you want - the containers are permanent")
print("🎮 Make sure the MMLNetworkIntegration script is running to start serving ads!")
