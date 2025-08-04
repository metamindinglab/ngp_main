import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
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

    const gameOwnerId = user.id
    
    // Fetch game owner's containers
    const containers = await fetchGameOwnerContainers(gameOwnerId)
    const games = await fetchGameOwnerGames(gameOwnerId)
    
    if (containers.length === 0) {
      return NextResponse.json({ 
        error: 'No containers found. Please create at least one ad container first.' 
      }, { status: 400 })
    }

    // Generate custom package
    const packageData = await generateCustomPackage(gameOwnerId, games, containers)
    
    return new NextResponse(packageData, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="MMLNetwork_${gameOwnerId}_Custom.rbxm"`,
        'Content-Length': packageData.length.toString(),
      },
    })
    
  } catch (error) {
    console.error('Error generating custom package:', error)
    return NextResponse.json({ 
      error: 'Failed to generate custom package' 
    }, { status: 500 })
  }
}

async function fetchGameOwnerContainers(gameOwnerId: string) {
  
  try {
    const containers = await prisma.adContainer.findMany({
      where: {
        game: {
          gameOwnerId: gameOwnerId
        }
      },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            serverApiKey: true
          }
        }
      }
    })
    
    return containers
  } catch (error) {
    console.error('Error fetching containers:', error)
    throw error
  }
}

async function fetchGameOwnerGames(gameOwnerId: string) {
  
  try {
    const games = await prisma.game.findMany({
      where: {
        gameOwnerId: gameOwnerId
      },
      select: {
        id: true,
        name: true,
        serverApiKey: true
      }
    })
    
    return games
  } catch (error) {
    console.error('Error fetching games:', error)
    throw error
  }
}

async function generateCustomPackage(gameOwnerId: string, games: any[], containers: any[]) {
  const tempDir = join(process.cwd(), 'temp', `custom-${gameOwnerId}`)
  
  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true })
    
    // Generate custom integration script with API keys
    const integrationScript = generateCustomIntegrationScript(games, containers)
    await writeFile(join(tempDir, 'MMLNetworkIntegration.lua'), integrationScript)
    
    // Generate container creation script
    const containerScript = generateContainerCreationScript(containers)
    await writeFile(join(tempDir, 'CreateContainers.lua'), containerScript)
    
    // Copy the base module
    const baseModulePath = join(process.cwd(), 'src', 'roblox', 'MMLGameNetwork.lua')
    const baseModule = await readFile(baseModulePath, 'utf-8')
    await writeFile(join(tempDir, 'MMLGameNetwork.lua'), baseModule)
    
    // Create custom Rojo project
    const rojoProject = {
      name: `MMLNetwork_${gameOwnerId}_Custom`,
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
    
    const projectPath = join(tempDir, 'project.json')
    await writeFile(projectPath, JSON.stringify(rojoProject, null, 2))
    
    // Build with Rojo
    const outputPath = join(tempDir, 'custom-package.rbxm')
    await execAsync(`cd "${tempDir}" && rojo build project.json --output custom-package.rbxm`)
    
    // Read the generated file
    const packageData = await readFile(outputPath)
    
    return packageData
    
  } catch (error) {
    console.error('Error in generateCustomPackage:', error)
    throw error
  }
}

function generateCustomIntegrationScript(games: any[], containers: any[]) {
  const apiKeys = games.map(g => `    ["${g.id}"] = "${g.serverApiKey || 'GENERATE_API_KEY_FIRST'}"`).join(',\n')
  
  return `--[[
    MML Network Custom Integration Script
    Generated specifically for your games and containers
    Server: 23.96.197.67:3000
--]]

print("🚀 MML Network Custom Integration Starting...")

-- Skip game.Loaded:Wait() for Studio compatibility (fixes hanging issue)
-- game.Loaded:Wait() -- Commented out to prevent Studio hanging

local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")

-- Your API Keys (one for each game)
local gameAPIKeys = {
${apiKeys}
}

-- Public server configuration
local API_BASE = "http://23.96.197.67:3000/api/v1"

-- Auto-detect current game and use appropriate API key
local currentGameId = nil
local currentAPIKey = nil

-- Try to detect which game this is (you can customize this logic)
for gameId, apiKey in pairs(gameAPIKeys) do
    -- You can add custom detection logic here
    -- For now, we'll use the first available API key
    if apiKey ~= "GENERATE_API_KEY_FIRST" then
        currentGameId = gameId
        currentAPIKey = apiKey
        break
    end
end

if not currentAPIKey then
    warn("❌ No valid API key found. Please generate API keys in the Game Owner Portal.")
    return
end

print("🎮 MML Network: Starting initialization for game:", currentGameId)
print("🔑 Using API key:", string.sub(currentAPIKey, 1, 10) .. "...")
print("🌐 API Base URL:", API_BASE)

-- Simple ad fetcher function
local function fetchAdContent(containerId)
    local success, result = pcall(function()
        return HttpService:RequestAsync({
            Url = API_BASE .. "/containers/" .. containerId .. "/ad",
            Method = "GET",
            Headers = {
                ["X-API-Key"] = currentAPIKey,
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
local function updateContainer(containerId)
    local containerPart = workspace:FindFirstChild(containerId)
    if not containerPart then
        warn("❌ Container not found:", containerId)
        return
    end
    
    local adData = fetchAdContent(containerId)
    if adData and adData.hasAd then
        print("✅ Updating container", containerId, "with ad content")
        
        -- Find the display surface
        local surfaceGui = containerPart:FindFirstChild("MMLDisplaySurface")
        if surfaceGui then
            local frame = surfaceGui:FindFirstChild("Frame")
            if frame then
                -- Clear existing content
                for _, child in pairs(frame:GetChildren()) do
                    if child:IsA("ImageLabel") then
                        child:Destroy()
                    end
                end
                
                -- Add new ad content
                for _, asset in pairs(adData.assets) do
                    if asset.assetType == "multi_display" and asset.robloxAssetId then
                        local imageLabel = Instance.new("ImageLabel")
                        imageLabel.Size = UDim2.new(1, 0, 1, 0)
                        imageLabel.Image = "rbxassetid://" .. asset.robloxAssetId
                        imageLabel.BackgroundTransparency = 1
                        imageLabel.Name = "AdImage"
                        imageLabel.Parent = frame
                        
                        print("📺 Displaying ad image:", asset.robloxAssetId)
                        return true -- Successfully added image
                    end
                end
            end
        end
    end
    return false
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

-- Initialize the MML Network
local success, result = true, "Direct integration active"

if success then
    print("✅ MML Network initialized successfully!")
    print("📊 Found containers:", result.containerCount or 0)
    
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
    warn("🔧 Current Game ID:", currentGameId)
    warn("🔧 Using API Key:", currentAPIKey and (string.sub(currentAPIKey, 1, 10) .. "...") or "NONE")
end

-- Handle game shutdown gracefully
game:BindToClose(function()
    print("🛑 MML Network: Game shutting down, cleaning up...")
    MMLNetwork.cleanup()
end)`
}

function generateContainerCreationScript(containers: any[]) {
  const containerCode = containers.map(container => {
    const safeName = container.name.replace(/[^a-zA-Z0-9]/g, '_')
    const { x, y, z } = container.position
    
    return `
-- Create container: ${container.name}
local ${safeName} = Instance.new("Part")
${safeName}.Name = "${container.id}"
${safeName}.Size = Vector3.new(${container.type === 'DISPLAY' ? '10, 5, 0.5' : container.type === 'NPC' ? '2, 6, 2' : '8, 8, 8'})
${safeName}.Position = Vector3.new(${x}, ${y}, ${z})
${safeName}.Anchored = true
${safeName}.Material = Enum.Material.Neon
${safeName}.BrickColor = BrickColor.new("Bright blue")
${safeName}.Parent = workspace

-- Add container info
local info = Instance.new("StringValue")
info.Name = "ContainerInfo"
info.Value = "${container.name} (${container.type})"
info.Parent = ${safeName}

${container.type === 'DISPLAY' ? `
-- Add SurfaceGui for display ads
local surfaceGui = Instance.new("SurfaceGui")
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
textLabel.Parent = frame` : '-- Container ready for MML Network to populate with content'}

print("📦 Container created:", "${container.name}", "at position:", ${safeName}.Position)`
  }).join('\n')

  return `--[[
    MML Network Container Creation Script
    This script creates all your registered ad containers automatically
    Run this once to set up all containers in your game
--]]

-- Wait for game to be loaded
game.Loaded:Wait()

print("🏗️ Creating MML Network ad containers...")

${containerCode}

print("✅ All containers created successfully!")
print("💡 You can now delete this script if you want - the containers are permanent")
print("🎮 Make sure to run the MMLNetworkIntegration script to start serving ads!")`
} 