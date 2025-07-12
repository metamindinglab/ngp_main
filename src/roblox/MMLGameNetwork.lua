--[[
    MML Game Network Module
    Version: 1.0.0
    
    Simple API for integrating MML ads into Roblox games
--]]

local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")

local MMLNetwork = {
  _initialized = false,
  _containers = {},
  _cache = {},
  _config = {
    baseUrl = "https://api.mml.com/v1",
    updateInterval = 5,
    cacheTimeout = 300
  }
}

-- Initialize the network module
function MMLNetwork.Initialize(config)
  assert(config.apiKey, "API key is required")
  
  MMLNetwork._config = {
    baseUrl = config.baseUrl or MMLNetwork._config.baseUrl,
    apiKey = config.apiKey,
    updateInterval = config.updateInterval or MMLNetwork._config.updateInterval,
    cacheTimeout = config.cacheTimeout or MMLNetwork._config.cacheTimeout
  }
  
  MMLNetwork._initialized = true
  return MMLNetwork
end

-- Helper function for API requests
local function makeRequest(method, endpoint)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  
  local success, result = pcall(function()
    local response = game:GetService("HttpService"):RequestAsync({
      Url = MMLNetwork._config.baseUrl .. endpoint,
      Method = method,
      Headers = {
        ["Authorization"] = "Bearer " .. MMLNetwork._config.apiKey,
        ["Content-Type"] = "application/json"
      }
    })
    
    if response.Success then
      return game:GetService("HttpService"):JSONDecode(response.Body)
    end
    return nil
  end)
  
  return success, result
end

-- Helper function for engagement tracking
local function setupAdTracking(container, instance)
  spawn(function()
    local Players = game:GetService("Players")
    
    -- Track views
    local function onPlayerAdded(player)
      local function checkVisibility()
        local character = player.Character
        if character then
          local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
          if humanoidRootPart then
            local distance = (humanoidRootPart.Position - instance.Position).Magnitude
            if distance <= 50 then -- View distance threshold
              makeRequest("POST", "/containers/" .. container.id .. "/engagement", {
                eventType = "view",
                data = {
                  playerId = player.UserId,
                  distance = distance,
                  timestamp = os.time()
                }
              })
            end
          end
        end
      end
      
      spawn(function()
        while wait(5) do -- Check every 5 seconds
          checkVisibility()
        end
      end)
    end
    
    Players.PlayerAdded:Connect(onPlayerAdded)
    for _, player in ipairs(Players:GetPlayers()) do
      onPlayerAdded(player)
    end
  end)
end

-- Create a display ad (billboard)
function MMLNetwork.CreateDisplayAd(config)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  assert(config.containerId, "Container ID required")
  assert(config.position, "Position required")
  assert(config.size, "Size required")
  
  -- Create billboard
  local billboard = Instance.new("Part")
  billboard.Anchored = true
  billboard.Position = config.position
  billboard.Size = Vector3.new(config.size.width, config.size.height, 0.1)
  billboard.Transparency = 0.1
  
  local surfaceGui = Instance.new("SurfaceGui")
  surfaceGui.Face = Enum.NormalId.Front
  surfaceGui.Parent = billboard
  
  local frame = Instance.new("Frame")
  frame.BackgroundTransparency = 0
  frame.Size = UDim2.new(1, 0, 1, 0)
  frame.Parent = surfaceGui
  
  billboard.Parent = workspace
  
  -- Create container object
  local container = {
    id = config.containerId,
    type = "display",
    instance = billboard,
    surfaceGui = surfaceGui,
    frame = frame,
    currentAd = nil
  }
  
  -- Setup update loop
  spawn(function()
    while wait(MMLNetwork._config.updateInterval) do
      local success, data = makeRequest("GET", "/containers/" .. container.id .. "/ad")
      if success and data.hasAd then
        -- Update billboard content
        if data.adType == "DISPLAY" then
          for _, asset in ipairs(data.assets) do
            if asset.type == "image" then
              local imageLabel = Instance.new("ImageLabel")
              imageLabel.Size = UDim2.new(1, 0, 1, 0)
              imageLabel.Image = asset.robloxAssetId
              
              -- Clear existing content
              for _, child in ipairs(frame:GetChildren()) do
                child:Destroy()
              end
              
              imageLabel.Parent = frame
            end
          end
        end
      end
    end
  end)
  
  -- Setup tracking
  setupAdTracking(container, billboard)
  
  -- Store container
  MMLNetwork._containers[config.containerId] = container
  
  return container
end

-- Create an NPC ad
function MMLNetwork.CreateNPCAd(config)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  assert(config.containerId, "Container ID required")
  assert(config.position, "Position required")
  
  -- Create NPC model
  local model = Instance.new("Model")
  local humanoid = Instance.new("Humanoid")
  humanoid.Parent = model
  
  local rootPart = Instance.new("Part")
  rootPart.Name = "HumanoidRootPart"
  rootPart.Anchored = true
  rootPart.Position = config.position
  rootPart.Parent = model
  
  model.Parent = workspace
  
  -- Create container object
  local container = {
    id = config.containerId,
    type = "npc",
    instance = model,
    humanoid = humanoid,
    currentAd = nil,
    OnInteraction = Instance.new("BindableEvent")
  }
  
  -- Setup interaction detection
  local proximityPrompt = Instance.new("ProximityPrompt")
  proximityPrompt.ObjectText = "Talk"
  proximityPrompt.ActionText = "Press E"
  proximityPrompt.Parent = rootPart
  
  proximityPrompt.Triggered:Connect(function(player)
    container.OnInteraction:Fire(player)
    makeRequest("POST", "/containers/" .. container.id .. "/engagement", {
      eventType = "interaction",
      data = {
        playerId = player.UserId,
        type = "talk",
        timestamp = os.time()
      }
    })
  end)
  
  -- Setup update loop
  spawn(function()
    while wait(MMLNetwork._config.updateInterval) do
      local success, data = makeRequest("GET", "/containers/" .. container.id .. "/ad")
      if success and data.hasAd then
        -- Update NPC appearance and behavior
        if data.adType == "NPC" then
          for _, asset in ipairs(data.assets) do
            if asset.type == "character" then
              -- Load character appearance
              local success = pcall(function()
                game:GetService("InsertService"):LoadAsset(asset.robloxAssetId):GetChildren()[1]:Clone().Parent = model
              end)
            elseif asset.type == "animation" then
              -- Load animations
              local success = pcall(function()
                local animator = humanoid:FindFirstChildOfClass("Animator") or Instance.new("Animator", humanoid)
                local animation = Instance.new("Animation")
                animation.AnimationId = asset.robloxAssetId
                animator:LoadAnimation(animation):Play()
              end)
            end
          end
        end
      end
    end
  end)
  
  -- Setup tracking
  setupAdTracking(container, rootPart)
  
  -- Store container
  MMLNetwork._containers[config.containerId] = container
  
  return container
end

-- Create a minigame ad
function MMLNetwork.CreateMinigameAd(config)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  assert(config.containerId, "Container ID required")
  assert(config.position, "Position required")
  assert(config.size, "Size required")
  
  -- Create minigame area
  local model = Instance.new("Model")
  local part = Instance.new("Part")
  part.Anchored = true
  part.Position = config.position
  part.Size = Vector3.new(config.size.width, config.size.height, config.size.depth)
  part.Transparency = 0.8
  part.Parent = model
  
  model.Parent = workspace
  
  -- Create container object
  local container = {
    id = config.containerId,
    type = "minigame",
    instance = model,
    currentAd = nil,
    OnComplete = Instance.new("BindableEvent")
  }
  
  -- Setup update loop
  spawn(function()
    while wait(MMLNetwork._config.updateInterval) do
      local success, data = makeRequest("GET", "/containers/" .. container.id .. "/ad")
      if success and data.hasAd then
        -- Update minigame content
        if data.adType == "MINIGAME" then
          for _, asset in ipairs(data.assets) do
            if asset.type == "minigame" then
              -- Load minigame module
              local success = pcall(function()
                local minigame = require(asset.moduleId)
                minigame.Initialize(model, container)
              end)
            end
          end
        end
      end
    end
  end)
  
  -- Setup tracking
  setupAdTracking(container, part)
  
  -- Store container
  MMLNetwork._containers[config.containerId] = container
  
  return container
end

return MMLNetwork 