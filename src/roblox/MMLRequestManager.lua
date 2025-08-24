-- src/roblox/MMLRequestManager.lua
-- Enhanced Request Manager with Feeding Engine Integration
-- Handles optimized HTTP requests for container assignments and asset management

local MMLRequestManager = {}

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local RunService = game:GetService("RunService")

-- Request batching system
local requestBatches = {
    gameAds = {
        lastFetch = 0,
        interval = 300,        -- 5 minutes
        cache = nil
    },
    containerAssignments = {
        lastFetch = 0,
        interval = 120,        -- 2 minutes (more frequent for feeding engine)
        cache = nil
    },
    playerEligibility = {
        queue = {},
        lastBatch = 0,
        interval = 30,         -- 30 seconds
        batchSize = 10
    },
    impressions = {
        queue = {},
        lastBatch = 0,
        interval = 5,          -- send quickly for testing
        batchSize = 1          -- flush each event chunk
    }
}

-- Forward declarations for helpers
local getPlayerContext
local getCurrentAssignments
local getActiveContainerIds

-- Resolve the MML game id used by server APIs
local function getMmlGameId()
    if _G.MMLNetwork and _G.MMLNetwork._config then
        -- Prefer explicit string MML game id if provided
        local gid = _G.MMLNetwork._config.gameId
        if type(gid) == "string" and #gid > 0 then
            return gid
        end
        -- Fallback to ServerStorage MMLConfig if present
        local ss = game:GetService("ServerStorage")
        local cfg = ss:FindFirstChild("MMLConfig")
        if cfg and cfg:IsA("ModuleScript") then
            local ok, data = pcall(function() return require(cfg) end)
            if ok and type(data) == "table" and type(data.gameId) == "string" and #data.gameId > 0 then
                _G.MMLNetwork._config.gameId = data.gameId
                return data.gameId
            end
        end
    end
    -- Last resort: Roblox numeric GameId (may not match MML id)
    return tostring(game.GameId)
end

-- 1. Fetch all available game ads (every 5 minutes)
function MMLRequestManager.fetchGameAds()
    if not _G.MMLNetwork or not _G.MMLNetwork._config then
        warn("❌ MMLNetwork not initialized")
        return {}
    end
    -- Guard: server-only HTTP
    if not RunService:IsServer() then
        warn("⚠️ fetchGameAds called on client; skipping (server handles HTTP)")
        return _G.MMLNetwork._requestCache and (_G.MMLNetwork._requestCache.gameAds or {}) or {}
    end
    
    local currentTime = tick()
    local batch = requestBatches.gameAds
    
    if batch.cache and (currentTime - batch.lastFetch) < batch.interval then
        return batch.cache -- Return cached data
    end
    
    spawn(function()
        local success, result = pcall(function()
            local gid = getMmlGameId()
            local url = _G.MMLNetwork._config.baseUrl .. "/games/" .. gid .. "/ads/available"
            print("[MML][HTTP] GET available ads:", url)
            return HttpService:RequestAsync({
                Url = url,
                Method = "GET",
                Headers = {
                    ["X-API-Key"] = _G.MMLNetwork._config.apiKey
                }
            })
        end)
        
        if success and result.Success then
            local data = {}
            if result.Body and #result.Body > 0 then
                local ok, parsed = pcall(function() return HttpService:JSONDecode(result.Body) end)
                if ok then data = parsed else data = {} end
            end
            batch.cache = data.ads or {}
            batch.lastFetch = currentTime
            
            print("📦 Updated game ads cache:", #batch.cache, "ads available")
            
            -- Pre-load all available ads
            local MMLAssetStorage = require(script.Parent.MMLAssetStorage)
            if MMLAssetStorage then
                MMLAssetStorage.preloadAllGameAds(batch.cache)
            end
            
        else
            warn("❌ Failed to fetch game ads:", result and result.StatusMessage or "Unknown error")
        end
    end)
    
    return batch.cache or {}
end

-- 2. Fetch container assignments from feeding engine
function MMLRequestManager.fetchContainerAssignments()
    if not _G.MMLNetwork or not _G.MMLNetwork._config then
        warn("❌ MMLNetwork not initialized")
        return false
    end
    -- Guard: server-only HTTP
    if not RunService:IsServer() then
        warn("⚠️ fetchContainerAssignments called on client; skipping (server handles HTTP)")
        return false
    end
    
    local currentTime = tick()
    local batch = requestBatches.containerAssignments
    
    if batch.cache and (currentTime - batch.lastFetch) < batch.interval then
        return true -- Use cached assignments
    end
    
    local ok, MMLContainerManager = pcall(function()
        return require(script.Parent.MMLContainerManager)
    end)
    if not ok or not MMLContainerManager or type(MMLContainerManager.getAllContainerSummaries) ~= "function" then
        warn("❌ MMLContainerManager unavailable or missing getAllContainerSummaries; skipping assignment fetch")
        return false
    end
    local containers = MMLContainerManager.getAllContainerSummaries()
    local playerContext = getPlayerContext and getPlayerContext() or {}
    
    spawn(function()
        local success, result = pcall(function()
            local url = _G.MMLNetwork._config.baseUrl .. "/feeding/container-ads"
            print("[MML][HTTP] POST container-ads:", url, "gameId:", getMmlGameId())
            return HttpService:RequestAsync({
                Url = url,
                Method = "POST",
                Headers = {
                    ["X-API-Key"] = _G.MMLNetwork._config.apiKey,
                    ["Content-Type"] = "application/json"
                },
                Body = HttpService:JSONEncode({
                    gameId = getMmlGameId(),
                    containers = containers,
                    playerContext = playerContext,
                    currentAssignments = getCurrentAssignments and getCurrentAssignments() or {}
                })
            })
        end)
        
        if success and result.Success then
            local data = {}
            if result.Body and #result.Body > 0 then
                local ok, parsed = pcall(function() return HttpService:JSONDecode(result.Body) end)
                if ok then data = parsed else data = {} end
            end
            batch.cache = data
            batch.lastFetch = currentTime
            
            -- Update container assignments based on feeding engine response
            if data.containerAssignments then
                for containerId, adIds in pairs(data.containerAssignments) do
                    MMLContainerManager.updateContainerAds(containerId, adIds)
                    
                    -- Update rotation schedule if provided
                    if data.rotationSchedule and data.rotationSchedule[containerId] then
                        MMLContainerManager.updateContainerRotationSchedule(containerId, data.rotationSchedule[containerId])
                    end
                end
            end
            
            print("🎯 Updated container assignments from feeding engine:", 
                  "Total containers:", #containers,
                  "Strategy:", data.metadata and data.metadata.strategy or "unknown")
                  
        else
            warn("❌ Failed to fetch container assignments:", result and result.StatusMessage or "Unknown error")
            if result then
                warn("Status:", result.StatusCode)
                if result.Body then
                    warn("Body:", string.sub(result.Body, 1, 200))
                end
            end
        end
    end)
    
    return true
end

-- 3. Batch player eligibility requests
function MMLRequestManager.queuePlayerEligibilityCheck(player)
    local playerData = {
        playerId = tostring(player.UserId),
        playerName = player.Name,
        country = player:GetAttribute("Country") or "US",
        joinTime = tick(),
        sessionId = player:GetAttribute("SessionId") or HttpService:GenerateGUID()
    }
    
    table.insert(requestBatches.playerEligibility.queue, playerData)
    
    -- Process batch if queue is full or timeout reached
    local batch = requestBatches.playerEligibility
    if #batch.queue >= batch.batchSize or (tick() - batch.lastBatch) > batch.interval then
        MMLRequestManager.processPlayerEligibilityBatch()
    end
end

function MMLRequestManager.processPlayerEligibilityBatch()
    if not _G.MMLNetwork or not _G.MMLNetwork._config then
        return
    end
    
    local batch = requestBatches.playerEligibility
    if #batch.queue == 0 then return end
    
    local playersToProcess = {}
    for i = 1, math.min(#batch.queue, batch.batchSize) do
        table.insert(playersToProcess, table.remove(batch.queue, 1))
    end
    
    batch.lastBatch = tick()
    
    spawn(function()
        local success, result = pcall(function()
            return HttpService:RequestAsync({
                Url = _G.MMLNetwork._config.baseUrl .. "/ads/player-eligibility-batch",
                Method = "POST",
                Headers = {
                    ["X-API-Key"] = _G.MMLNetwork._config.apiKey,
                    ["Content-Type"] = "application/json"
                },
                Body = HttpService:JSONEncode({
                    players = playersToProcess,
                    gameId = tostring(game.GameId),
                    placeId = tostring(game.PlaceId),
                    activeContainers = getActiveContainerIds()
                })
            })
        end)
        
        if success and result.Success then
            local data = HttpService:JSONDecode(result.Body)
            
            -- Cache and distribute player-specific ad assignments
            if data.playerAssignments then
                for playerId, eligibleAds in pairs(data.playerAssignments) do
                    if not _G.MMLNetwork._playerAdCache then
                        _G.MMLNetwork._playerAdCache = {}
                    end
                    
                    _G.MMLNetwork._playerAdCache[playerId] = {
                        ads = eligibleAds,
                        lastUpdate = tick(),
                        expiresAt = tick() + 600 -- 10 minutes
                    }
                    
                    -- Notify client of eligible ads if they have a RemoteEvent set up
                    local player = Players:GetPlayerByUserId(tonumber(playerId))
                    if player then
                        local clientRemote = game.ReplicatedStorage:FindFirstChild("MMLPlayerAds")
                        if clientRemote and clientRemote:IsA("RemoteEvent") then
                            clientRemote:FireClient(player, eligibleAds)
                        end
                    end
                end
            end
            
            print("✅ Processed eligibility for", #playersToProcess, "players")
        else
            warn("❌ Failed to process player eligibility batch:", result and result.StatusMessage or "Unknown error")
        end
    end)
end

-- 4. Batch impression reporting (every 60 seconds)
function MMLRequestManager.queueImpression(impressionData)
    table.insert(requestBatches.impressions.queue, impressionData)
    
    local batch = requestBatches.impressions
    if #batch.queue >= batch.batchSize or (tick() - batch.lastBatch) > batch.interval then
        MMLRequestManager.sendImpressionBatch()
    end
end

function MMLRequestManager.sendImpressionBatch()
    if not _G.MMLNetwork or not _G.MMLNetwork._config then
        return
    end
    
    local batch = requestBatches.impressions
    if #batch.queue == 0 then return end
    
    local impressionsToSend = {}
    for i = 1, math.min(#batch.queue, batch.batchSize) do
        table.insert(impressionsToSend, table.remove(batch.queue, 1))
    end
    
    batch.lastBatch = tick()
    
    spawn(function()
        local payload = {
            impressions = impressionsToSend,
            batchId = HttpService:GenerateGUID(),
            gameSession = game:GetAttribute("SessionId") or HttpService:GenerateGUID(),
            serverTimestamp = tick()
        }
        local success, result = pcall(function()
            return HttpService:RequestAsync({
                Url = _G.MMLNetwork._config.baseUrl .. "/impressions/batch",
                Method = "POST", 
                Headers = {
                    ["X-API-Key"] = _G.MMLNetwork._config.apiKey,
                    ["Content-Type"] = "application/json"
                },
                Body = HttpService:JSONEncode(payload)
            })
        end)
        if success and result.Success then
            print("📤 Sent batch of", #impressionsToSend, "events to GameAdPerformance")
            if result.Body then
                local ok, parsed = pcall(function() return HttpService:JSONDecode(result.Body) end)
                if ok and parsed and parsed.processed then
                    print("✅ Server processed:", parsed.processed, "upserts:", parsed.upserts)
                end
            end
        else
            warn("❌ Failed to send impression batch:", result and result.StatusMessage or "Unknown error")
            if result then
                warn("Status:", result.StatusCode)
                if result.Body then
                    warn("Body:", string.sub(result.Body, 1, 200))
                end
            end
            if #requestBatches.impressions.queue < 200 then
                for _, ev in pairs(impressionsToSend) do
                    table.insert(requestBatches.impressions.queue, ev)
                end
            end
        end
    end)
end

-- Helper functions
local function getPlayerContext()
    local context = {
        totalPlayers = #Players:GetPlayers(),
        serverRegion = game:GetService("LocalizationService").RobloxLocaleId,
        gameTime = workspace.DistributedGameTime,
        timestamp = tick()
    }
    
    -- Add player demographics if available
    local demographics = {}
    for _, player in pairs(Players:GetPlayers()) do
        local country = player:GetAttribute("Country") or "Unknown"
        demographics[country] = (demographics[country] or 0) + 1
    end
    context.demographics = demographics
    
    return context
end

local function getCurrentAssignments()
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return {}
    end
    
    local assignments = {}
    
    for containerId, container in pairs(_G.MMLNetwork._containers) do
        assignments[containerId] = {
            currentAdId = container.adRotation.currentAdId,
            availableAds = container.adRotation.availableAds,
            metrics = {
                totalImpressions = container.metrics.totalImpressions,
                impressionsByAd = container.metrics.impressionsByAd,
                performanceScores = container.adRotation.performanceScores
            }
        }
    end
    
    return assignments
end

local function getActiveContainerIds()
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return {}
    end
    
    local containerIds = {}
    for containerId, _ in pairs(_G.MMLNetwork._containers) do
        table.insert(containerIds, containerId)
    end
    
    return containerIds
end

-- Auto-start request management
function MMLRequestManager.initialize()
    if not _G.MMLNetwork then
        warn("❌ MMLNetwork not initialized, cannot start request manager")
        return false
    end
    
    -- Start periodic game ads fetching
    spawn(function()
        while _G.MMLNetwork do
            MMLRequestManager.fetchGameAds()
            wait(requestBatches.gameAds.interval)
        end
    end)
    
    -- Start periodic container assignment fetching
    spawn(function()
        while _G.MMLNetwork do
            -- Warm start: fetch immediately, then on interval
            MMLRequestManager.fetchContainerAssignments()
            wait(requestBatches.containerAssignments.interval)
        end
    end)
    
    -- Start periodic batch processing
    spawn(function()
        while _G.MMLNetwork do
            wait(30) -- Check every 30 seconds
            
            -- Process any pending batches
            if #requestBatches.playerEligibility.queue > 0 then
                MMLRequestManager.processPlayerEligibilityBatch()
            end
            
            if #requestBatches.impressions.queue > 0 then
                print("[MML][Impression] Pending queue:", #requestBatches.impressions.queue)
                MMLRequestManager.sendImpressionBatch()
            end
        end
    end)
    
    print("🚀 MML Request Manager initialized")
    return true
end

-- Manual refresh functions
function MMLRequestManager.refreshGameAds()
    requestBatches.gameAds.lastFetch = 0  -- Force refresh
    return MMLRequestManager.fetchGameAds()
end

function MMLRequestManager.refreshContainerAssignments()
    requestBatches.containerAssignments.lastFetch = 0  -- Force refresh
    return MMLRequestManager.fetchContainerAssignments()
end

-- Get request statistics
function MMLRequestManager.getRequestStats()
    return {
        gameAds = {
            lastFetch = requestBatches.gameAds.lastFetch,
            cacheSize = requestBatches.gameAds.cache and #requestBatches.gameAds.cache or 0
        },
        containerAssignments = {
            lastFetch = requestBatches.containerAssignments.lastFetch,
            hasCache = requestBatches.containerAssignments.cache ~= nil
        },
        playerEligibility = {
            queueSize = #requestBatches.playerEligibility.queue,
            lastBatch = requestBatches.playerEligibility.lastBatch
        },
        impressions = {
            queueSize = #requestBatches.impressions.queue,
            lastBatch = requestBatches.impressions.lastBatch
        }
    }
end

-- Shutdown request manager
function MMLRequestManager.shutdown()
    -- Clear all queues
    requestBatches.playerEligibility.queue = {}
    requestBatches.impressions.queue = {}
    requestBatches.gameAds.cache = nil
    requestBatches.containerAssignments.cache = nil
    
    print("🔴 MML Request Manager shutdown")
end

return MMLRequestManager 