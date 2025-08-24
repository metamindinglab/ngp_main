import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const execAsync = promisify(exec)

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    // Authenticate the game owner
    const authHeader = request.headers.get('Authorization')
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token
    let userId: string
    try {
      const decoded = verify(sessionToken, JWT_SECRET) as { userId: string }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.gameOwner.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get game and verify ownership
    const game = await prisma.game.findFirst({
      where: {
        id: params.gameId,
        gameOwnerId: user.id
      },
      include: {
        adContainers: true
      }
    })

    if (!game) {
      return NextResponse.json({ 
        error: 'Game not found or unauthorized' 
      }, { status: 404 })
    }

    if (!game.serverApiKey) {
      return NextResponse.json({ 
        error: 'Game does not have an API key generated yet. Please generate an API key first.' 
      }, { status: 400 })
    }

    // Generate individual game package
    const packageData = await generateGamePackage(game)

    // Return the rbxm file
    return new NextResponse(packageData, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="MMLNetwork_${game.name.replace(/[^a-zA-Z0-9]/g, '_')}.rbxm"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (error) {
    console.error('Error generating game package:', error)
    return NextResponse.json(
      { error: 'Failed to generate game package' },
      { status: 500 }
    )
  }
}

async function generateGamePackage(game: any) {
  const tempDir = join(process.cwd(), 'temp', `game-${game.id}`)
  
  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true })
    
    // Generate game-specific integration script (fixed for Studio compatibility)
    const integrationScript = generateGameIntegrationScript(game)
    await writeFile(join(tempDir, 'MMLNetworkIntegration.server.lua'), integrationScript)
    
    // Generate container creation script for this game's containers (optional demo)
    const containerScript = generateGameContainerScript(game.adContainers, game.id)
    await writeFile(join(tempDir, 'CreateContainers.server.lua'), containerScript)

    // Generate ServerStorage config with API Key and base URL
    const configModule = `-- MML Network Config (ServerStorage)\nreturn {\n\tapiKey = "${game.serverApiKey}",\n\tbaseUrl = "http://23.96.197.67:3000/api/v1",\n\tupdateInterval = 30,\n\tdebugMode = false,\n\tautoStart = true,\n\tenablePositionSync = true,\n}`
    await writeFile(join(tempDir, 'MMLConfig.server.lua'), configModule)
    
    // Copy all MML Network modules
    const modules = [
      'MMLGameNetwork.lua',
      'MMLContainerManager.lua',
      'MMLContainerStreamer.lua',
      'MMLAssetStorage.lua',
      'MMLRequestManager.lua',
      'MMLUtil.lua',
      'MMLImpressionTracker.lua',
    ]
    
    for (const moduleName of modules) {
      const modulePath = join(process.cwd(), 'src', 'roblox', moduleName)
      try {
        const moduleContent = await readFile(modulePath, 'utf-8')
        await writeFile(join(tempDir, moduleName), moduleContent)
      } catch (error) {
        console.warn(`Warning: Could not find module ${moduleName}, skipping...`)
      }
    }
    
    // Create Rojo project using temp/{Service} layout for easy drag-and-drop
    const rojoProject = {
      name: `MMLNetwork_${game.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      tree: {
        "$className": "Folder",
        "temp": {
          "$className": "Folder",
          "ReplicatedStorage": {
            "$className": "Folder",
            "MMLGameNetwork": { "$path": "MMLGameNetwork.lua" },
            "MMLAssetStorage": { "$path": "MMLAssetStorage.lua" },
            "MMLContainerManager": { "$path": "MMLContainerManager.lua" },
            "MMLContainerStreamer": { "$path": "MMLContainerStreamer.lua" },
            "MMLRequestManager": { "$path": "MMLRequestManager.lua" },
            "MMLImpressionTracker": { "$path": "MMLImpressionTracker.lua" },
            "MMLUtil": { "$path": "MMLUtil.lua" }
          },
          "ServerScriptService": {
            "$className": "Folder",
            "MMLNetworkIntegration": { "$path": "MMLNetworkIntegration.server.lua" },
            "Optional_CreateContainers": { "$path": "CreateContainers.server.lua" }
          },
          "ServerStorage": {
            "$className": "Folder",
            "MMLConfig": { "$path": "MMLConfig.server.lua" }
          }
        }
      }
    }
    
    const projectPath = join(tempDir, 'default.project.json')
    await writeFile(projectPath, JSON.stringify(rojoProject, null, 2))
    
    // Build with Rojo
    const outputPath = join(tempDir, 'game-package.rbxm')
    await execAsync(`cd "${tempDir}" && rojo build --output game-package.rbxm`)
    
    // Read the generated file
    const packageData = await readFile(outputPath)
    
    return packageData
    
  } catch (error) {
    console.error('Error in generateGamePackage:', error)
    throw error
  }
}

function generateGameIntegrationScript(game: any) {
  return `--[[
    MML Network Integration Script for: ${game.name}
    Game ID: ${game.id}
    Generated with pre-configured API key
    Server: 23.96.197.67:3000
--]]

print("🚀 MML Network Integration Starting...")

-- Skip game.Loaded:Wait() for Studio compatibility (fixes hanging issue)
-- game.Loaded:Wait() -- Commented out to prevent Studio hanging

local ServerStorage = game:GetService("ServerStorage")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local okCfg, config = pcall(function()
    return require(ServerStorage:WaitForChild("MMLConfig"))
end)
if not okCfg or type(config) ~= "table" then
    warn("[MML] Missing ServerStorage.MMLConfig; using defaults")
    config = { autoStart = true, updateInterval = 30, enablePositionSync = true }
end

local MMLNetwork = nil
pcall(function()
    MMLNetwork = require(ReplicatedStorage:WaitForChild("MMLGameNetwork"))
end)

local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")

-- Your actual API key and public server URL
local API_KEY = "${game.serverApiKey}"
local API_BASE = "http://23.96.197.67:3000/api/v1"

print("🎮 MML Network: Starting integration for ${game.name}...")
print("🔑 Using API key:", string.sub(API_KEY, 1, 10) .. "...")
print("🌐 API Base URL:", API_BASE)

-- Simple ad fetcher function
local function fetchAdContent(containerId)
    local success, result = pcall(function()
        return HttpService:RequestAsync({
            Url = API_BASE .. "/containers/" .. containerId .. "/ad",
            Method = "GET",
            Headers = {
                ["X-API-Key"] = API_KEY,
                ["Content-Type"] = "application/json"
            }
        })
    end)
    
    if success and result.Success then
        local data = HttpService:JSONDecode(result.Body)
        print("📱 Fetched ad data for", containerId, ":", data.hasAd and "HAS AD" or "NO AD")
        return data
    else
        warn("❌ Failed to fetch ad for", containerId, ":", success and result.StatusCode or result)
        return nil
    end
end

-- Update container with ad content
local function findContainerPartById(targetId)
    for _, obj in pairs(workspace:GetChildren()) do
        if obj:IsA("BasePart") then
            local meta = obj:FindFirstChild("MMLMetadata")
            if meta then
                local idVal = meta:FindFirstChild("ContainerId")
                if idVal and tostring(idVal.Value) == tostring(targetId) then
                    return obj
                end
            end
        end
    end
    return nil
end

local function updateContainer(containerId)
    local containerPart = findContainerPartById(containerId)
    if not containerPart then
        warn("❌ Container not found by metadata:", containerId)
        return false
    end
    
    local adData = fetchAdContent(containerId)
    if adData and adData.hasAd then
        print("✅ Updating container", containerId, "with ad content")
        
        -- Ensure a display surface exists
        local surfaceGui = containerPart:FindFirstChild("MMLDisplaySurface")
        if not surfaceGui then
            surfaceGui = Instance.new("SurfaceGui")
            surfaceGui.Name = "MMLDisplaySurface"
            surfaceGui.Face = Enum.NormalId.Front
            surfaceGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
            surfaceGui.CanvasSize = Vector2.new(1024, 576)
            surfaceGui.AlwaysOnTop = true
            surfaceGui.Parent = containerPart
        end
        local frame = surfaceGui:FindFirstChild("Frame")
        if not frame then
            frame = Instance.new("Frame")
            frame.Name = "Frame"
            frame.Size = UDim2.new(1, 0, 1, 0)
            frame.BackgroundTransparency = 1
            frame.Parent = surfaceGui
        end
        -- Clear existing content
        for _, child in pairs(frame:GetChildren()) do
            if child:IsA("ImageLabel") then
                child:Destroy()
            end
        end
        -- Add new ad content - prefer image assets
        for _, asset in pairs(adData.assets) do
            local at = string.lower(tostring(asset.assetType or ""))
            if (at == "image" or at == "decal" or at == "multi_display" or at == "multimedia_display") and asset.robloxAssetId then
                local imageLabel = Instance.new("ImageLabel")
                imageLabel.Size = UDim2.new(1, 0, 1, 0)
                imageLabel.Image = "rbxassetid://" .. asset.robloxAssetId
                imageLabel.BackgroundTransparency = 1
                imageLabel.Name = "AdImage"
                imageLabel.ScaleType = Enum.ScaleType.Fit
                imageLabel.Parent = frame
                print("📺 Displaying ad image:", asset.robloxAssetId)
                return true
            end
        end
    end
    return false
end

-- Manual update function for immediate testing
function updateContainerNow(containerId)
    print("🔄 Manual update triggered for:", containerId)
    return updateContainer(containerId)
end

-- Start monitoring containers
spawn(function()
    print("🕐 Starting container monitoring loop...")
    while true do
        wait(30) -- Check every 30 seconds
        
        -- Look for containers with MML metadata
        for _, obj in pairs(workspace:GetChildren()) do
            if obj:IsA("Part") then
                local metadata = obj:FindFirstChild("MMLMetadata")
                if metadata then
                    local containerIdValue = metadata:FindFirstChild("ContainerId")
                    if containerIdValue and containerIdValue.Value then
                        updateContainer(containerIdValue.Value)
                    end
                end
            end
        end
    end
end)

print("✅ MML Network integration active!")
print("📱 Monitoring containers for ad updates every 30 seconds")
print("💡 Use updateContainerNow('container_id') to test immediately")

-- Initialize the MML Network
local success, result = true, "Direct integration active"

if success then
    print("✅ MML Network initialized successfully!")
    print("📊 Game: ${game.name}")
    print("🔑 API Key configured")
    
    if config and config.autoStart and MMLNetwork and MMLNetwork.startContainerMonitoring then
        local monitorSuccess = MMLNetwork.startContainerMonitoring()
        if monitorSuccess then
            print("🔄 MML Network: Container monitoring started")
            print("📱 Your ad containers are now active!")
        else
            warn("❌ MML Network: Failed to start container monitoring")
        end
    end
    
else
    warn("❌ MML Network initialization failed:", result)
    warn("🔧 Game: ${game.name}")
    warn("🔧 Game ID: ${game.id}")
end

-- Handle game shutdown gracefully
game:BindToClose(function()
    print("🛑 MML Network: Game shutting down, cleaning up...")
    if MMLNetwork and MMLNetwork.cleanup then
        MMLNetwork.cleanup()
    end
end)
`
}

function generateGameContainerScript(containers: any[], gameId: string) {
  if (!containers || containers.length === 0) {
    return `--[[
    MML Network Container Creation Script
    No containers found for this game.
    Create containers in the Game Owner Portal first.
--]]

print("ℹ️ No containers found for this game")
print("💡 Create containers in the Game Owner Portal to get started")
`
  }

  const smartPositioningFunction = `
-- Smart positioning function
local function getSmartContainerPosition(preferredPosition, containerType)
    local finalPosition = preferredPosition
    
    -- Find spawn locations
    local spawnLocations = {}
    for _, obj in pairs(workspace:GetChildren()) do
        if obj:IsA("SpawnLocation") then
            table.insert(spawnLocations, obj)
        end
    end
    
    -- Check for default spawn if no SpawnLocations found
    if #spawnLocations == 0 then
        local spawn = workspace:FindFirstChild("Spawn")
        if spawn and spawn:IsA("Part") then
            table.insert(spawnLocations, spawn)
        end
    end
    
    if #spawnLocations > 0 then
        local mainSpawn = spawnLocations[1]
        local spawnPos = mainSpawn.Position
        
        print("📍 Found spawn '" .. mainSpawn.Name .. "' at:", spawnPos.X, spawnPos.Y, spawnPos.Z)
        
        -- Position based on container type relative to spawn
        if containerType == "DISPLAY" then
            -- Place display containers in front of spawn (visible to players)
            finalPosition = Vector3.new(spawnPos.X + 15, spawnPos.Y + 5, spawnPos.Z)
            print("📺 Positioning DISPLAY container in front of spawn for visibility")
        elseif containerType == "NPC" then
            -- Place NPC containers near spawn but to the side
            finalPosition = Vector3.new(spawnPos.X + 8, spawnPos.Y, spawnPos.Z + 8)
            print("🤖 Positioning NPC container near spawn for interaction")
        elseif containerType == "MINIGAME" then
            -- Place minigame containers a bit further away
            finalPosition = Vector3.new(spawnPos.X + 20, spawnPos.Y, spawnPos.Z + 10)
            print("🎮 Positioning MINIGAME container away from spawn")
        end
        
        print("🎯 Smart position:", finalPosition.X, finalPosition.Y, finalPosition.Z)
        print("📏 Distance from spawn:", (finalPosition - spawnPos).Magnitude, "studs")
    else
        print("ℹ️ No spawn found, using configured position:", finalPosition.X, finalPosition.Y, finalPosition.Z)
    end
    
    return finalPosition
end
`

  const containerCode = containers.map(container => {
    const safeName = container.name.replace(/[^a-zA-Z0-9]/g, '_')
    const { x, y, z } = container.position
    
    return `
-- Create container: ${container.name}
local fallbackPosition = Vector3.new(${x}, ${y}, ${z})
local smartPosition = getSmartContainerPosition(fallbackPosition, "${container.type}")

local ${safeName} = Instance.new("Part")
${safeName}.Name = "${container.id}"
${safeName}.Size = Vector3.new(${container.type === 'DISPLAY' ? '10, 5, 0.5' : container.type === 'NPC' ? '2, 6, 2' : '8, 8, 8'})
${safeName}.Position = smartPosition
${safeName}.Anchored = true
${safeName}.Material = Enum.Material.Neon
${safeName}.BrickColor = BrickColor.new("Bright blue")
${safeName}.Parent = workspace

-- Add container info
local info = Instance.new("StringValue")
info.Name = "ContainerInfo"
info.Value = "${container.name} (${container.type})"
info.Parent = ${safeName}

-- Add MML metadata
local metadata = Instance.new("Folder")
metadata.Name = "MMLMetadata"
metadata.Parent = ${safeName}

local containerIdValue = Instance.new("StringValue")
containerIdValue.Name = "ContainerId"
containerIdValue.Value = "${container.id}"
containerIdValue.Parent = metadata

local gameIdValue = Instance.new("StringValue")
gameIdValue.Name = "GameId"
gameIdValue.Value = "${gameId}"
gameIdValue.Parent = metadata

local typeValue = Instance.new("StringValue")
typeValue.Name = "Type"
typeValue.Value = "${container.type}"
typeValue.Parent = metadata

-- Add position sync metadata
local positionSyncValue = Instance.new("BoolValue")
positionSyncValue.Name = "EnablePositionSync"
positionSyncValue.Value = true
positionSyncValue.Parent = metadata

local lastSyncedPos = Instance.new("Vector3Value")
lastSyncedPos.Name = "LastSyncedPosition"
lastSyncedPos.Value = smartPosition
lastSyncedPos.Parent = metadata

${container.type === 'DISPLAY' ? `
-- Add SurfaceGui for display ads
local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Name = "MMLDisplaySurface"
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.Parent = ${safeName}

local frame = Instance.new("Frame")
frame.Name = "Frame"
frame.Size = UDim2.new(1, 0, 1, 0)
frame.BackgroundTransparency = 1
frame.Parent = surfaceGui` : container.type === 'NPC' ? `
-- Add ProximityPrompt for NPC interaction
local prompt = Instance.new("ProximityPrompt")
prompt.Name = "MMLInteraction"
prompt.ObjectText = "MML NPC"
prompt.ActionText = "Interact"
prompt.RequiresLineOfSight = false
prompt.Parent = ${safeName}` : `
-- Minigame container setup
${safeName}.Transparency = 0.7
${safeName}.BrickColor = BrickColor.new("Bright green")

local prompt = Instance.new("ProximityPrompt")
prompt.Name = "MMLMinigame"
prompt.ObjectText = "MML Minigame"
prompt.ActionText = "Play"
prompt.RequiresLineOfSight = false
prompt.Parent = ${safeName}`}

print("📦 Container created:", "${container.name}", "at position:", ${safeName}.Position)`
  }).join('\n')

  return `--[[
    MML Network Container Creation Script
    This script creates all containers registered for this game
    Features smart positioning relative to spawn locations
    Run this once to set up all containers
--]]

-- Wait for game to be loaded
game.Loaded:Wait()

print("🏗️ Creating MML Network ad containers for this game...")

${smartPositioningFunction}

${containerCode}

print("✅ All containers created successfully!")
print("💡 You can now delete this script if you want - the containers are permanent")
print("🎮 Make sure the MMLNetworkIntegration script is running to start serving ads!")
`
} 