-- src/roblox/MMLAssetStorage.lua
-- Asset Storage System for MML Network
-- Pre-loads all game ad assets below the map for smooth streaming

local MMLAssetStorage = {}

local TweenService = game:GetService("TweenService")
local ContentProvider = game:GetService("ContentProvider")
local Workspace = game:GetService("Workspace")
local HttpService = game:GetService("HttpService")

-- Storage configuration
local STORAGE_CONFIG = {
    storageDepth = -500,           -- 500 studs below map
    storageSpacing = 50,           -- 50 studs between ad storage areas
    preloadTimeout = 30,           -- 30 seconds max per asset
    maxConcurrentLoads = 5,        -- Limit concurrent asset loading
    cleanupInterval = 600          -- Clean unused assets every 10 minutes
}

-- Global storage management
local globalStorage = {
    storageFolder = nil,
    nextStoragePosition = Vector3.new(0, STORAGE_CONFIG.storageDepth, 0),
    loadingQueue = {},
    activeLoads = 0,
    preloadedAds = {},             -- adId -> {assets, storageArea, lastUsed}
    isInitialized = false
}

-- Initialize global asset storage
function MMLAssetStorage.initialize()
    if globalStorage.isInitialized then
        print("⚠️ MML Asset Storage already initialized")
        return true
    end
    
    -- Create main storage folder below the map
    globalStorage.storageFolder = Instance.new("Folder")
    globalStorage.storageFolder.Name = "MMLAssetStorage"
    globalStorage.storageFolder.Parent = Workspace
    
    -- Set initial position
    globalStorage.nextStoragePosition = Vector3.new(0, STORAGE_CONFIG.storageDepth, 0)
    
    globalStorage.isInitialized = true
    
    print("🏪 MML Asset Storage initialized at depth:", STORAGE_CONFIG.storageDepth)
    
    -- Start cleanup routine
    spawn(function()
        while globalStorage.isInitialized do
            wait(STORAGE_CONFIG.cleanupInterval)
            MMLAssetStorage.cleanupUnusedAssets()
        end
    end)
    
    -- Start loading queue processor
    spawn(function()
        while globalStorage.isInitialized do
            MMLAssetStorage.processLoadingQueue()
            wait(1)
        end
    end)
    
    return true
end

-- Pre-load all game ads at game start
function MMLAssetStorage.preloadAllGameAds(gameAdsData)
    if not globalStorage.isInitialized then
        warn("❌ Asset Storage not initialized")
        return false
    end
    
    print("📦 Starting pre-load of", #gameAdsData, "game ads...")
    
    for _, adData in pairs(gameAdsData) do
        MMLAssetStorage.queueAdForPreload(adData)
    end
    
    print("✅ Queued", #gameAdsData, "ads for pre-loading")
    return true
end

-- Queue a game ad for asset pre-loading
function MMLAssetStorage.queueAdForPreload(adData)
    if not adData or not adData.id then
        warn("❌ Invalid ad data for preload")
        return false
    end
    
    if globalStorage.preloadedAds[adData.id] then
        print("⚠️ Ad already preloaded:", adData.id)
        return true
    end
    
    table.insert(globalStorage.loadingQueue, {
        adId = adData.id,
        adType = adData.type,
        assets = adData.assets or {},
        priority = adData.priority or 1,
        queueTime = tick()
    })
    
    return true
end

-- Process the asset loading queue
function MMLAssetStorage.processLoadingQueue()
    if #globalStorage.loadingQueue == 0 or 
       globalStorage.activeLoads >= STORAGE_CONFIG.maxConcurrentLoads then
        return
    end
    
    -- Get highest priority item from queue
    table.sort(globalStorage.loadingQueue, function(a, b)
        return a.priority > b.priority
    end)
    
    local loadTask = table.remove(globalStorage.loadingQueue, 1)
    globalStorage.activeLoads = globalStorage.activeLoads + 1
    
    spawn(function()
        MMLAssetStorage.preloadAdAssets(loadTask)
        globalStorage.activeLoads = globalStorage.activeLoads - 1
    end)
end

-- Pre-load assets for a specific game ad
function MMLAssetStorage.preloadAdAssets(loadTask)
    local adId = loadTask.adId
    local assets = loadTask.assets
    
    print("🔄 Pre-loading assets for ad:", adId, "(", #assets, "assets)")
    
    -- Create storage area for this ad
    local storageArea = Instance.new("Folder")
    storageArea.Name = "Ad_" .. adId
    storageArea.Parent = globalStorage.storageFolder
    
    -- Calculate storage position
    local storagePosition = globalStorage.nextStoragePosition
    globalStorage.nextStoragePosition = globalStorage.nextStoragePosition + 
                                       Vector3.new(STORAGE_CONFIG.storageSpacing, 0, 0)
    
    local preloadedAssets = {}
    local loadStartTime = tick()
    
    -- Pre-load each asset
    for _, assetData in pairs(assets) do
        local success, assetInstance = pcall(function()
            return MMLAssetStorage.createAssetInstance(assetData, storagePosition, storageArea)
        end)
        
        if success and assetInstance then
            preloadedAssets[assetData.id] = {
                instance = assetInstance,
                assetData = assetData,
                storagePosition = assetInstance.CFrame or CFrame.new(assetInstance.Position)
            }
            print("✅ Pre-loaded asset:", assetData.id, "for ad:", adId)
        else
            -- Store a placeholder so renderers can fall back to direct draw
            preloadedAssets[assetData.id] = {
                instance = nil,
                assetData = assetData,
                storagePosition = nil
            }
            -- downgrade noise; we will fallback to cached draw
            warn("⚠️ Skipping preload, will render from cache for asset:", assetData.id)
        end
        
        -- Timeout check
        if (tick() - loadStartTime) > STORAGE_CONFIG.preloadTimeout then
            warn("⏰ Pre-load timeout for ad:", adId)
            break
        end
    end
    
    -- Store the pre-loaded ad data
    globalStorage.preloadedAds[adId] = {
        assets = preloadedAssets,
        storageArea = storageArea,
        storagePosition = storagePosition,
        lastUsed = tick(),
        loadTime = tick() - loadStartTime,
        assetCount = #assets,
        successCount = 0
    }
    
    -- Count successful loads
    for _, v in pairs(preloadedAssets) do
        if v.instance then
            globalStorage.preloadedAds[adId].successCount = globalStorage.preloadedAds[adId].successCount + 1
        end
    end
    
    print("🎯 Pre-loaded ad:", adId, 
          "Success:", globalStorage.preloadedAds[adId].successCount, 
          "Total:", #assets,
          "Time:", math.round((tick() - loadStartTime) * 100) / 100, "s")
end

-- Create an asset instance in storage (after helper functions are defined)
function MMLAssetStorage.createAssetInstance(assetData, storageBasePosition, parentFolder)
    if not assetData then
        warn("❌ Invalid asset data")
        return nil
    end

    -- Normalize field names coming from API
    local assetType = assetData.type or assetData.assetType
    local robloxAssetId = assetData.robloxAssetId or assetData.robloxId
    local assetId = assetData.id or assetData.assetId

    if not assetType then
        warn("❌ Invalid asset data (missing type)")
        return nil
    end

    if assetType == "image" then
        return createImageAsset({ id = assetId, type = assetType, robloxAssetId = robloxAssetId }, storageBasePosition, parentFolder)
        
    elseif assetType == "multiMediaSignage" then
        return create3DModelAsset({ id = assetId, type = assetType, robloxAssetId = robloxAssetId }, storageBasePosition, parentFolder)
        
    elseif assetType == "video" then
        return createVideoAsset({ id = assetId, type = assetType, robloxAssetId = robloxAssetId }, storageBasePosition, parentFolder)
        
    elseif assetType == "npc_character" then
        return createNPCAsset({ id = assetId, type = assetType, robloxAssetId = robloxAssetId }, storageBasePosition, parentFolder)
        
    elseif assetType == "clothing_top" or assetType == "clothing_bottom" or assetType == "shoes" then
        return createClothingAsset({ id = assetId, type = assetType, robloxAssetId = robloxAssetId }, storageBasePosition, parentFolder)
        
    elseif assetType == "animation" then
        return createAnimationAsset({ id = assetId, type = assetType, robloxAssetId = robloxAssetId }, storageBasePosition, parentFolder)
        
    elseif assetType == "audio" then
        return createAudioAsset({ id = assetId, type = assetType, robloxAssetId = robloxAssetId }, storageBasePosition, parentFolder)
        
    elseif assetType == "minigame" then
        return createMinigameAsset({ id = assetId, type = assetType, robloxAssetId = robloxAssetId }, storageBasePosition, parentFolder)
        
    else
        warn("❓ Unknown asset type:", assetType)
        return nil
    end
end

-- Asset creation functions
local createImageAsset
local create3DModelAsset
local createVideoAsset
local createNPCAsset
local createClothingAsset
local createAnimationAsset
local createAudioAsset
local createMinigameAsset

createImageAsset = function(assetData, storagePosition, parentFolder)
    if not assetData.robloxAssetId then
        warn("❌ No Roblox Asset ID for image asset:", assetData.id)
        return nil
    end
    
    -- Pre-load the image content
    local imageId = "rbxassetid://" .. assetData.robloxAssetId
    local success, _ = pcall(function()
        ContentProvider:PreloadAsync({imageId})
    end)
    
    if not success then
        warn("❌ Failed to preload image:", imageId)
    end
    
    -- Create a part to hold the image (invisible in storage)
    local part = Instance.new("Part")
    part.Name = "ImageAsset_" .. assetData.id
    part.Size = Vector3.new(0.2, 0.2, 0.2)
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1  -- Invisible in storage
    part.Position = storagePosition + Vector3.new(math.random(-10, 10), math.random(-5, 5), math.random(-10, 10))
    part.Parent = parentFolder
    
    -- Create SurfaceGui with the image
    local surfaceGui = Instance.new("SurfaceGui")
    surfaceGui.Name = "ImageSurface"
    surfaceGui.Face = Enum.NormalId.Front
    surfaceGui.LightInfluence = 0
    surfaceGui.Enabled = false  -- Disabled in storage
    surfaceGui.Parent = part
    
    local imageLabel = Instance.new("ImageLabel")
    imageLabel.Name = "AdImage"
    imageLabel.Size = UDim2.new(1, 0, 1, 0)
    imageLabel.BackgroundTransparency = 1
    imageLabel.Image = imageId
    imageLabel.ScaleType = Enum.ScaleType.Fit
    imageLabel.Parent = surfaceGui
    
    -- Store metadata
    part:SetAttribute("AssetId", assetData.id)
    part:SetAttribute("AssetType", assetData.type)
    part:SetAttribute("RobloxAssetId", assetData.robloxAssetId)
    
    return part
end

-- NEW: Create 3D model asset using InsertService
create3DModelAsset = function(assetData, storagePosition, parentFolder)
    if not assetData.robloxAssetId then
        warn("❌ No Roblox Asset ID for 3D model asset:", assetData.id)
        return nil
    end
    
    local InsertService = game:GetService("InsertService")
    
    -- Load 3D model using InsertService
    local success, model = pcall(function()
        return InsertService:LoadAsset(tonumber(assetData.robloxAssetId))
    end)
    
    if not success or not model then
        warn("❌ Failed to load 3D model:", assetData.robloxAssetId, "Error:", tostring(model))
        return nil
    end
    
    -- Get the actual model from the returned folder
    local actualModel = model:GetChildren()[1]
    if actualModel then
        actualModel.Name = "ModelAsset_" .. assetData.id
        actualModel.Parent = parentFolder
        
        -- Position the model in storage
        if actualModel.PrimaryPart then
            actualModel:SetPrimaryPartCFrame(CFrame.new(storagePosition + Vector3.new(math.random(-30, 30), 5, math.random(-30, 30))))
        else
            -- Position first part if no primary part
            local firstPart = actualModel:FindFirstChildOfClass("Part")
            if firstPart then
                firstPart.Position = storagePosition + Vector3.new(math.random(-30, 30), 5, math.random(-30, 30))
            end
        end
        
        -- Make model invisible in storage
        for _, part in pairs(actualModel:GetDescendants()) do
            if part:IsA("BasePart") then
                part.Transparency = 1
            end
        end
        
        -- Store metadata
        actualModel:SetAttribute("AssetId", assetData.id)
        actualModel:SetAttribute("AssetType", assetData.type)
        actualModel:SetAttribute("RobloxAssetId", assetData.robloxAssetId)
        
        -- Clean up the original model container
        model:Destroy()
        
        print("✅ Pre-loaded 3D model:", assetData.id, "at storage position")
        return actualModel
    else
        warn("❌ No model found in loaded asset:", assetData.robloxAssetId)
        model:Destroy()
        return nil
    end
end

createVideoAsset = function(assetData, storagePosition, parentFolder)
    if not assetData.robloxAssetId then
        warn("❌ No Roblox Asset ID for video asset:", assetData.id)
        return nil
    end
    
    local videoId = "rbxassetid://" .. assetData.robloxAssetId
    local success, _ = pcall(function()
        ContentProvider:PreloadAsync({videoId})
    end)
    
    if not success then
        warn("❌ Failed to preload video:", videoId)
    end
    
    local part = Instance.new("Part")
    part.Name = "VideoAsset_" .. assetData.id
    part.Size = Vector3.new(0.2, 0.2, 0.2)
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Position = storagePosition + Vector3.new(math.random(-10, 10), math.random(-5, 5), math.random(-10, 10))
    part.Parent = parentFolder
    
    local surfaceGui = Instance.new("SurfaceGui")
    surfaceGui.Name = "VideoSurface"
    surfaceGui.Face = Enum.NormalId.Front
    surfaceGui.LightInfluence = 0
    surfaceGui.Enabled = false
    surfaceGui.Parent = part
    
    local videoFrame = Instance.new("VideoFrame")
    videoFrame.Name = "AdVideo"
    videoFrame.Size = UDim2.new(1, 0, 1, 0)
    videoFrame.BackgroundTransparency = 1
    videoFrame.Video = videoId
    videoFrame.Looped = true
    videoFrame.Volume = 0  -- Start muted
    videoFrame.Playing = false  -- Start paused
    videoFrame.Parent = surfaceGui
    
    part:SetAttribute("AssetId", assetData.id)
    part:SetAttribute("AssetType", assetData.type)
    part:SetAttribute("RobloxAssetId", assetData.robloxAssetId)
    
    return part
end

createNPCAsset = function(assetData, storagePosition, parentFolder)
    -- Create character model
    local npcModel = Instance.new("Model")
    npcModel.Name = "NPCAsset_" .. assetData.id
    npcModel.Parent = parentFolder
    
    -- Create humanoid and basic parts
    local humanoid = Instance.new("Humanoid")
    humanoid.Parent = npcModel
    
    local head = Instance.new("Part")
    head.Name = "Head"
    head.Size = Vector3.new(2, 1, 1)
    head.TopSurface = Enum.SurfaceType.Smooth
    head.BrickColor = BrickColor.new("Light orange")
    head.Parent = npcModel
    
    local torso = Instance.new("Part")
    torso.Name = "Torso"
    torso.Size = Vector3.new(2, 2, 1)
    torso.TopSurface = Enum.SurfaceType.Smooth
    torso.BrickColor = BrickColor.new("Bright blue")
    torso.Anchored = true
    torso.Position = storagePosition + Vector3.new(math.random(-20, 20), 3, math.random(-20, 20))
    torso.Parent = npcModel
    
    -- Create neck joint
    local neck = Instance.new("Motor6D")
    neck.Name = "Neck"
    neck.Part0 = torso
    neck.Part1 = head
    neck.C0 = CFrame.new(0, 1, 0) * CFrame.Angles(math.rad(-90), 0, math.rad(180))
    neck.C1 = CFrame.new(0, -0.5, 0) * CFrame.Angles(math.rad(-90), 0, math.rad(180))
    neck.Parent = torso
    
    -- Set head position relative to torso
    head.CFrame = torso.CFrame + Vector3.new(0, 1.5, 0)
    
    npcModel.PrimaryPart = torso
    humanoid.RootPart = torso
    
    -- Pre-load character assets if specified
    if assetData.robloxAssetId then
        local characterAssetId = "rbxassetid://" .. assetData.robloxAssetId
        local success, _ = pcall(function()
            ContentProvider:PreloadAsync({characterAssetId})
        end)
        
        if not success then
            warn("❌ Failed to preload character asset:", characterAssetId)
        end
    end
    
    -- Store metadata
    npcModel:SetAttribute("AssetId", assetData.id)
    npcModel:SetAttribute("AssetType", assetData.type)
    npcModel:SetAttribute("RobloxAssetId", assetData.robloxAssetId or "")
    
    return npcModel
end

createClothingAsset = function(assetData, storagePosition, parentFolder)
    -- Create a simple part to represent clothing asset
    local part = Instance.new("Part")
    part.Name = assetData.type .. "Asset_" .. assetData.id
    part.Size = Vector3.new(1, 1, 1)
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Position = storagePosition + Vector3.new(math.random(-5, 5), math.random(-2, 2), math.random(-5, 5))
    part.Parent = parentFolder
    
    -- Store clothing ID for later application
    if assetData.robloxAssetId then
        local clothingId = "rbxassetid://" .. assetData.robloxAssetId
        local success, _ = pcall(function()
            ContentProvider:PreloadAsync({clothingId})
        end)
        
        if not success then
            warn("❌ Failed to preload clothing asset:", clothingId)
        end
    end
    
    part:SetAttribute("AssetId", assetData.id)
    part:SetAttribute("AssetType", assetData.type)
    part:SetAttribute("RobloxAssetId", assetData.robloxAssetId or "")
    
    return part
end

createAnimationAsset = function(assetData, storagePosition, parentFolder)
    local part = Instance.new("Part")
    part.Name = "AnimationAsset_" .. assetData.id
    part.Size = Vector3.new(0.5, 0.5, 0.5)
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Position = storagePosition + Vector3.new(math.random(-3, 3), math.random(-1, 1), math.random(-3, 3))
    part.Parent = parentFolder
    
    if assetData.robloxAssetId then
        local animationId = "rbxassetid://" .. assetData.robloxAssetId
        local success, _ = pcall(function()
            ContentProvider:PreloadAsync({animationId})
        end)
        
        if not success then
            warn("❌ Failed to preload animation asset:", animationId)
        end
    end
    
    part:SetAttribute("AssetId", assetData.id)
    part:SetAttribute("AssetType", assetData.type)
    part:SetAttribute("RobloxAssetId", assetData.robloxAssetId or "")
    
    return part
end

createAudioAsset = function(assetData, storagePosition, parentFolder)
    local part = Instance.new("Part")
    part.Name = "AudioAsset_" .. assetData.id
    part.Size = Vector3.new(0.3, 0.3, 0.3)
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Position = storagePosition + Vector3.new(math.random(-3, 3), math.random(-1, 1), math.random(-3, 3))
    part.Parent = parentFolder
    
    if assetData.robloxAssetId then
        local audioId = "rbxassetid://" .. assetData.robloxAssetId
        local success, _ = pcall(function()
            ContentProvider:PreloadAsync({audioId})
        end)
        
        if not success then
            warn("❌ Failed to preload audio asset:", audioId)
        end
        
        -- Create sound object
        local sound = Instance.new("Sound")
        sound.Name = "AdAudio"
        sound.SoundId = audioId
        sound.Volume = 0
        sound.Playing = false
        sound.Parent = part
    end
    
    part:SetAttribute("AssetId", assetData.id)
    part:SetAttribute("AssetType", assetData.type)
    part:SetAttribute("RobloxAssetId", assetData.robloxAssetId or "")
    
    return part
end

createMinigameAsset = function(assetData, storagePosition, parentFolder)
    local model = Instance.new("Model")
    model.Name = "MinigameAsset_" .. assetData.id
    model.Parent = parentFolder
    
    -- Create a placeholder part for the minigame
    local part = Instance.new("Part")
    part.Name = "MinigameCore"
    part.Size = Vector3.new(2, 2, 2)
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Position = storagePosition + Vector3.new(math.random(-15, 15), 1, math.random(-15, 15))
    part.Parent = model
    
    if assetData.robloxAssetId then
        local minigameId = "rbxassetid://" .. assetData.robloxAssetId
        local success, _ = pcall(function()
            ContentProvider:PreloadAsync({minigameId})
        end)
        
        if not success then
            warn("❌ Failed to preload minigame asset:", minigameId)
        end
    end
    
    model:SetAttribute("AssetId", assetData.id)
    model:SetAttribute("AssetType", assetData.type)
    model:SetAttribute("RobloxAssetId", assetData.robloxAssetId or "")
    
    return model
end

-- Get pre-loaded assets for an ad
function MMLAssetStorage.getPreloadedAd(adId)
    return globalStorage.preloadedAds[adId]
end

-- Check if ad is pre-loaded
function MMLAssetStorage.isAdPreloaded(adId)
    return globalStorage.preloadedAds[adId] ~= nil
end

-- Clean up unused assets
function MMLAssetStorage.cleanupUnusedAssets()
    local currentTime = tick()
    local maxUnusedTime = 1800  -- 30 minutes
    local cleanedCount = 0
    
    for adId, adData in pairs(globalStorage.preloadedAds) do
        if (currentTime - adData.lastUsed) > maxUnusedTime then
            -- Clean up old unused assets
            if adData.storageArea then
                adData.storageArea:Destroy()
            end
            globalStorage.preloadedAds[adId] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    if cleanedCount > 0 then
        print("🧹 Cleaned up", cleanedCount, "unused ad assets")
    end
end

-- Get storage statistics
function MMLAssetStorage.getStorageStats()
    local stats = {
        totalAds = 0,
        totalAssets = 0,
        activeLoads = globalStorage.activeLoads,
        queueLength = #globalStorage.loadingQueue,
        isInitialized = globalStorage.isInitialized
    }
    
    for adId, adData in pairs(globalStorage.preloadedAds) do
        stats.totalAds = stats.totalAds + 1
        stats.totalAssets = stats.totalAssets + adData.successCount
    end
    
    return stats
end

-- Shutdown storage system
function MMLAssetStorage.shutdown()
    globalStorage.isInitialized = false
    
    if globalStorage.storageFolder then
        globalStorage.storageFolder:Destroy()
        globalStorage.storageFolder = nil
    end
    
    globalStorage.preloadedAds = {}
    globalStorage.loadingQueue = {}
    globalStorage.activeLoads = 0
    
    print("🔴 MML Asset Storage shutdown")
end

return MMLAssetStorage 