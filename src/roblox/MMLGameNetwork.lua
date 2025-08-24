--[[
    MML Game Network Module - Enhanced Version
    Version: 2.0.0
    
    Enhanced API for integrating MML ads with multi-ad containers,
    asset pre-loading, and feeding engine integration
--]]

local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Import our new modules (robust to placement: as children of this module or as siblings in ReplicatedStorage)
local function resolveModule(moduleName)
  -- Prefer child ModuleScript
  local child = script:FindFirstChild(moduleName)
  if child then
    return child
  end
  -- Fallback to ReplicatedStorage sibling
  local sibling = ReplicatedStorage:FindFirstChild(moduleName)
  if sibling then
    return sibling
  end
  return nil
end

local function safeRequire(moduleName)
  local mod = resolveModule(moduleName)
  if not mod then
    error("[MML] Missing module: " .. moduleName)
  end
  return require(mod)
end

local MMLAssetStorage = safeRequire("MMLAssetStorage")
local MMLContainerManager = safeRequire("MMLContainerManager")
local MMLContainerStreamer = safeRequire("MMLContainerStreamer")
local MMLRequestManager = safeRequire("MMLRequestManager")
local MMLImpressionTracker = safeRequire("MMLImpressionTracker")
local MMLUtil = safeRequire("MMLUtil")

local MMLNetwork = {
  _initialized = false,
  _containers = {},
  _cache = {},
  _playerAdCache = {},
  _config = {
    baseUrl = "http://23.96.197.67:3000/api/v1",
    updateInterval = 30,
    cacheTimeout = 300,
    enablePositionSync = true,
    enableAssetPreloading = true,
    enableFeedingEngine = true,
    debugMode = false,
    -- Explicit MML game identifier (e.g. "game_90648d31"); if not set, code may fallback to Roblox game.GameId in some places
    gameId = nil,
    
    -- Asset management
    maxPreloadedAds = 50,
    assetCleanupInterval = 600, -- 10 minutes
    
    -- Container management
    maxContainers = 20,
    containerVisibilityBuffer = 20,
    
    -- Performance
    maxConcurrentRequests = 3,
    requestTimeout = 30
  }
}

-- Make MMLNetwork globally accessible for modules
_G.MMLNetwork = MMLNetwork
_G.MMLImpressionTracker = MMLImpressionTracker

-- Initialize the enhanced network module
function MMLNetwork.Initialize(config)
  assert(config.apiKey, "API key is required")
  
  -- Update configuration
  for key, value in pairs(config) do
    if MMLNetwork._config[key] ~= nil then
      MMLNetwork._config[key] = value
    end
  end
  
  MMLNetwork._config.apiKey = config.apiKey
  
  print("🚀 Initializing MML Network v2.0...")
  
  -- Initialize subsystems
  local success = true
  
  -- 1. Initialize Asset Storage
  if MMLNetwork._config.enableAssetPreloading then
    success = success and MMLAssetStorage.initialize()
  end
  
  -- 2. Initialize Container Manager
  success = success and MMLContainerManager.initializeContainersFromWorkspace() >= 0
  
  -- 3. Initialize Request Manager
  if MMLNetwork._config.enableFeedingEngine then
    success = success and MMLRequestManager.initialize()
  end
  
  -- 4. Initialize Container Streamer
  MMLContainerStreamer.startMonitoring()
  
  -- 5. Start rotation monitoring
  MMLContainerManager.startRotationMonitoring()
  
  -- 6. Start position monitoring (if enabled)
  if MMLNetwork._config.enablePositionSync then
    MMLContainerManager.startPositionMonitoring()
  end
  
  if success then
    MMLNetwork._initialized = true
    print("✅ MML Network v2.0 initialized successfully")
    
    -- Start initial data fetching
    spawn(function()
      wait(2) -- Wait for everything to stabilize
      MMLRequestManager.fetchGameAds()
      wait(5)
      MMLRequestManager.fetchContainerAssignments()
    end)
    
  else
    warn("❌ MML Network initialization failed")
  end
  
  return MMLNetwork
end

-- Enhanced container creation with multi-ad support
function MMLNetwork.CreateContainer(containerConfig)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  
  local containerId = containerConfig.id or HttpService:GenerateGUID()
  local containerType = containerConfig.type or "DISPLAY"
  local containerModel = containerConfig.model
  
  if not containerModel then
    warn("❌ Container model is required")
    return nil
  end
  
  -- Initialize container with multi-ad support
  local container = MMLContainerManager.initializeContainer(containerId, containerModel, containerType)
  
  if container then
    -- Set container configuration
    if containerConfig.config then
      MMLContainerManager.setContainerConfig(containerId, containerConfig.config)
    end
    
    print("🆕 Created container:", containerId, "Type:", containerType)
    return containerId
  end
  
  return nil
end

-- Get container content (enhanced for multi-ad)
function MMLNetwork.GetContainerContent(containerId)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  
  local container = MMLNetwork._containers[containerId]
  if not container then
    warn("❌ Container not found:", containerId)
    return nil
  end
  
  -- Return current ad info
  if container.adRotation.currentAdId then
    local preloadedAd = MMLAssetStorage.getPreloadedAd(container.adRotation.currentAdId)
    if preloadedAd then
      return {
        hasAd = true,
        adId = container.adRotation.currentAdId,
        adType = container.type,
        assets = preloadedAd.assets,
        position = MMLUtil.getInstancePosition(container.model),
        isVisible = container.visibility.shouldBeVisible
      }
    end
  end
  
  return {
    hasAd = false,
    adId = nil,
    adType = container.type,
    assets = {},
    position = MMLUtil.getInstancePosition(container.model),
    isVisible = false
  }
end

-- Force container to display specific ad (for testing)
function MMLNetwork.DisplayAdInContainer(containerId, adId)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  
  if not MMLAssetStorage.isAdPreloaded(adId) then
    warn("❌ Ad not pre-loaded:", adId)
    return false
  end
  
  return MMLContainerStreamer.forceDisplayAd(containerId, adId)
end

-- Force container to hide current ad
function MMLNetwork.HideContainerAd(containerId)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  return MMLContainerStreamer.forceHideAd(containerId)
end

-- Rotate container to next ad
function MMLNetwork.RotateContainerAd(containerId)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  return MMLContainerManager.rotateToNextAd(containerId)
end

-- Update container with available ads
function MMLNetwork.UpdateContainerAds(containerId, adIds)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  return MMLContainerManager.updateContainerAds(containerId, adIds)
end

-- Record impression for analytics
function MMLNetwork.RecordImpression(containerId, eventType, eventData)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  
  local container = MMLNetwork._containers[containerId]
  if not container then return false end
  
  local impressionData = {
    containerId = containerId,
    adId = container.adRotation.currentAdId,
    eventType = eventType,
    eventData = eventData or {},
    timestamp = tick(),
    gameId = tostring(game.GameId),
    placeId = tostring(game.PlaceId)
  }
  
  -- Queue impression for batched sending
  MMLRequestManager.queueImpression(impressionData)
  
  -- Update container metrics
  MMLContainerManager.updateContainerMetrics(containerId, impressionData, eventData.engagement)
  
  return true
end

-- Get system statistics
function MMLNetwork.GetSystemStats()
  if not MMLNetwork._initialized then
    return { initialized = false }
  end
  
  return {
    initialized = true,
    version = "2.0.0",
    containers = {
      total = 0, -- Will be calculated
      visible = 0,
      withAds = 0
    },
    assetStorage = MMLAssetStorage.getStorageStats(),
    requestManager = MMLRequestManager.getRequestStats(),
    containerStreamer = MMLContainerStreamer.getMovementStats()
  }
end

-- Helper function for API requests (updated)
local function makeRequest(method, endpoint, body)
  assert(MMLNetwork._initialized, "MML Network not initialized")
  
  local success, result = pcall(function()
    local requestConfig = {
      Url = MMLNetwork._config.baseUrl .. endpoint,
      Method = method,
      Headers = {
        ["X-API-Key"] = MMLNetwork._config.apiKey,
        ["Content-Type"] = "application/json"
      }
    }
    
    if body then
      requestConfig.Body = HttpService:JSONEncode(body)
    end
    
    return HttpService:RequestAsync(requestConfig)
  end)
  
  if success and result.Success then
    return true, HttpService:JSONDecode(result.Body)
  else
    local errorMsg = result and result.StatusMessage or "Request failed"
    warn("❌ API Request failed:", errorMsg)
    return false, errorMsg
  end
end

-- Container positioning sync (enhanced)
function MMLNetwork.syncContainerPosition(containerId, position)
  if not MMLNetwork._config.enablePositionSync then
    return false
  end
  
  local container = MMLNetwork._containers[containerId]
  if not container then
    warn("❌ Container not found for position sync:", containerId)
    return false
  end
  
  local success, response = makeRequest("PUT", "/containers/" .. containerId .. "/position", {
    position = {
      x = position.X,
      y = position.Y,
      z = position.Z
    },
    timestamp = tick()
  })
  
  if success then
    print("📍 Synced position for container:", containerId)
    return true
  else
    warn("❌ Failed to sync position for container:", containerId, response)
    return false
  end
end

-- Get all container summaries for feeding engine
function MMLNetwork.getContainerSummaries()
  return MMLContainerManager.getAllContainerSummaries()
end

-- Get player context for feeding engine
function MMLNetwork.getPlayerContext()
  local Players = game:GetService("Players")
  
  return {
    totalPlayers = #Players:GetPlayers(),
    serverRegion = game:GetService("LocalizationService").RobloxLocaleId,
    gameTime = workspace.DistributedGameTime,
    timestamp = tick()
  }
end

-- Get active container IDs
function MMLNetwork.getActiveContainerIds()
  local containerIds = {}
  for containerId, _ in pairs(MMLNetwork._containers) do
    table.insert(containerIds, containerId)
  end
  return containerIds
end

-- Manual refresh functions
function MMLNetwork.RefreshGameAds()
  if MMLRequestManager then
    return MMLRequestManager.refreshGameAds()
  end
  return false
end

function MMLNetwork.RefreshContainerAssignments()
  if MMLRequestManager then
    return MMLRequestManager.refreshContainerAssignments()
  end
  return false
end

-- Manual position sync functions
function MMLNetwork.SyncContainerPosition(containerId)
  if not MMLNetwork._containers[containerId] then
    warn("❌ Container not found:", containerId)
    return false
  end
  
  local container = MMLNetwork._containers[containerId]
  if container.model and container.model.Parent then
    return MMLNetwork.syncContainerPosition(containerId, MMLUtil.getInstancePosition(container.model))
  end
  
  return false
end

function MMLNetwork.SyncAllPositions()
  return MMLContainerManager.syncAllPositions()
end

function MMLNetwork.startContainerMonitoring()
  -- Start all monitoring systems
  MMLContainerStreamer.startMonitoring()
  MMLContainerManager.startRotationMonitoring()
  
  if MMLNetwork._config.enablePositionSync then
    MMLContainerManager.startPositionMonitoring()
  end
  
  return true
end

-- Debug functions
function MMLNetwork.EnableDebugMode()
  MMLNetwork._config.debugMode = true
  print("🔍 Debug mode enabled")
end

function MMLNetwork.DisableDebugMode()
  MMLNetwork._config.debugMode = false
  print("🔍 Debug mode disabled")
end

function MMLNetwork.PrintSystemStatus()
  if not MMLNetwork._initialized then
    print("❌ MML Network not initialized")
    return
  end
  
  print("=== MML Network System Status ===")
  print("Version: 2.0.0")
  print("Initialized:", MMLNetwork._initialized)
  print("Containers:", #MMLNetwork._containers)
  
  local stats = MMLNetwork.GetSystemStats()
  print("Asset Storage:", stats.assetStorage.isInitialized and "✅" or "❌")
  print("Request Manager:", stats.requestManager and "✅" or "❌")
  print("Container Streamer:", stats.containerStreamer.isMonitoring and "✅" or "❌")
  print("===============================")
end

-- Cleanup and shutdown
function MMLNetwork.Shutdown()
  if not MMLNetwork._initialized then
    return
  end
  
  print("🔴 Shutting down MML Network...")
  
  -- Shutdown subsystems
  if MMLAssetStorage then
    MMLAssetStorage.shutdown()
  end
  
  if MMLContainerManager then
    MMLContainerManager.shutdown()
  end
  
  if MMLContainerStreamer then
    MMLContainerStreamer.shutdown()
  end
  
  if MMLRequestManager then
    MMLRequestManager.shutdown()
  end
  
  -- Clear state
  MMLNetwork._initialized = false
  MMLNetwork._containers = {}
  MMLNetwork._cache = {}
  MMLNetwork._playerAdCache = {}
  
  _G.MMLNetwork = nil
  
  print("✅ MML Network shutdown complete")
end

-- Backward compatibility functions
function MMLNetwork.CreateDisplayAd(adData)
  warn("⚠️ CreateDisplayAd is deprecated. Use CreateContainer instead.")
  return MMLNetwork.CreateContainer({
    type = "DISPLAY",
    model = adData.model,
    config = adData.config
  })
end

function MMLNetwork.CreateNPCAd(adData)
  warn("⚠️ CreateNPCAd is deprecated. Use CreateContainer instead.")
  return MMLNetwork.CreateContainer({
    type = "NPC",
    model = adData.model,
    config = adData.config
  })
end

function MMLNetwork.CreateMinigameAd(adData)
  warn("⚠️ CreateMinigameAd is deprecated. Use CreateContainer instead.")
  return MMLNetwork.CreateContainer({
    type = "MINIGAME",
    model = adData.model,
    config = adData.config
  })
end

return MMLNetwork 