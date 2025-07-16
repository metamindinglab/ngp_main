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
    baseUrl = "http://localhost:3000/api/v1",
    updateInterval = 5,
    cacheTimeout = 300,
    enablePositionSync = true
  }
}

-- Initialize the network module
function MMLNetwork.Initialize(config)
  assert(config.apiKey, "API key is required")
  
  MMLNetwork._config = {
    baseUrl = config.baseUrl or MMLNetwork._config.baseUrl,
    apiKey = config.apiKey,
    updateInterval = config.updateInterval or MMLNetwork._config.updateInterval,
    cacheTimeout = config.cacheTimeout or MMLNetwork._config.cacheTimeout,
    enablePositionSync = config.enablePositionSync ~= false -- Default to true unless explicitly set to false
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

-- Position synchronization function
local function syncContainerPosition(containerId, instance)
  local currentPosition = instance.Position
  local position = {
    x = currentPosition.X,
    y = currentPosition.Y,
    z = currentPosition.Z
  }
  
  local success, result = pcall(function()
    local response = HttpService:RequestAsync({
      Url = MMLNetwork._config.baseUrl .. "/containers/" .. containerId .. "/position",
      Method = "PUT",
      Headers = {
        ["X-API-Key"] = MMLNetwork._config.apiKey,
        ["Content-Type"] = "application/json"
      },
      Body = HttpService:JSONEncode({
        position = position
      })
    })
    
    if response.Success then
      print("[MMLNetwork] Position synced for container:", containerId, "->", position.x, position.y, position.z)
      return HttpService:JSONDecode(response.Body)
    else
      warn("[MMLNetwork] Failed to sync position for container:", containerId, "Status:", response.StatusCode)
    end
    return nil
  end)
  
  if not success then
    warn("[MMLNetwork] Error syncing position:", result)
  end
  
  return success, result
end

-- Auto-sync position when container is moved
local function setupPositionTracking(containerId, instance)
  if not MMLNetwork._config.enablePositionSync then
    return
  end
  
  local lastPosition = instance.Position
  local lastSyncTime = 0
  local SYNC_COOLDOWN = 5 -- Minimum 5 seconds between syncs
  
  spawn(function()
    while instance and instance.Parent do
      wait(1) -- Check every second
      
      local currentPosition = instance.Position
      local positionChanged = (currentPosition - lastPosition).Magnitude > 0.1 -- Threshold of 0.1 studs
      local timeSinceLastSync = tick() - lastSyncTime
      
      if positionChanged and timeSinceLastSync >= SYNC_COOLDOWN then
        syncContainerPosition(containerId, instance)
        lastPosition = currentPosition
        lastSyncTime = tick()
      end
    end
  end)
end

-- Manual position sync function (can be called by developers)
function MMLNetwork.SyncContainerPosition(containerId)
  local container = MMLNetwork._containers[containerId]
  if container and container.instance then
    return syncContainerPosition(containerId, container.instance)
  else
    warn("[MMLNetwork] Container not found:", containerId)
    return false
  end
end

-- Sync all container positions
function MMLNetwork.SyncAllPositions()
  local results = {}
  for containerId, container in pairs(MMLNetwork._containers) do
    if container.instance then
      local success, result = syncContainerPosition(containerId, container.instance)
      results[containerId] = { success = success, result = result }
    end
  end
  return results
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
  setupPositionTracking(container.id, billboard) -- Setup position tracking
  
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
  setupPositionTracking(container.id, rootPart) -- Setup position tracking
  
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
  setupPositionTracking(container.id, part) -- Setup position tracking
  
  -- Store container
  MMLNetwork._containers[config.containerId] = container
  
  return container
end

return MMLNetwork 