-- src/roblox/MMLContainerManager.lua
-- Enhanced Container Manager for Multi-Ad Support
-- Manages containers with rotation, metrics, and feeding engine integration

local MMLContainerManager = {}
local MMLUtil = require(script.Parent.MMLUtil)

-- Forward declarations for functions used before definition
local selectNextAd
local selectWeightedAd
local selectPerformanceBasedAd

-- Helper: collect all currently displayed adIds across containers
local function getCurrentAdIds()
    local used = {}
    if _G.MMLNetwork and _G.MMLNetwork._containers then
        for _, other in pairs(_G.MMLNetwork._containers) do
            local aid = other and other.adRotation and other.adRotation.currentAdId
            if aid then used[aid] = true end
        end
    end
    return used
end

-- Helper: if selection duplicates another container and there are alternatives, pick a different one
local function avoidDuplicateSelection(chosenAdId, container)
    local availableAds = container.adRotation.availableAds or {}
    if #availableAds <= 1 then
        return chosenAdId
    end
    local used = getCurrentAdIds()
    -- If chosen is unique or no conflicts, keep it
    if not used[chosenAdId] then
        return chosenAdId
    end
    -- Try to pick any ad not currently displayed by other containers
    local candidates = {}
    for _, aid in ipairs(availableAds) do
        if not used[aid] then table.insert(candidates, aid) end
    end
    if #candidates > 0 then
        -- Randomly choose among non-duplicates for better distribution
        local idx = math.random(1, #candidates)
        return candidates[idx]
    end
    -- All are in use; fall back to the originally chosen id
    return chosenAdId
end

-- Initialize a container with multi-ad support
function MMLContainerManager.initializeContainer(containerId, containerModel, containerType)
    local container = {
        id = containerId,
        type = containerType,
        model = containerModel,
        
        -- Multi-ad rotation system
        adRotation = {
            availableAds = {},           -- Array of available ad IDs
            currentAdId = nil,           -- Currently displayed ad
            currentAdIndex = 1,          -- Index in availableAds array
            lastRotation = 0,            -- Timestamp of last rotation
            rotationInterval = 300,      -- 5 minutes default
            rotationStrategy = "round_robin",  -- round_robin, weighted, performance_based
            impressionCounts = {},       -- Track impressions per ad
            performanceScores = {},      -- Track performance per ad
            adPriorities = {}            -- Ad priorities from feeding engine
        },
        
        -- Asset management
        assetStorage = {
            currentAssets = {},          -- Currently displayed assets
            movementTweens = {},         -- Active movement animations
            preloadStatus = "pending"    -- pending, loading, ready, error
        },
        
        -- Visibility tracking
        visibility = {
            isInCameraView = false,
            shouldBeVisible = false,
            currentState = "INVISIBLE",  -- INVISIBLE, LOADING, VISIBLE, TRANSITIONING
            playersViewing = {},
            lastVisibilityChange = 0
        },
        
        -- Performance metrics for feeding engine
        metrics = {
            totalImpressions = 0,
            impressionsByAd = {},
            averageViewTime = 0,
            clickThroughRate = 0,
            engagementScore = 0,
            lastMetricsUpdate = 0,
            sessionStart = tick()
        },
        
        -- Configuration
        config = {
            hideWhenEmpty = true,
            enableAutoRotation = true,
            maxImpressionsPerAd = 100,
            minPerformanceThreshold = 0.1
        },
        
        -- Events
        OnContentUpdate = Instance.new("BindableEvent"),
        OnVisibilityChange = Instance.new("BindableEvent"),
        OnAdRotation = Instance.new("BindableEvent"),
        OnMetricsUpdate = Instance.new("BindableEvent")
    }
    
    -- Store container reference
    if not _G.MMLNetwork then
        _G.MMLNetwork = {}
    end
    if not _G.MMLNetwork._containers then
        _G.MMLNetwork._containers = {}
    end
    
    _G.MMLNetwork._containers[containerId] = container
    
    -- Set up container model metadata
    if containerModel then
        containerModel:SetAttribute("MMLContainerId", containerId)
        containerModel:SetAttribute("MMLContainerType", containerType)
        containerModel:SetAttribute("MMLInitialized", true)
    end
    
    print("🆕 Initialized container:", containerId, "Type:", containerType)
    return container
end

-- Update available ads for a container
function MMLContainerManager.updateContainerAds(containerId, availableAds)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        warn("❌ MMLNetwork not initialized")
        return false
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container then
        warn("❌ Container not found:", containerId)
        return false
    end
    
    local previousAds = container.adRotation.availableAds
    container.adRotation.availableAds = availableAds or {}
    
    -- Reset rotation index if ads changed
    if #previousAds ~= #availableAds then
        -- Stagger starting index by stable hash of containerId so different containers start on different ads
        local function hashId(id)
            local h = 0
            for i = 1, #id do h = (h * 131 + string.byte(id, i)) % 1000000007 end
            return h
        end
        if #container.adRotation.availableAds > 0 then
            local h = hashId(containerId)
            container.adRotation.currentAdIndex = (h % #container.adRotation.availableAds) + 1
        else
            container.adRotation.currentAdIndex = 1
        end
        container.adRotation.lastRotation = 0
        container.adRotation.currentAdId = nil
    end
    
    print("📋 Updated ads for container", containerId, ":", #availableAds, "ads available")
    
    -- If container is visible and has no current ad, assign one
    if (container.visibility.isInCameraView or true) and not container.adRotation.currentAdId and #availableAds > 0 then
        local MMLContainerStreamer = require(script.Parent.MMLContainerStreamer)
        local nextAdId = selectNextAd and selectNextAd(container) or nil
        if nextAdId and MMLContainerStreamer then
            MMLContainerStreamer.moveAssetsToContainer(containerId, nextAdId)
        end
    end
    
    return true
end

-- Select next ad based on rotation strategy
selectNextAd = function(container)
    local availableAds = container.adRotation.availableAds
    if #availableAds == 0 then return nil end
    
    local strategy = container.adRotation.rotationStrategy
    
    if strategy == "round_robin" then
        -- Simple round-robin rotation
        local index = container.adRotation.currentAdIndex or 1
        container.adRotation.currentAdIndex = (index % #availableAds) + 1
        local chosen = availableAds[index]
        return avoidDuplicateSelection(chosen, container)
        
    elseif strategy == "weighted" then
        -- Weight-based selection (placeholder for feeding engine)
        local chosen = selectWeightedAd(container)
        return chosen and avoidDuplicateSelection(chosen, container) or chosen
        
    elseif strategy == "performance_based" then
        -- Performance-based selection (placeholder for feeding engine)
        local chosen = selectPerformanceBasedAd(container)
        return chosen and avoidDuplicateSelection(chosen, container) or chosen
        
    else
        -- Default to round-robin
        local index = container.adRotation.currentAdIndex or 1
        container.adRotation.currentAdIndex = (index % #availableAds) + 1
        local chosen = availableAds[index]
        return avoidDuplicateSelection(chosen, container)
    end
end

-- Placeholder for weighted ad selection
selectWeightedAd = function(container)
    local availableAds = container.adRotation.availableAds
    local adPriorities = container.adRotation.adPriorities
    
    -- If we have priority data from feeding engine, use it
    if next(adPriorities) then
        local weightedAds = {}
        local totalWeight = 0
        
        for _, adId in pairs(availableAds) do
            local weight = adPriorities[adId] and adPriorities[adId].weight or 1
            table.insert(weightedAds, {adId = adId, weight = weight})
            totalWeight = totalWeight + weight
        end
        
        -- Select based on weighted random
        local random = math.random() * totalWeight
        local currentWeight = 0
        
        for _, weightedAd in pairs(weightedAds) do
            currentWeight = currentWeight + weightedAd.weight
            if random <= currentWeight then
                return weightedAd.adId
            end
        end
    end
    
    -- Fallback to round-robin
    local index = container.adRotation.currentAdIndex or 1
    container.adRotation.currentAdIndex = (index % #availableAds) + 1
    return availableAds[index]
end

-- Placeholder for performance-based ad selection
selectPerformanceBasedAd = function(container)
    local availableAds = container.adRotation.availableAds
    local performanceScores = container.adRotation.performanceScores
    
    -- Find ad with best performance that hasn't been shown recently
    local bestAdId = nil
    local bestScore = -1
    
    for _, adId in pairs(availableAds) do
        local score = performanceScores[adId] or 0
        local impressionCount = container.adRotation.impressionCounts[adId] or 0
        
        -- Boost score for ads with fewer recent impressions
        local adjustedScore = score * (1 + (1 / math.max(impressionCount, 1)))
        
        if adjustedScore > bestScore then
            bestScore = adjustedScore
            bestAdId = adId
        end
    end
    
    if bestAdId then
        return bestAdId
    end
    
    -- Fallback to round-robin
    local index = container.adRotation.currentAdIndex or 1
    container.adRotation.currentAdIndex = (index % #availableAds) + 1
    return availableAds[index]
end

-- Force rotation to next ad
function MMLContainerManager.rotateToNextAd(containerId)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return false
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container then return false end
    
    -- Only rotate if container is visible
    if not container.visibility.isInCameraView then
        print("⚠️ Container not visible, skipping rotation:", containerId)
        return false
    end
    
    local MMLContainerStreamer = require(script.Parent.MMLContainerStreamer)
    
    -- Return current assets to storage
    if container.adRotation.currentAdId and MMLContainerStreamer then
        MMLContainerStreamer.moveAssetsToStorage(containerId)
    end
    
    -- Wait a moment for assets to return to storage
    wait(1.5)
    
    -- Select and display next ad
    local nextAdId = selectNextAd(container)
    if nextAdId and MMLContainerStreamer then
        container.adRotation.lastRotation = tick()
        MMLContainerStreamer.moveAssetsToContainer(containerId, nextAdId)
        
        -- Fire rotation event
        container.OnAdRotation:Fire(container.adRotation.currentAdId, nextAdId)
        
        print("🔄 Rotated container", containerId, "to ad:", nextAdId)
        return true
    end
    
    return false
end

-- Update container metrics for feeding engine
function MMLContainerManager.updateContainerMetrics(containerId, impression, engagement)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container then return end
    
    local currentAdId = container.adRotation.currentAdId
    if not currentAdId then return end
    
    -- Update container-level metrics
    container.metrics.totalImpressions = container.metrics.totalImpressions + 1
    container.metrics.lastMetricsUpdate = tick()
    
    -- Update ad-specific metrics
    if not container.metrics.impressionsByAd[currentAdId] then
        container.metrics.impressionsByAd[currentAdId] = 0
    end
    container.metrics.impressionsByAd[currentAdId] = 
        container.metrics.impressionsByAd[currentAdId] + 1
    
    -- Update impression count for rotation tracking
    if not container.adRotation.impressionCounts[currentAdId] then
        container.adRotation.impressionCounts[currentAdId] = 0
    end
    container.adRotation.impressionCounts[currentAdId] = 
        container.adRotation.impressionCounts[currentAdId] + 1
    
    -- Calculate engagement score if provided
    if engagement then
        local currentScore = container.adRotation.performanceScores[currentAdId] or 0
        local newScore = (currentScore + engagement.score) / 2  -- Simple average
        container.adRotation.performanceScores[currentAdId] = newScore
    end
    
    -- Fire metrics update event
    container.OnMetricsUpdate:Fire({
        containerId = containerId,
        adId = currentAdId,
        totalImpressions = container.metrics.totalImpressions,
        impressionsByAd = container.metrics.impressionsByAd[currentAdId]
    })
    
    print("📊 Updated metrics for container", containerId, "ad", currentAdId)
end

-- Check if container should rotate based on conditions
function MMLContainerManager.shouldRotateAd(containerId)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return false
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container or not container.adRotation.currentAdId then
        return false
    end
    
    local currentTime = tick()
    local lastRotation = container.adRotation.lastRotation
    local rotationInterval = container.adRotation.rotationInterval
    local currentAdId = container.adRotation.currentAdId
    
    -- Time-based rotation
    if (currentTime - lastRotation) >= rotationInterval then
        return true, "time_interval"
    end
    
    -- Impression-based rotation
    local impressionCount = container.adRotation.impressionCounts[currentAdId] or 0
    local maxImpressionsPerAd = container.config.maxImpressionsPerAd or 100
    if impressionCount >= maxImpressionsPerAd then
        return true, "impression_limit"
    end
    
    -- Performance-based rotation
    local performanceScore = container.adRotation.performanceScores[currentAdId] or 0
    local minPerformanceThreshold = container.config.minPerformanceThreshold or 0.1
    if performanceScore > 0 and performanceScore < minPerformanceThreshold then
        return true, "poor_performance"
    end
    
    return false, "no_rotation_needed"
end

-- Start automatic rotation monitoring
function MMLContainerManager.startRotationMonitoring()
    spawn(function()
        while true do
            wait(30)  -- Check every 30 seconds
            
            if _G.MMLNetwork and _G.MMLNetwork._containers then
                for containerId, container in pairs(_G.MMLNetwork._containers) do
                    if container.visibility.isInCameraView and 
                       #container.adRotation.availableAds > 1 and
                       container.config.enableAutoRotation then
                        
                        local shouldRotate, reason = MMLContainerManager.shouldRotateAd(containerId)
                        if shouldRotate then
                            print("🔄 Auto-rotating container", containerId, "Reason:", reason)
                            MMLContainerManager.rotateToNextAd(containerId)
                        end
                    end
                end
            end
        end
    end)
    
    print("🔄 Container rotation monitoring started")
end

-- Update container rotation schedule from feeding engine
function MMLContainerManager.updateContainerRotationSchedule(containerId, schedule)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return false
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container then return false end
    
    container.adRotation.rotationInterval = schedule.rotationInterval or 300
    container.adRotation.rotationStrategy = schedule.strategy or "round_robin"
    
    -- Update ad priorities/weights if provided
    if schedule.priorities then
        container.adRotation.adPriorities = {}
        for _, priority in pairs(schedule.priorities) do
            container.adRotation.adPriorities[priority.adId] = {
                weight = priority.weight,
                priority = priority.priority
            }
        end
    end
    
    print("📅 Updated rotation schedule for container", containerId, 
          "Strategy:", schedule.strategy,
          "Interval:", schedule.rotationInterval, "seconds")
    
    return true
end

-- Get container summary for feeding engine
function MMLContainerManager.getContainerSummary(containerId)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return nil
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container then return nil end
    
    return {
        id = containerId,
        type = container.type,
        position = container.model and MMLUtil.getInstancePosition(container.model) or Vector3.new(0, 0, 0),
        isVisible = container.visibility.isInCameraView,
        currentAdId = container.adRotation.currentAdId,
        availableAds = container.adRotation.availableAds,
        metrics = {
            totalImpressions = container.metrics.totalImpressions,
            impressionsByAd = container.metrics.impressionsByAd,
            averageViewTime = container.metrics.averageViewTime,
            sessionDuration = tick() - container.metrics.sessionStart
        },
        config = container.config
    }
end

-- Get all container summaries
function MMLContainerManager.getAllContainerSummaries()
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return {}
    end
    
    local summaries = {}
    for containerId, _ in pairs(_G.MMLNetwork._containers) do
        local summary = MMLContainerManager.getContainerSummary(containerId)
        if summary then
            table.insert(summaries, summary)
        end
    end
    
    return summaries
end

-- Set container configuration
function MMLContainerManager.setContainerConfig(containerId, config)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return false
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container then return false end
    
    for key, value in pairs(config) do
        if container.config[key] ~= nil then
            container.config[key] = value
            print("🔧 Updated container config:", containerId, key, "=", value)
        end
    end
    
    return true
end

-- Get container by model reference
function MMLContainerManager.getContainerByModel(model)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return nil
    end
    
    for containerId, container in pairs(_G.MMLNetwork._containers) do
        if container.model == model then
            return container, containerId
        end
    end
    
    return nil
end

-- Initialize containers from models in workspace
function MMLContainerManager.initializeContainersFromWorkspace()
    local count = 0
    
    -- Look for parts/models with MML metadata (both Part and Model support)
    for _, obj in pairs(workspace:GetDescendants()) do
        if (obj:IsA("Model") or obj:IsA("Part")) and obj:FindFirstChild("MMLMetadata") then
            local metadata = obj.MMLMetadata
            local containerIdValue = metadata:FindFirstChild("ContainerId")
            local typeValue = metadata:FindFirstChild("Type") or metadata:FindFirstChild("ContainerType")
            
            if containerIdValue and containerIdValue:IsA("StringValue") and 
               typeValue and typeValue:IsA("StringValue") then
                
                local containerId = containerIdValue.Value
                local containerType = typeValue.Value
                
                print("🔍 Found container:", containerId, "Type:", containerType)
                
                -- Initialize container with database ID
                MMLContainerManager.initializeContainer(containerId, obj, containerType)
                
                -- Set up position sync if enabled
                local enablePositionSync = metadata:FindFirstChild("EnablePositionSync")
                if enablePositionSync and enablePositionSync:IsA("BoolValue") and enablePositionSync.Value then
                    local container = _G.MMLNetwork._containers[containerId]
                    if container then
                        container.lastSyncedPosition = MMLUtil.getInstancePosition(obj)
                        print("📍 Position sync enabled for:", containerId)
                    end
                end
                
                count = count + 1
            end
        end
    end
    
    print("🏗️ Initialized", count, "containers from workspace")
    return count
end

-- Position monitoring and sync
local positionMonitor = nil
local lastPositionSync = {}

function MMLContainerManager.startPositionMonitoring()
    if positionMonitor then
        warn("⚠️ Position monitoring already started")
        return
    end
    
    local RunService = game:GetService("RunService")
    if not RunService:IsServer() then
        -- Only the server should sync positions
        return
    end
    
    positionMonitor = RunService.Heartbeat:Connect(function()
        if type(_G.MMLNetwork) ~= "table" or type(_G.MMLNetwork._containers) ~= "table" then
            return
        end
        
        local currentTime = tick()
        
        for containerId, container in pairs(_G.MMLNetwork._containers) do
            if container.model and container.model.Parent then
                local currentPosition = MMLUtil.getInstancePosition(container.model)
                local lastPosition = container.lastSyncedPosition
                
                -- Check if position changed significantly (threshold: 0.5 studs)
                if not lastPosition or 
                   (currentPosition - lastPosition).Magnitude > 0.5 then
                    
                    -- Cooldown check (minimum 5 seconds between syncs)
                    local lastSync = lastPositionSync[containerId] or 0
                    if currentTime - lastSync >= 5 then
                        
                        -- Sync position to database
                        if _G.MMLNetwork and _G.MMLNetwork.syncContainerPosition then
                            local success = _G.MMLNetwork.syncContainerPosition(containerId, currentPosition)
                            if success then
                                container.lastSyncedPosition = currentPosition
                                lastPositionSync[containerId] = currentTime
                                print("📍 Auto-synced position for:", containerId)
                            end
                        end
                    end
                end
            end
        end
    end)
    
    print("📍 Container position monitoring started")
end

function MMLContainerManager.stopPositionMonitoring()
    if positionMonitor then
        positionMonitor:Disconnect()
        positionMonitor = nil
        print("📍 Container position monitoring stopped")
    end
end

function MMLContainerManager.syncAllPositions()
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return 0
    end
    
    local synced = 0
    for containerId, container in pairs(_G.MMLNetwork._containers) do
        if container.model and container.model.Parent then
            if _G.MMLNetwork.syncContainerPosition then
                local pos = MMLUtil.getInstancePosition(container.model)
                local success = _G.MMLNetwork.syncContainerPosition(containerId, pos)
                if success then
                    container.lastSyncedPosition = pos
                    synced = synced + 1
                end
            end
        end
    end
    
    print("📍 Synced positions for", synced, "containers")
    return synced
end

-- Cleanup and shutdown
function MMLContainerManager.shutdown()
    -- Stop position monitoring
    MMLContainerManager.stopPositionMonitoring()
    
    if _G.MMLNetwork and _G.MMLNetwork._containers then
        for containerId, container in pairs(_G.MMLNetwork._containers) do
            if container.OnContentUpdate then
                container.OnContentUpdate:Destroy()
            end
            if container.OnVisibilityChange then
                container.OnVisibilityChange:Destroy()
            end
            if container.OnAdRotation then
                container.OnAdRotation:Destroy()
            end
            if container.OnMetricsUpdate then
                container.OnMetricsUpdate:Destroy()
            end
            if container.OnPositionChanged then
                container.OnPositionChanged:Disconnect()
            end
        end
        
        _G.MMLNetwork._containers = {}
    end
    
    print("🔴 MML Container Manager shutdown")
end

return MMLContainerManager 