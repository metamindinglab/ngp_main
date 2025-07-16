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
    
    // Generate game-specific integration script
    const integrationScript = generateGameIntegrationScript(game)
    await writeFile(join(tempDir, 'MMLNetworkIntegration.lua'), integrationScript)
    
    // Generate container creation script for this game's containers
    const containerScript = generateGameContainerScript(game.adContainers)
    await writeFile(join(tempDir, 'CreateContainers.lua'), containerScript)
    
    // Copy the base module
    const baseModulePath = join(process.cwd(), 'src', 'roblox', 'MMLGameNetwork.lua')
    const baseModule = await readFile(baseModulePath, 'utf-8')
    await writeFile(join(tempDir, 'MMLGameNetwork.lua'), baseModule)
    
    // Create Rojo project for this specific game
    const rojoProject = {
      name: `MMLNetwork_${game.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      tree: {
        "$className": "Folder",
        "ReplicatedStorage": {
          "$className": "Folder",
          "MMLGameNetwork": {
            "$path": "MMLGameNetwork.lua"
          }
        },
        "ServerScriptService": {
          "$className": "Folder",
          "MMLNetworkIntegration": {
            "$path": "MMLNetworkIntegration.lua"
          },
          "CreateContainers": {
            "$path": "CreateContainers.lua"
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
--]]

-- Wait for game to be loaded
game.Loaded:Wait()

-- Get the MML Network module
local MMLNetwork = require(game:GetService("ReplicatedStorage"):WaitForChild("MMLGameNetwork"))

-- Pre-configured API Key for this game
local gameAPIKey = "${game.serverApiKey}"

-- Configuration
local config = {
    -- How often to check for new ads (in seconds)
    updateInterval = 30,
    
    -- Enable debug logging
    debugMode = false,
    
    -- Auto-start monitoring when initialized
    autoStart = true,
    
    -- Enable automatic position synchronization
    enablePositionSync = true
}

print("🎮 MML Network: Starting initialization for ${game.name}...")

-- Initialize the MML Network
local success, result = MMLNetwork.initialize(gameAPIKey, config)

if success then
    print("✅ MML Network initialized successfully!")
    print("📊 Game: ${game.name}")
    print("🔑 API Key configured")
    
    if config.autoStart then
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
    MMLNetwork.cleanup()
end)
`
}

function generateGameContainerScript(containers: any[]) {
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

${container.type === 'DISPLAY' ? `
-- Add SurfaceGui for display ads
local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Name = "MMLDisplaySurface"
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.Parent = ${safeName}

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
textLabel.Parent = frame` : container.type === 'NPC' ? `
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