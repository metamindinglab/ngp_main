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
  { params }: { params: { containerId: string } }
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

    // Get container and verify ownership
    const container = await prisma.adContainer.findFirst({
      where: {
        id: params.containerId,
        game: {
          gameOwnerId: user.id
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

    if (!container) {
      return NextResponse.json({ 
        error: 'Container not found or unauthorized' 
      }, { status: 404 })
    }

    // Generate rbxm without download tracking for now
    const isFirstDownload = true
    
    // Generate individual container rbxm
    const packageData = await generateContainerPackage(container, isFirstDownload)

    // Return the rbxm file
    return new NextResponse(packageData, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="MMLContainer_${container.name.replace(/[^a-zA-Z0-9]/g, '_')}.rbxm"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (error) {
    console.error('Error generating container package:', error)
    return NextResponse.json(
      { error: 'Failed to generate container package' },
      { status: 500 }
    )
  }
}

// TODO: Re-enable these functions after migration is fixed
/*
async function checkContainerDownload(containerId: string, gameOwnerId: string) {
  // Check if this container has been downloaded before
  const existing = await prisma.containerDownload.findFirst({
    where: {
      containerId,
      gameOwnerId
    }
  })

  return {
    isFirstDownload: !existing,
    lastDownloaded: existing?.lastDownloaded || null,
    downloadCount: existing?.downloadCount || 0
  }
}

async function updateContainerDownload(containerId: string, gameOwnerId: string) {
  // Update or create download tracking record
  await prisma.containerDownload.upsert({
    where: {
      containerId_gameOwnerId: {
        containerId,
        gameOwnerId
      }
    },
    update: {
      downloadCount: {
        increment: 1
      },
      lastDownloaded: new Date()
    },
    create: {
      containerId,
      gameOwnerId,
      downloadCount: 1,
      lastDownloaded: new Date()
    }
  })
}
*/

async function generateContainerPackage(container: any, isFirstDownload: boolean) {
  const tempDir = join(process.cwd(), 'temp', `container-${container.id}`)
  
  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true })
    
    // Generate container-specific script with duplicate prevention
    const containerScript = generateSingleContainerScript(container, isFirstDownload)
    await writeFile(join(tempDir, 'ContainerSetup.server.lua'), containerScript)
    
    // Generate container model
    const containerModel = generateContainerModel(container)
    await writeFile(join(tempDir, 'ContainerModel.lua'), containerModel)
    
    // Create Rojo project for this specific container
    const rojoProject = {
      name: `MMLContainer_${container.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      tree: {
        "$className": "Folder",
        "ContainerSetup": {
          "$path": "ContainerSetup.server.lua"
        },
        "ContainerModel": {
          "$path": "ContainerModel.lua"
        }
      }
    }
    
    const projectPath = join(tempDir, 'default.project.json')
    await writeFile(projectPath, JSON.stringify(rojoProject, null, 2))
    
    // Build with Rojo
    const outputPath = join(tempDir, 'container.rbxm')
    await execAsync(`cd "${tempDir}" && rojo build --output container.rbxm`)
    
    // Read the generated file
    const packageData = await readFile(outputPath)
    
    return packageData
    
  } catch (error) {
    console.error('Error in generateContainerPackage:', error)
    throw error
  }
}

function generateSingleContainerScript(container: any, isFirstDownload: boolean) {
  const safeName = container.name.replace(/[^a-zA-Z0-9]/g, '_')
  const { x, y, z } = container.position
  
  return `--[[
    MML Network Container: ${container.name}
    Container ID: ${container.id}
    Type: ${container.type}
    
    ${isFirstDownload ? 'FIRST DOWNLOAD' : 'RE-DOWNLOAD DETECTED'}
    
    This script creates a single ad container in your game.
    Features smart positioning relative to spawn locations.
    ${!isFirstDownload ? 'WARNING: This container may already exist in your game!' : ''}
--]]

-- Wait for game to be loaded
game.Loaded:Wait()

local ContainerModel = require(script.Parent.ContainerModel)

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

-- Container configuration
local containerConfig = {
    id = "${container.id}",
    name = "${container.name}",
    type = "${container.type}",
    position = Vector3.new(${x}, ${y}, ${z}),  -- Fallback position
    gameId = "${container.game.id}"
}

print("🏗️ Setting up MML Container: ${container.name}")

-- Check for existing container to prevent duplicates
local existingContainer = workspace:FindFirstChild("${container.id}")
if existingContainer then
    ${!isFirstDownload ? `
    warn("⚠️ Container '${container.name}' already exists!")
    warn("⚠️ This appears to be a re-download. The container may already be in your game.")
    
    local response = game:GetService("UserInputService").InputBegan:Connect(function(input)
        if input.KeyCode == Enum.KeyCode.Y then
            print("🔄 Replacing existing container...")
            existingContainer:Destroy()
            -- Get smart position and create container
            local smartPosition = getSmartContainerPosition(containerConfig.position, containerConfig.type)
            containerConfig.position = smartPosition
            ContainerModel.createContainer(containerConfig)
        elseif input.KeyCode == Enum.KeyCode.N then
            print("❌ Cancelled container creation")
        end
    end)
    
    print("❓ Replace existing container? Press Y for Yes, N for No")
    return` : `
    warn("⚠️ Container '${container.name}' already exists in workspace!")
    warn("❌ Skipping creation to prevent duplicates")
    print("💡 If you want to recreate it, delete the existing container first")
    return`}
end

-- Get smart position based on spawn location
local smartPosition = getSmartContainerPosition(containerConfig.position, containerConfig.type)
containerConfig.position = smartPosition

-- Create the container
local success, result = pcall(function()
    return ContainerModel.createContainer(containerConfig)
end)

if success then
    print("✅ Container '${container.name}' created successfully!")
    print("📍 Position:", containerConfig.position)
    print("🎮 Container is ready for MML Network integration")
    ${!isFirstDownload ? `
    print("📝 Note: This was a re-download. Make sure to check for duplicates!")` : ''}
else
    warn("❌ Failed to create container:", result)
end

-- Auto-cleanup script after execution
wait(2)
script:Destroy()
`
}

function generateContainerModel(container: any) {
  const { x, y, z } = container.position
  
  return `--[[
    MML Network Container Model
    Handles the creation and setup of individual containers
--]]

local ContainerModel = {}

function ContainerModel.createContainer(config)
    local safeName = config.name:gsub("[^%w]", "_")
    
    -- Create main container part
    local containerPart = Instance.new("Part")
    containerPart.Name = config.id
    containerPart.Size = Vector3.new(${container.type === 'DISPLAY' ? '10, 5, 0.5' : container.type === 'NPC' ? '2, 6, 2' : '8, 8, 8'})
    containerPart.Position = config.position
    containerPart.Anchored = true
    containerPart.Material = Enum.Material.Neon
    containerPart.BrickColor = BrickColor.new("Bright blue")
    containerPart.Parent = workspace
    
    -- Add container info
    local info = Instance.new("StringValue")
    info.Name = "ContainerInfo"
    info.Value = config.name .. " (" .. config.type .. ")"
    info.Parent = containerPart
    
    -- Add container metadata
    local metadata = Instance.new("Folder")
    metadata.Name = "MMLMetadata"
    metadata.Parent = containerPart
    
    local containerIdValue = Instance.new("StringValue")
    containerIdValue.Name = "ContainerId"
    containerIdValue.Value = config.id
    containerIdValue.Parent = metadata
    
    local gameIdValue = Instance.new("StringValue")
    gameIdValue.Name = "GameId"
    gameIdValue.Value = config.gameId
    gameIdValue.Parent = metadata
    
    local typeValue = Instance.new("StringValue")
    typeValue.Name = "Type"
    typeValue.Value = config.type
    typeValue.Parent = metadata
    
    -- Type-specific setup
    if config.type == "DISPLAY" then
        ContainerModel.setupDisplayContainer(containerPart)
    elseif config.type == "NPC" then
        ContainerModel.setupNPCContainer(containerPart)
    elseif config.type == "MINIGAME" then
        ContainerModel.setupMinigameContainer(containerPart)
    end
    
    return containerPart
end

function ContainerModel.setupDisplayContainer(containerPart)
    -- Add SurfaceGui for display ads
    local surfaceGui = Instance.new("SurfaceGui")
    surfaceGui.Name = "MMLDisplaySurface"
    surfaceGui.Face = Enum.NormalId.Front
    surfaceGui.Parent = containerPart
    
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
end

function ContainerModel.setupNPCContainer(containerPart)
    -- Add ProximityPrompt for NPC interaction
    local prompt = Instance.new("ProximityPrompt")
    prompt.Name = "MMLInteraction"
    prompt.ObjectText = "MML NPC"
    prompt.ActionText = "Interact"
    prompt.RequiresLineOfSight = false
    prompt.Parent = containerPart
end

function ContainerModel.setupMinigameContainer(containerPart)
    -- Add basic minigame setup
    containerPart.Transparency = 0.7
    containerPart.BrickColor = BrickColor.new("Bright green")
    
    local prompt = Instance.new("ProximityPrompt")
    prompt.Name = "MMLMinigame"
    prompt.ObjectText = "MML Minigame"
    prompt.ActionText = "Play"
    prompt.RequiresLineOfSight = false
    prompt.Parent = containerPart
end

return ContainerModel
`
} 