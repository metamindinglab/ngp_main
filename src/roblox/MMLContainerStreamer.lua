-- src/roblox/MMLContainerStreamer.lua
-- Container Streamer System for MML Network
-- Handles dynamic movement of assets from storage to containers based on camera visibility

local MMLContainerStreamer = {}
MMLContainerStreamer._version = "2.0.3-dominant-face-detection"

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

-- Choose the two opposite faces with the largest area for a billboard-like part
local function getDominantFacePair(stagePart)
    if not stagePart or not stagePart.Size then
        return Enum.NormalId.Front, Enum.NormalId.Back
    end
    local sx, sy, sz = stagePart.Size.X, stagePart.Size.Y, stagePart.Size.Z
    local areaX = sy * sz -- faces +/-X (Right/Left)
    local areaY = sx * sz -- faces +/-Y (Top/Bottom)
    local areaZ = sx * sy -- faces +/-Z (Front/Back)
    if areaZ >= areaX and areaZ >= areaY then
        return Enum.NormalId.Front, Enum.NormalId.Back
    elseif areaX >= areaY then
        return Enum.NormalId.Right, Enum.NormalId.Left
    else
        return Enum.NormalId.Top, Enum.NormalId.Bottom
    end
end

-- Resolve the actual BasePart to render on. Accepts a Part named "Stage" or a
-- Model named "Stage" that contains parts; otherwise, pick the largest face area part
local function resolveStageBasePart(model)
    if not model then return nil end
    local ok, found = pcall(function()
        return model:FindFirstChild("Stage", true)
    end)
    local function pickLargest(parts)
        local best, bestArea = nil, -1
        for _, p in ipairs(parts) do
            if p:IsA("BasePart") then
                local s = p.Size; local area = s.X*s.Y + s.X*s.Z + s.Y*s.Z
                if area > bestArea then bestArea = area; best = p end
            end
        end
        return best
    end
    if ok and found then
        if found:IsA("BasePart") then return found end
        if found:IsA("Model") then
            local parts = found:GetDescendants()
            local largest = pickLargest(parts)
            if largest then return largest end
        end
    end
    -- Fallback: any part under the container model
    local largest = pickLargest(model:GetDescendants())
    return largest
end

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
        local backGui
        -- Helper to force-mirror an image to the back surface at any time
        local function ensureBackMirror(imageString)
            local okStage, stage = pcall(function()
                return container.model and container.model:FindFirstChild("Stage", true)
            end)
            if not okStage or not stage or not stage:IsA("BasePart") then return end
            local domFront, domBack = getDominantFacePair(stage)
            local back = stage:FindFirstChild("MMLDisplaySurface_Back")
            if not back then
                back = Instance.new("SurfaceGui")
                back.Name = "MMLDisplaySurface_Back"
                back.Parent = stage
            end
            back.Face = domBack
            back.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
            back.CanvasSize = Vector2.new(1024, 576)
            back.AlwaysOnTop = false
            local bframe = back:FindFirstChild("Frame") or Instance.new("Frame")
            bframe.Name = "Frame"
            bframe.Size = UDim2.new(1, 0, 1, 0)
            bframe.BackgroundTransparency = 1
            bframe.Parent = back
            local bimg = bframe:FindFirstChild("AdImage") or Instance.new("ImageLabel")
            bimg.Name = "AdImage"
            bimg.Size = UDim2.new(1, 0, 1, 0)
            bimg.BackgroundTransparency = 1
            bimg.ScaleType = Enum.ScaleType.Fit
            bimg.Visible = true
            bimg.Parent = bframe
            if imageString and imageString ~= "" then
                bimg.Image = imageString
            end
        end
        if container.model then
            -- Recursive search for existing MMLDisplaySurface
            local okFind, found = pcall(function()
                return container.model:FindFirstChild("MMLDisplaySurface", true)
            end)
            if okFind then surfaceGui = found end
            -- Always resolve the Stage part
            local resolvedStage = resolveStageBasePart(container.model)
            -- Hard-delete any legacy decals on Stage and guard against recreation
            if resolvedStage and resolvedStage:IsA("BasePart") then
                for _, ch in ipairs(resolvedStage:GetChildren()) do
                    if ch:IsA("Decal") then ch:Destroy() end
                end
                if not container._stageDecalGuard then
                    container._stageDecalGuard = resolvedStage.DescendantAdded:Connect(function(inst)
                        if inst:IsA("Decal") then inst:Destroy() end
                    end)
                end
            end
            -- If an existing surface is parented somewhere non-renderable, reattach to Stage
            if surfaceGui and resolvedStage then
                local parentIsPart = surfaceGui.Parent and surfaceGui.Parent:IsA("BasePart")
                if (not parentIsPart) or (surfaceGui.Parent ~= resolvedStage) then
                    local domFront = getDominantFacePair(resolvedStage)
                    surfaceGui.Parent = resolvedStage
                    surfaceGui.Face = domFront
                    surfaceGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
                    surfaceGui.CanvasSize = Vector2.new(1024, 576)
                    surfaceGui.AlwaysOnTop = false
                end
            end
            -- If not found, prefer attaching to a Stage part if present
            if not surfaceGui then
                local stage = resolvedStage
                if stage and stage:IsA("BasePart") then
                    local domFront, domBack = getDominantFacePair(stage)
                    surfaceGui = Instance.new("SurfaceGui")
                    surfaceGui.Name = "MMLDisplaySurface"
                    surfaceGui.Face = domFront
                    surfaceGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
                    surfaceGui.CanvasSize = Vector2.new(1024, 576)
                    surfaceGui.AlwaysOnTop = false
                    surfaceGui.Parent = stage
                    -- ensure back surface as well
                    backGui = stage:FindFirstChild("MMLDisplaySurface_Back")
                    if not backGui then
                        local _, back = getDominantFacePair(stage)
                        backGui = Instance.new("SurfaceGui")
                        backGui.Name = "MMLDisplaySurface_Back"
                        backGui.Face = back
                        backGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
                        backGui.CanvasSize = Vector2.new(1024, 576)
                        backGui.AlwaysOnTop = false
                        backGui.Parent = stage
                    end
                end
            end
            -- if we did find a surface, also try to find/create back surface
            if surfaceGui and not backGui then
                local stage2 = resolvedStage
                if stage2 and stage2:IsA("BasePart") then
                    local _, back = getDominantFacePair(stage2)
                    backGui = stage2:FindFirstChild("MMLDisplaySurface_Back")
                    if not backGui then
                        backGui = Instance.new("SurfaceGui")
                        backGui.Name = "MMLDisplaySurface_Back"
                        backGui.Face = back
                        backGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
                        backGui.CanvasSize = Vector2.new(1024, 576)
                        backGui.AlwaysOnTop = false
                        backGui.Parent = stage2
                    else
                        backGui.Face = back
                        backGui.AlwaysOnTop = false
                    end
                end
            end
        end
        if surfaceGui and surfaceGui:IsA("SurfaceGui") then
            -- Rebuild front/back surfaces deterministically to avoid stale Face settings
            local stageForCleanup = surfaceGui.Parent
            if stageForCleanup and stageForCleanup:IsA("BasePart") then
                local domFront, domBack = getDominantFacePair(stageForCleanup)
                -- Remove all existing SurfaceGuis/Decals under Stage
                for _, child in ipairs(stageForCleanup:GetChildren()) do
                    if child:IsA("Decal") then
                        child:Destroy()
                    end
                end
                -- Keep existing official surfaces if present to avoid duplicates
                local frontExisting = stageForCleanup:FindFirstChild("MMLDisplaySurface")
                local backExisting = stageForCleanup:FindFirstChild("MMLDisplaySurface_Back")
                if not frontExisting then
                    frontExisting = Instance.new("SurfaceGui")
                    frontExisting.Name = "MMLDisplaySurface"
                    frontExisting.Parent = stageForCleanup
                end
                if not backExisting then
                    backExisting = Instance.new("SurfaceGui")
                    backExisting.Name = "MMLDisplaySurface_Back"
                    backExisting.Parent = stageForCleanup
                end
                frontExisting.Face = domFront
                backExisting.Face = domBack
                for _, g in ipairs({frontExisting, backExisting}) do
                    g.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
                    g.CanvasSize = Vector2.new(1024, 576)
                    g.AlwaysOnTop = false
                end
                surfaceGui = frontExisting
                backGui = backExisting
            end
            -- Ensure Frame and media children exist (self-heal model assumptions)
            surfaceGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
            surfaceGui.CanvasSize = Vector2.new(1024, 576)
            surfaceGui.AlwaysOnTop = false
            -- Face already set above based on dominant faces
            if backGui and backGui:IsA("SurfaceGui") then
                backGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
                backGui.CanvasSize = Vector2.new(1024, 576)
                backGui.AlwaysOnTop = false
                -- Keep back face as computed
            end

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
            -- back surface simple image mirror (no video on back to avoid duplication)
            local backImage
            if backGui and backGui:IsA("SurfaceGui") then
                local bframe = backGui:FindFirstChild("Frame")
                if not bframe then
                    bframe = Instance.new("Frame")
                    bframe.Name = "Frame"
                    bframe.Size = UDim2.new(1, 0, 1, 0)
                    bframe.BackgroundTransparency = 1
                    bframe.Parent = backGui
                end
                backImage = bframe:FindFirstChild("AdImage")
                if not backImage then
                    backImage = Instance.new("ImageLabel")
                    backImage.Name = "AdImage"
                    backImage.Size = UDim2.new(1, 0, 1, 0)
                    backImage.BackgroundTransparency = 1
                    backImage.ScaleType = Enum.ScaleType.Fit
                    backImage.Visible = false
                    backImage.Parent = bframe
                end
                -- ensure only one image under back frame
                for _, ch in ipairs(bframe:GetChildren()) do
                    if ch:IsA("ImageLabel") and ch.Name ~= "AdImage" then ch:Destroy() end
                end
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
            -- Pick best visual asset with strong preference for explicit image assets
            local function pickAssetFromApiOrder(adId)
                local okRM, RM = pcall(function() return require(script.Parent.MMLRequestManager) end)
                if not okRM or not RM or type(RM.getCachedGameAds) ~= "function" then return nil end
                local ads = RM.getCachedGameAds() or {}
                for _, ad in ipairs(ads) do
                    if ad.id == adId then
                        -- Pass A: explicit image assets first (stable API order)
                        for _, a in ipairs(ad.assets or {}) do
                            local t = string.lower(tostring(a.type or a.assetType or ""))
                            local rid = a.robloxAssetId or a.robloxId
                            if rid and (t == "image" or t == "image_asset" or t == "decal" or t == "texture") then
                                return { type = "image", id = tostring(rid), origin = t }
                            end
                        end
                        -- Pass B: multi* as image (thumbnail-preferred later)
                        for _, a in ipairs(ad.assets or {}) do
                            local t = string.lower(tostring(a.type or a.assetType or ""))
                            local rid = a.robloxAssetId or a.robloxId
                            if rid and (t == "multi_display" or t == "multimedia_display" or t == "multimediasignage") then
                                return { type = "image", id = tostring(rid), origin = t }
                            end
                        end
                        -- Pass C: video
                        for _, a in ipairs(ad.assets or {}) do
                            local t = string.lower(tostring(a.type or a.assetType or ""))
                            local rid = a.robloxAssetId or a.robloxId
                            if rid and (t == "video" or t == "video_frame") then
                                return { type = "video", id = tostring(rid), origin = t }
                            end
                        end
                    end
                end
                return nil
            end
            local function normalizeAsset(assetInfo)
                local data = assetInfo and assetInfo.assetData or {}
                local originalType = string.lower(tostring(data.type or data.assetType or ""))
                local normalizedType = originalType
                local rid = data.robloxAssetId or data.robloxId
                if normalizedType == "decal" or normalizedType == "texture" or normalizedType == "image_asset" then normalizedType = "image" end
                if normalizedType == "multi_display" or normalizedType == "multimedia_display" or normalizedType == "multimediasignage" then
                    -- Keep normalized as image, but tag original for de-prioritization if needed
                    normalizedType = "image"
                end
                if normalizedType == "video_frame" then normalizedType = "video" end
                return normalizedType, rid, originalType
            end

            local chosen = pickAssetFromApiOrder(adId)
            if not chosen then
                -- Fallback to scanning preloaded data if API cache missing
                -- Pass 1: strictly prefer explicit image assets (not multi_display variants)
                for _, assetInfo in pairs(preloadedAd.assets) do
                    local at, rid, ot = normalizeAsset(assetInfo)
                    if rid and at == "image" and (ot == "image" or ot == "image_asset" or ot == "decal" or ot == "texture") then
                        chosen = { type = at, id = rid, origin = ot }
                        break
                    end
                end
                -- Pass 2: accept multi_display-derived images
                if not chosen then
                    for _, assetInfo in pairs(preloadedAd.assets) do
                        local at, rid, ot = normalizeAsset(assetInfo)
                        if rid and at == "image" then
                            chosen = { type = at, id = rid, origin = ot }
                            break
                        end
                    end
                end
                -- Pass 3: accept video
                if not chosen then
                    for _, assetInfo in pairs(preloadedAd.assets) do
                        local at, rid, ot = normalizeAsset(assetInfo)
                        if rid and at == "video" then
                            chosen = { type = at, id = rid, origin = ot }
                            break
                        end
                    end
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
                -- Optional fallback logo support (per-image attribute or global config)
                local function getFallbackAssetId()
                    local fid = nil
                    pcall(function()
                        if imageLabel then
                            local a = imageLabel:GetAttribute("FallbackAssetId")
                            if a and tostring(a) ~= "" then fid = tostring(a) end
                        end
                    end)
                    if not fid and _G and _G.MMLNetwork and _G.MMLNetwork._config then
                        local c = _G.MMLNetwork._config.fallbackImageAssetId
                        if c and tostring(c) ~= "" then fid = tostring(c) end
                    end
                    if not fid then
                        local okCfg, cfg = pcall(function()
                            local ss = game:GetService("ServerStorage")
                            local m = ss and ss:FindFirstChild("MMLConfig")
                            return m and require(m) or nil
                        end)
                        if okCfg and type(cfg) == "table" and cfg.fallbackImageAssetId then
                            fid = tostring(cfg.fallbackImageAssetId)
                        end
                    end
                    return fid
                end
                if chosen.type == "video" and videoFrame then
                    -- Show a thumbnail placeholder immediately to avoid blank surface
                    if imageLabel then
                        imageLabel.Visible = true
                        imageLabel.Image = ("rbxthumb://type=Asset&id=%s&w=480&h=270"):format(tostring(chosen.id))
                    end
                    if backImage then
                        backImage.Visible = true
                        backImage.Image = imageLabel and imageLabel.Image or ("rbxthumb://type=Asset&id=%s&w=480&h=270"):format(tostring(chosen.id))
                    end
                    -- Start video on top; if it fails to load the thumbnail remains
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
                    if backImage then backImage.Visible = true end
                    -- Keep faces fixed to dominant sides; do not flip based on camera

                    -- Force thumbnail-only for reliability; skip upgrade to direct asset
                    local preferThumbnail = true

                    -- If a correct direct asset is already loaded, keep it (idempotent)
                    local currentId, currentKind = parseImageId(imageLabel.Image)
                    if currentKind == "asset" and tostring(currentId) == tostring(chosen.id) and imageLabel.IsLoaded then
                        -- Already good; do not overwrite
                        return true
                    end

                    local function setDirectThenFallback()
                        imageLabel.Image = ("rbxassetid://%s"):format(tostring(chosen.id))
                        -- On server, do not fallback based on IsLoaded; client will resolve
                        if RunService:IsServer() then
                            return
                        end
                        -- Client-side: Wait briefly for load; fallback to thumbnail if it fails
                        local t0 = tick()
                        while not imageLabel.IsLoaded and tick() - t0 < 4.0 do
                            wait(0.1)
                        end
                        if not imageLabel.IsLoaded then
                            imageLabel.Image = ("rbxthumb://type=Asset&id=%s&w=480&h=270"):format(tostring(chosen.id))
                        end
                    end

                    if preferThumbnail then
                        local fid = getFallbackAssetId()
                        if fid then
                            imageLabel.Image = ("rbxthumb://type=Asset&id=%s&w=480&h=270"):format(tostring(fid))
                        else
                            imageLabel.Image = ("rbxthumb://type=Asset&id=%s&w=480&h=270"):format(tostring(chosen.id))
                        end
                        if backImage then backImage.Image = imageLabel.Image end
                        ensureBackMirror(imageLabel.Image)
                    else
                        setDirectThenFallback()
                        if backImage then backImage.Image = imageLabel.Image end
                        ensureBackMirror(imageLabel.Image)
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
                if not fallbackRid then
                    fallbackRid = getFallbackAssetId()
                end
                if fallbackRid then
                    if videoFrame then
                        videoFrame.Playing = false
                        videoFrame.Visible = false
                    end
                    imageLabel.Visible = true
                    if backGui then
                        local bframe = backGui:FindFirstChild("Frame")
                        local bimg = bframe and bframe:FindFirstChild("AdImage")
                        if bimg then bimg.Visible = true end
                    end
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
                        if backGui then
                            local bframe2 = backGui:FindFirstChild("Frame")
                            local bimg2 = bframe2 and bframe2:FindFirstChild("AdImage")
                            if bimg2 then bimg2.Image = imageLabel.Image end
                        end
                        ensureBackMirror(imageLabel.Image)
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
            -- Safety sweep each tick: remove legacy decals and ensure both surfaces exist
            local okStageSweep, stageSweep = pcall(function()
                return container.model and container.model:FindFirstChild("Stage", true)
            end)
            if okStageSweep and stageSweep and stageSweep:IsA("BasePart") then
                -- Remove any decals that might have been reintroduced
                for _, ch in ipairs(stageSweep:GetChildren()) do
                    if ch:IsA("Decal") then ch:Destroy() end
                end
                -- Ensure both official surfaces exist
                local front = stageSweep:FindFirstChild("MMLDisplaySurface") or Instance.new("SurfaceGui", stageSweep)
                front.Name = "MMLDisplaySurface"
                front.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
                front.CanvasSize = Vector2.new(1024,576)
                front.AlwaysOnTop = false
                local back = stageSweep:FindFirstChild("MMLDisplaySurface_Back") or Instance.new("SurfaceGui", stageSweep)
                back.Name = "MMLDisplaySurface_Back"
                back.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
                back.CanvasSize = Vector2.new(1024,576)
                back.AlwaysOnTop = false
                -- Set faces to dominant pair
                local f,b = getDominantFacePair(stageSweep)
                front.Face = f; back.Face = b
            end
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
    
    -- Helper: prefer ads that contain an explicit image asset
    local function hasExplicitImage(adId)
        local okRM, RM = pcall(function() return require(script.Parent.MMLRequestManager) end)
        if not okRM or not RM or type(RM.getCachedGameAds) ~= "function" then return false end
        local ads = RM.getCachedGameAds() or {}
        for _, ad in ipairs(ads) do
            if ad.id == adId then
                for _, a in ipairs(ad.assets or {}) do
                    local t = string.lower(tostring(a.type or a.assetType or ""))
                    if t == "image" or t == "image_asset" or t == "decal" or t == "texture" then
                        return true
                    end
                end
            end
        end
        return false
    end

    -- Distribute selection across containers using epoch + container-hash to avoid sync
    if #container.adRotation.availableAds > 0 then
        local ads = container.adRotation.availableAds
        local adCount = #ads
        local currentTime = tick()
        local rotationInterval = math.max(1, container.adRotation.rotationInterval)

        if not container._hash then
            local hash = 0
            for i = 1, #containerId do
                hash = (hash * 31 + string.byte(containerId, i)) % 100000
            end
            container._hash = hash
        end

        local epoch = math.floor(currentTime / rotationInterval)
        local baseIndex = (epoch % adCount) + 1
        local idx = (((baseIndex - 1) + (container._hash % adCount)) % adCount) + 1
        container.adRotation.currentAdIndex = idx
            container.adRotation.lastRotation = currentTime

        -- Candidate based on index
        local candidate = ads[idx]

        -- If candidate lacks an image but another ad has one, prefer that for initial render
        if not hasExplicitImage(candidate) then
            for _, aid in ipairs(ads) do
                if hasExplicitImage(aid) then
                    candidate = aid
                    break
                end
            end
        end

        -- Avoid duplication if another container is already showing the same ad
        for otherId, other in pairs(_G.MMLNetwork._containers) do
            if otherId ~= containerId and other.adRotation and other.adRotation.currentAdId == candidate and adCount > 1 then
                -- choose the next ad in list
                for step = 1, adCount do
                    local alt = ads[((idx - 1 + step) % adCount) + 1]
                    if alt ~= candidate then
                        candidate = alt
                        break
                    end
                end
                break
            end
        end

        return candidate
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