-- src/roblox/MMLContainerStreamer.lua
-- Container Streamer System for MML Network
-- Handles dynamic movement of assets from storage to containers based on camera visibility

local MMLContainerStreamer = {}
MMLContainerStreamer._version = "2.0.1-thumb-first-front-only-billboard-fallback"

function MMLContainerStreamer.getVersion()
    return MMLContainerStreamer._version
end

local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local MMLUtil = require(script.Parent.MMLUtil)
local ContentProvider = game:GetService("ContentProvider")

-- Movement configuration
local MOVEMENT_CONFIG = {
    transitionTime = 2.0,              -- 2 seconds to move assets
    easingStyle = Enum.EasingStyle.Quint,
    easingDirection = Enum.EasingDirection.Out,
    maxConcurrentMoves = 10,           -- Limit concurrent asset movements
    hideReturnTime = 1.0,              -- 1 second to return assets to storage
    visibilityBuffer = 20              -- Extra studs around camera view for pre-loading
}

local activeMovements = {}  -- Track ongoing asset movements
local movementQueue = {}    -- Queue for pending movements
local visibilityMonitor = nil  -- Connection for visibility monitoring

-- Forward declaration for function used before its definition
local getAssignedAdForContainer

-- Check if container is in any player's camera view
function MMLContainerStreamer.isContainerInView(container)
    if not container or not container.model then
        return false, nil, math.huge
    end
    
    local containerPosition = MMLUtil.getInstancePosition(container.model)
    local viewBuffer = MOVEMENT_CONFIG.visibilityBuffer
    
    for _, player in pairs(Players:GetPlayers()) do
        local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
        if hrp then
            local camera = workspace.CurrentCamera
            
            if camera then
                -- Client-side or Studio context with camera available
                local distance = (camera.CFrame.Position - containerPosition).Magnitude
                if distance <= 100 + viewBuffer then
                    local cameraLookVector = camera.CFrame.LookVector
                    local directionToContainer = (containerPosition - camera.CFrame.Position).Unit
                    local dotProduct = cameraLookVector:Dot(directionToContainer)
                    if dotProduct > -0.3 then
                        return true, player, distance
                    end
                end
            else
                -- Server-side fallback: proximity-only based on player HRP
                local distance = (hrp.Position - containerPosition).Magnitude
                if distance <= 60 + viewBuffer then -- tighter threshold server-side
                    return true, player, distance
                end
            end
        end
    end
    
    -- Server-only: if no players, treat as visible to allow server-side testing
    local RunService = game:GetService("RunService")
    if RunService:IsServer() and #Players:GetPlayers() == 0 then
        return true, nil, 0
    end
    return false, nil, math.huge
end

-- Move assets from storage to container
function MMLContainerStreamer.moveAssetsToContainer(containerId, adId)
    -- Get MMLAssetStorage reference
    local MMLAssetStorage = require(script.Parent.MMLAssetStorage)
    
    -- Verify container exists
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        warn("❌ MMLNetwork not initialized")
        return false
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container then
        warn("❌ Container not found:", containerId)
        return false
    end
    
    local preloadedAd = MMLAssetStorage.getPreloadedAd(adId)
    if not preloadedAd then
        -- Fallback: pull assets directly from available ads cache (bypass preload)
        local okRM, MMLRequestManager = pcall(function()
            return require(script.Parent.MMLRequestManager)
        end)
        if okRM and MMLRequestManager and type(MMLRequestManager.getCachedGameAds) == "function" then
            local ads = MMLRequestManager.getCachedGameAds() or {}
            for _, ad in pairs(ads) do
                if ad.id == adId then
                    preloadedAd = { assets = {} }
                    for _, asset in pairs(ad.assets or {}) do
                        preloadedAd.assets[asset.id or asset.assetId or tostring(#preloadedAd.assets+1)] = {
                            instance = nil,
                            assetData = asset,
                            storagePosition = nil
                        }
                    end
                    break
                end
            end
        end
        if not preloadedAd then
            warn("❌ Pre-loaded ad not found:", adId)
            return false
        end
    end
    
    print("🚀 Moving assets for ad", adId, "to container", containerId)
    
    -- Mark ad as being used
    preloadedAd.lastUsed = tick()
    
    -- DISPLAY shortcut: render directly into container's MMLDisplaySurface when available
    if container.type == "DISPLAY" then
        -- Find SurfaceGui anywhere under the model; support Stage -> SurfaceGui structure
        local surfaceGui
        if container.model then
            -- Recursive search for existing MMLDisplaySurface
            local okFind, found = pcall(function()
                return container.model:FindFirstChild("MMLDisplaySurface", true)
            end)
            if okFind then surfaceGui = found end
            -- If not found, prefer attaching to a Stage part if present
            if not surfaceGui then
                local okStage, stage = pcall(function()
                    return container.model:FindFirstChild("Stage", true)
                end)
                if okStage and stage and stage:IsA("BasePart") then
                    surfaceGui = Instance.new("SurfaceGui")
                    surfaceGui.Name = "MMLDisplaySurface"
                    surfaceGui.Face = Enum.NormalId.Front
                    surfaceGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
                    surfaceGui.CanvasSize = Vector2.new(1024, 576)
                    surfaceGui.AlwaysOnTop = false
                    surfaceGui.Parent = stage
                end
            end
        end
        if surfaceGui and surfaceGui:IsA("SurfaceGui") then
            -- Ensure Frame and media children exist (self-heal model assumptions)
            surfaceGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
            surfaceGui.CanvasSize = Vector2.new(1024, 576)
            surfaceGui.AlwaysOnTop = false
            surfaceGui.Face = surfaceGui.Face or Enum.NormalId.Front

            local frame = surfaceGui:FindFirstChild("Frame")
            if not frame then
                frame = Instance.new("Frame")
                frame.Name = "Frame"
                frame.Size = UDim2.new(1, 0, 1, 0)
                frame.BackgroundTransparency = 1
                frame.Parent = surfaceGui
            end
            local imageLabel = frame:FindFirstChild("AdImage")
            if not imageLabel then
                imageLabel = Instance.new("ImageLabel")
                imageLabel.Name = "AdImage"
                imageLabel.Size = UDim2.new(1, 0, 1, 0)
                imageLabel.BackgroundTransparency = 1
                imageLabel.ScaleType = Enum.ScaleType.Fit
                imageLabel.Visible = false
                imageLabel.Parent = frame
            end
            local videoFrame = frame:FindFirstChild("AdVideo")
            if not videoFrame then
                videoFrame = Instance.new("VideoFrame")
                videoFrame.Name = "AdVideo"
                videoFrame.Size = UDim2.new(1, 0, 1, 0)
                videoFrame.BackgroundTransparency = 1
                videoFrame.Visible = false
                videoFrame.Looped = true
                videoFrame.Parent = frame
            end
            -- Pick first suitable visual asset (image/video), robust to legacy keys
            local function normalizeAsset(assetInfo)
                local data = assetInfo and assetInfo.assetData or {}
                local t = string.lower(tostring(data.type or data.assetType or ""))
                local rid = data.robloxAssetId or data.robloxId
                if t == "decal" or t == "texture" or t == "image_asset" then t = "image" end
                if t == "multi_display" or t == "multimedia_display" or t == "multimediasignage" then t = "image" end
                if t == "video_frame" then t = "video" end
                return t, rid
            end

            local chosen
            for _, assetInfo in pairs(preloadedAd.assets) do
                local at, rid = normalizeAsset(assetInfo)
                if rid and (at == "image" or at == "video") then
                    chosen = { type = at, id = rid }
                    break
                end
            end
            if chosen then
                -- Ensure current ad id is set BEFORE any early returns (e.g., locked image)
                container.adRotation.currentAdId = adId
                -- Helper to parse current Image and detect source kind
                local function parseImageId(image)
                    if not image then return nil, nil end
                    local aid = tostring(image):match("rbxassetid://(%d+)")
                    if aid then return aid, "asset" end
                    local tid = tostring(image):match("rbxthumb://[^?]*%?[^&]*id=(%d+)")
                    if tid then return tid, "thumb" end
                    return nil, nil
                end
                if chosen.type == "video" and videoFrame then
                    if imageLabel then imageLabel.Visible = false end
                    videoFrame.Visible = true
                    videoFrame.Video = "rbxassetid://" .. tostring(chosen.id)
                    videoFrame.Playing = true
                elseif imageLabel then
                    -- Respect manual lock to avoid overwriting during diagnostics
                    local locked = false
                    pcall(function() locked = imageLabel:GetAttribute("Lock") == true end)
                    if locked then
                        -- Even if locked, we still want the system state to reflect the active ad
                        container.adRotation.currentAdId = adId
                        return true
                    end
                    if videoFrame then
                        videoFrame.Playing = false
                        videoFrame.Visible = false
                    end
                    imageLabel.Visible = true
                    -- For image ads, also update a Decal on the Stage (Front face only)
                    local okStage2, stage2 = pcall(function()
                        return container.model and container.model:FindFirstChild("Stage", true)
                    end)
                    if okStage2 and stage2 and stage2:IsA("BasePart") then
                        local name = "AdDecal_Front"
                        local d = stage2:FindFirstChild(name)
                        if not d then
                            d = Instance.new("Decal")
                            d.Name = name
                            d.Face = Enum.NormalId.Front
                            d.Parent = stage2
                        end
                        d.Texture = ("rbxassetid://%s"):format(tostring(chosen.id))
                    end

                    -- Decide whether to prefer direct asset or thumbnail (default to thumbnail)
                    local preferThumbnail = true
                    pcall(function()
                        if imageLabel:GetAttribute("DirectAssetPreferred") == true then
                            preferThumbnail = false
                        end
                    end)

                    -- If a correct direct asset is already loaded, keep it (idempotent)
                    local currentId, currentKind = parseImageId(imageLabel.Image)
                    if currentKind == "asset" and tostring(currentId) == tostring(chosen.id) and imageLabel.IsLoaded then
                        -- Already good; do not overwrite
                        return true
                    end

                    local function setDirectThenFallback()
                        imageLabel.Image = ("rbxassetid://%s"):format(tostring(chosen.id))
                        -- Wait briefly for load; fallback to thumbnail if it fails
                        local t0 = tick()
                        while not imageLabel.IsLoaded and tick() - t0 < 2.0 do
                            wait(0.1)
                        end
                        if not imageLabel.IsLoaded then
                            -- Temporary debug: raise AOT to rule out occlusion
                            surfaceGui.AlwaysOnTop = true
                            imageLabel.Image = ("rbxthumb://type=Asset&id=%s&w=480&h=270"):format(tostring(chosen.id))
                        end
                    end

                    if preferThumbnail then
                        imageLabel.Image = ("rbxthumb://type=Asset&id=%s&w=480&h=270"):format(tostring(chosen.id))
                        -- If thumbnail fails to load, fall back to direct asset only; do not create back/billboard
                        local t0 = tick()
                        while not imageLabel.IsLoaded and tick() - t0 < 2.0 do
                            wait(0.1)
                        end
                        if not imageLabel.IsLoaded then
                            setDirectThenFallback()
                        end
                    else
                        setDirectThenFallback()
                    end

                    -- Begin impression tracking for DISPLAY surface
                    if _G.MMLImpressionTracker then
                        local okStage, stage = pcall(function()
                            return container.model and container.model:FindFirstChild("Stage", true)
                        end)
                        _G.MMLImpressionTracker.startTracking(containerId, okStage and stage or nil, surfaceGui, {
                            id = adId,
                            type = container.type
                        })
                    end
                else
                    return false
                end
                -- Update container state
                container.assetStorage.currentAssets = {}
                container.visibility.currentState = "VISIBLE"
                container.visibility.shouldBeVisible = true
                container.adRotation.currentAdId = adId
                -- Fire container update event
                if container.OnContentUpdate then
                    container.OnContentUpdate:Fire(adId, "LOADED")
                end
                print("✅ Rendered ad on MMLDisplaySurface for container", containerId)
                return true
            end

            -- Fallback: render first available asset as thumbnail to guarantee visibility
            if imageLabel then
                -- Helper to parse current Image and detect source kind
                local function parseImageId(image)
                    if not image then return nil, nil end
                    local aid = tostring(image):match("rbxassetid://(%d+)")
                    if aid then return aid, "asset" end
                    local tid = tostring(image):match("rbxthumb://[^?]*%?[^&]*id=(%d+)")
                    if tid then return tid, "thumb" end
                    return nil, nil
                end
                local fallbackRid
                for _, assetInfo in pairs(preloadedAd.assets) do
                    local data = assetInfo and assetInfo.assetData or {}
                    local rid = data.robloxAssetId or data.robloxId
                    if rid then fallbackRid = rid break end
                end
                if fallbackRid then
                    if videoFrame then
                        videoFrame.Playing = false
                        videoFrame.Visible = false
                    end
                    imageLabel.Visible = true
                    -- If a matching direct asset is already loaded, keep it; otherwise prefer direct, fallback to thumb
                    local currentId, currentKind = parseImageId(imageLabel.Image)
                    if currentKind == "asset" and tostring(currentId) == tostring(fallbackRid) and imageLabel.IsLoaded then
                        -- Keep existing
                    else
                        imageLabel.Image = ("rbxassetid://%s"):format(tostring(fallbackRid))
                        local t0 = tick()
                        while not imageLabel.IsLoaded and tick() - t0 < 2.0 do
                            wait(0.1)
                        end
                        if not imageLabel.IsLoaded then
                            imageLabel.Image = ("rbxthumb://type=Asset&id=%s&w=480&h=270"):format(tostring(fallbackRid))
                        end
                    end

                    -- Begin impression tracking for DISPLAY surface
                    if _G.MMLImpressionTracker then
                        local okStage, stage = pcall(function()
                            return container.model and container.model:FindFirstChild("Stage", true)
                        end)
                        _G.MMLImpressionTracker.startTracking(containerId, okStage and stage or nil, surfaceGui, {
                            id = adId,
                            type = container.type
                        })
                    end
                    container.assetStorage.currentAssets = {}
                    container.visibility.currentState = "VISIBLE"
                    container.visibility.shouldBeVisible = true
                    container.adRotation.currentAdId = adId
                    if container.OnContentUpdate then
                        container.OnContentUpdate:Fire(adId, "LOADED")
                    end
                    print("✅ Rendered thumbnail fallback on MMLDisplaySurface for container", containerId)
                    return true
                end
            end
        end
    end

    -- Calculate target positions for each asset (fallback path)
    local containerPosition = MMLUtil.getInstancePosition(container.model)
    local containerCFrame = MMLUtil.getInstanceCFrame(container.model) or CFrame.new(containerPosition)
    
    local movePromises = {}
    local movedAssets = {}
    
    for assetId, assetInfo in pairs(preloadedAd.assets) do
        local assetInstance = assetInfo.instance
        local assetData = assetInfo.assetData
        
        if assetInstance and assetInstance.Parent then
            -- Calculate target position based on asset type and container
            local targetCFrame = calculateAssetTargetPosition(assetData, containerCFrame, container.type)
            
            -- Create movement promise
            local movePromise = moveAssetToPosition(assetInstance, targetCFrame, assetData.type)
            table.insert(movePromises, movePromise)
            
            movedAssets[assetId] = {
                instance = assetInstance,
                originalPosition = assetInfo.storagePosition,
                targetPosition = targetCFrame,
                assetData = assetData
            }
        end
    end
    
    -- Wait for all movements to complete
    spawn(function()
        -- Wait for all movement tweens
        for _, promise in pairs(movePromises) do
            if promise and promise.Parent then
                promise.Changed:Wait()
            end
        end
        
        -- Update container state
        container.assetStorage.currentAssets = movedAssets
        container.visibility.currentState = "VISIBLE"
        container.visibility.shouldBeVisible = true
        container.adRotation.currentAdId = adId
        
        -- Start impression tracking if available
        if _G.MMLImpressionTracker then
            for _, assetInfo in pairs(movedAssets) do
                if assetInfo.assetData.type == "image" or assetInfo.assetData.type == "video" then
                    local surfaceGui = assetInfo.instance:FindFirstChild("ImageSurface") or 
                                     assetInfo.instance:FindFirstChild("VideoSurface")
                    if surfaceGui then
                        _G.MMLImpressionTracker.startTracking(containerId, assetInfo.instance, surfaceGui, {
                            id = adId,
                            type = container.type
                        })
                    end
                end
            end
        end
        
        print("✅ Assets moved to container", containerId, "for ad", adId)
        
        -- Fire container update event
        if container.OnContentUpdate then
            container.OnContentUpdate:Fire(adId, "LOADED")
        end
    end)
    
    return true
end

-- Move assets back to storage
function MMLContainerStreamer.moveAssetsToStorage(containerId)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return false
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container then return false end
    
    local currentAssets = container.assetStorage.currentAssets
    if not currentAssets or next(currentAssets) == nil then
        return true -- No assets to move
    end
    
    print("📦 Returning assets to storage for container", containerId)
    
    -- Stop impression tracking if available
    if _G.MMLImpressionTracker then
        _G.MMLImpressionTracker.stopTracking(containerId)
    end
    
    local returnPromises = {}
    
    for assetId, assetInfo in pairs(currentAssets) do
        local assetInstance = assetInfo.instance
        local originalPosition = assetInfo.originalPosition
        
        if assetInstance and assetInstance.Parent and originalPosition then
            -- Return to storage with faster animation
            local returnPromise = moveAssetToPosition(
                assetInstance, 
                originalPosition, 
                assetInfo.assetData.type, 
                MOVEMENT_CONFIG.hideReturnTime,
                true  -- hiding
            )
            table.insert(returnPromises, returnPromise)
        end
    end
    
    spawn(function()
        -- Wait for all return movements
        for _, promise in pairs(returnPromises) do
            if promise and promise.Parent then
                promise.Changed:Wait()
            end
        end
        
        -- Clear container state
        container.assetStorage.currentAssets = {}
        container.visibility.currentState = "INVISIBLE"
        container.visibility.shouldBeVisible = false
        container.adRotation.currentAdId = nil
        
        print("✅ Assets returned to storage for container", containerId)
        
        -- Fire container update event
        if container.OnContentUpdate then
            container.OnContentUpdate:Fire(nil, "HIDDEN")
        end
    end)
    
    return true
end

-- Calculate target position for asset based on type and container
local function calculateAssetTargetPosition(assetData, containerCFrame, containerType)
    local displayProperties = assetData.displayProperties or {}
    
    if containerType == "DISPLAY" then
        -- For display containers, position assets on the display surface
        if assetData.type == "image" or assetData.type == "video" or assetData.type == "multiMediaSignage" then
            local offset = Vector3.new(
                displayProperties.offsetX or 0,
                displayProperties.offsetY or 0,
                displayProperties.offsetZ or 0.1  -- Slightly in front of surface
            )
            return containerCFrame + containerCFrame:VectorToWorldSpace(offset)
        end
        
    elseif containerType == "NPC" then
        -- For NPC containers, position character at spawn point
        if assetData.type == "npc_character" then
            return containerCFrame + Vector3.new(0, 0, 0)  -- Center of spawn area
        elseif assetData.type:match("clothing") or assetData.type == "shoes" then
            -- Clothing assets will be applied to NPC, return NPC position
            return containerCFrame + Vector3.new(0, 0, 0)
        end
        
    elseif containerType == "MINIGAME" then
        -- For minigame containers, position at game zone center
        return containerCFrame + Vector3.new(0, 1, 0)  -- Slightly above ground
    end
    
    -- Default positioning
    return containerCFrame
end

-- Move an asset to a specific position with animation
local function moveAssetToPosition(assetInstance, targetCFrame, assetType, duration, hiding)
    duration = duration or MOVEMENT_CONFIG.transitionTime
    hiding = hiding or false
    
    local promise = Instance.new("BoolValue")  -- Simple promise implementation
    promise.Name = "MovePromise"
    promise.Parent = workspace
    
    spawn(function()
        -- Make asset visible during movement (unless hiding)
        if not hiding then
            if assetInstance:IsA("Model") then
                -- For models, make parts visible
                for _, part in pairs(assetInstance:GetDescendants()) do
                    if part:IsA("BasePart") then
                        part.Transparency = 0.3  -- Semi-transparent during movement
                    end
                end
            else
                assetInstance.Transparency = 0.3
            end
            
            -- Enable GUI elements
            local surfaceGui = assetInstance:FindFirstChild("ImageSurface") or 
                             assetInstance:FindFirstChild("VideoSurface")
            if surfaceGui then
                surfaceGui.Enabled = true
            end
        end
        
        -- Create movement tween
        local tweenInfo = TweenInfo.new(
            duration,
            MOVEMENT_CONFIG.easingStyle,
            MOVEMENT_CONFIG.easingDirection,
            0,
            false,
            0
        )
        
        local tween
        if assetInstance:IsA("Model") then
            -- For models, tween the PrimaryPart
            local primaryPart = assetInstance.PrimaryPart
            if primaryPart then
                tween = TweenService:Create(primaryPart, tweenInfo, {
                    CFrame = targetCFrame
                })
            end
        else
            -- For parts, tween directly
            tween = TweenService:Create(assetInstance, tweenInfo, {
                CFrame = targetCFrame
            })
        end
        
        if tween then
            tween:Play()
            tween.Completed:Wait()
        else
            -- Fallback: direct positioning
            if assetInstance:IsA("Model") and assetInstance.PrimaryPart then
                assetInstance.PrimaryPart.CFrame = targetCFrame
            elseif assetInstance:IsA("BasePart") then
                assetInstance.CFrame = targetCFrame
            end
            wait(duration)
        end
        
        -- Final visibility state
        if hiding then
            -- Make completely invisible when hiding
            if assetInstance:IsA("Model") then
                for _, part in pairs(assetInstance:GetDescendants()) do
                    if part:IsA("BasePart") then
                        part.Transparency = 1
                    end
                end
            else
                assetInstance.Transparency = 1
            end
            
            local surfaceGui = assetInstance:FindFirstChild("ImageSurface") or 
                             assetInstance:FindFirstChild("VideoSurface")
            if surfaceGui then
                surfaceGui.Enabled = false
            end
        else
            -- Make fully visible when showing
            if assetInstance:IsA("Model") then
                for _, part in pairs(assetInstance:GetDescendants()) do
                    if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
                        part.Transparency = 0
                    end
                end
            else
                assetInstance.Transparency = 0
            end
        end
        
        -- Complete the promise
        promise.Value = true
    end)
    
    return promise
end

-- Monitor containers for visibility changes
function MMLContainerStreamer.startMonitoring()
    local RunService = game:GetService("RunService")
    if not RunService:IsServer() then
        -- Client context: avoid server-side monitoring loops
        return
    end
    if visibilityMonitor then
        warn("⚠️ Container monitoring already started")
        return
    end
    
    visibilityMonitor = RunService.Heartbeat:Connect(function()
        if type(_G.MMLNetwork) ~= "table" or type(_G.MMLNetwork._containers) ~= "table" then
            return
        end
        
        for containerId, container in pairs(_G.MMLNetwork._containers) do
            local isInView, viewingPlayer, distance = MMLContainerStreamer.isContainerInView(container)
            local wasInView = container.visibility.isInCameraView
            
            -- Update visibility state
            container.visibility.isInCameraView = isInView
            
            if isInView and not wasInView then
                -- Container came into view
                local assignedAdId = getAssignedAdForContainer and getAssignedAdForContainer(containerId) or nil
                if assignedAdId then
                    print("[MML][Stream] Container in view:", containerId, "ad:", assignedAdId)
                    MMLContainerStreamer.moveAssetsToContainer(containerId, assignedAdId)
                end
                
            elseif not isInView and wasInView then
                -- Container went out of view
                if container.adRotation.currentAdId then
                    print("[MML][Stream] Container out of view:", containerId)
                    MMLContainerStreamer.moveAssetsToStorage(containerId)
                end
            end
        end
    end)
    
    print("👁️ Container visibility monitoring started")
end

-- Stop monitoring containers
function MMLContainerStreamer.stopMonitoring()
    if visibilityMonitor then
        visibilityMonitor:Disconnect()
        visibilityMonitor = nil
        print("👁️ Container visibility monitoring stopped")
    end
end

-- Get assigned ad for container (will be enhanced with feeding engine)
getAssignedAdForContainer = function(containerId)
    if not _G.MMLNetwork or not _G.MMLNetwork._containers then
        return nil
    end
    
    local container = _G.MMLNetwork._containers[containerId]
    if not container then return nil end
    
    -- Simple rotation logic (will be replaced by feeding engine)
    if #container.adRotation.availableAds > 0 then
        local currentTime = tick()
        local lastRotation = container.adRotation.lastRotation
        local rotationInterval = container.adRotation.rotationInterval
        
        if (currentTime - lastRotation) >= rotationInterval then
            -- Time to rotate ad
            container.adRotation.lastRotation = currentTime
            container.adRotation.currentAdIndex = 
                ((container.adRotation.currentAdIndex or 0) % #container.adRotation.availableAds) + 1
        end
        
        local adIndex = container.adRotation.currentAdIndex or 1
        return container.adRotation.availableAds[adIndex]
    end
    
    return nil
end

-- Force move specific assets to container (for testing)
function MMLContainerStreamer.forceDisplayAd(containerId, adId)
    return MMLContainerStreamer.moveAssetsToContainer(containerId, adId)
end

-- Force hide container assets (for testing)
function MMLContainerStreamer.forceHideAd(containerId)
    return MMLContainerStreamer.moveAssetsToStorage(containerId)
end

-- Get movement statistics
function MMLContainerStreamer.getMovementStats()
    return {
        activeMovements = #activeMovements,
        queuedMovements = #movementQueue,
        isMonitoring = visibilityMonitor ~= nil,
        config = MOVEMENT_CONFIG
    }
end

-- Update movement configuration
function MMLContainerStreamer.updateConfig(newConfig)
    for key, value in pairs(newConfig) do
        if MOVEMENT_CONFIG[key] ~= nil then
            MOVEMENT_CONFIG[key] = value
            print("🔧 Updated movement config:", key, "=", value)
        end
    end
end

-- Shutdown streamer
function MMLContainerStreamer.shutdown()
    MMLContainerStreamer.stopMonitoring()
    activeMovements = {}
    movementQueue = {}
    print("🔴 MML Container Streamer shutdown")
end

return MMLContainerStreamer 