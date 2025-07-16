--[[
    MML Network Container Model
    Handles the creation and setup of individual containers
--]]

local ContainerModel = {}

function ContainerModel.createContainer(config)
    local safeName = config.name:gsub("[^%w]", "_")
    
    -- Create main container part
    local containerPart = Instance.new("Part")
    containerPart.Name = config.id
    containerPart.Size = Vector3.new(10, 5, 0.5)
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
