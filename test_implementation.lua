-- test_implementation.lua
-- Test script for Multi-Ad Container System
-- Run this in Roblox Studio to verify the implementation

local MMLNetwork = require(script.Parent.MMLGameNetwork)

-- Test configuration
local TEST_CONFIG = {
    apiKey = "RBXG-test-key-12345",
    baseUrl = "http://23.96.197.67:3000/api/v1",
    enableAssetPreloading = true,
    enableFeedingEngine = true,
    debugMode = true
}

-- Sample game ads for testing
local SAMPLE_GAME_ADS = {
    {
        id = "ad_001",
        type = "multimedia_display",
        assets = {
            {
                id = "asset_001",
                type = "image",
                robloxAssetId = "87526574011188"
            }
        }
    },
    {
        id = "ad_002", 
        type = "dancing_npc",
        assets = {
            {
                id = "asset_002",
                type = "npc_character",
                robloxAssetId = "12345"
            }
        }
    },
    {
        id = "ad_003",
        type = "minigame_ad",
        assets = {
            {
                id = "asset_003",
                type = "minigame",
                robloxAssetId = "67890"
            }
        }
    }
}

-- Create test containers in workspace
local function createTestContainers()
    print("🏗️ Creating test containers...")
    
    -- Create Display Container
    local displayModel = Instance.new("Model")
    displayModel.Name = "TestDisplayContainer"
    displayModel.Parent = workspace
    
    local displayPart = Instance.new("Part")
    displayPart.Name = "DisplaySurface"
    displayPart.Size = Vector3.new(10, 5, 0.2)
    displayPart.Position = Vector3.new(0, 10, 0)
    displayPart.Anchored = true
    displayPart.Parent = displayModel
    
    -- Add metadata
    local metadata = Instance.new("Folder")
    metadata.Name = "MMLMetadata"
    metadata.Parent = displayModel
    
    local containerType = Instance.new("StringValue")
    containerType.Name = "ContainerType"
    containerType.Value = "DISPLAY"
    containerType.Parent = metadata
    
    -- Create NPC Container
    local npcModel = Instance.new("Model")
    npcModel.Name = "TestNPCContainer"
    npcModel.Parent = workspace
    
    local npcPart = Instance.new("Part")
    npcPart.Name = "NPCSpawnPoint"
    npcPart.Size = Vector3.new(4, 7, 4)
    npcPart.Position = Vector3.new(15, 3.5, 0)
    npcPart.Anchored = true
    npcPart.Parent = npcModel
    
    local npcMetadata = Instance.new("Folder")
    npcMetadata.Name = "MMLMetadata"
    npcMetadata.Parent = npcModel
    
    local npcType = Instance.new("StringValue")
    npcType.Name = "ContainerType"
    npcType.Value = "NPC"
    npcType.Parent = npcMetadata
    
    -- Create Minigame Container
    local minigameModel = Instance.new("Model")
    minigameModel.Name = "TestMinigameContainer"
    minigameModel.Parent = workspace
    
    local minigamePart = Instance.new("Part")
    minigamePart.Name = "GameZone"
    minigamePart.Size = Vector3.new(10, 1, 10)
    minigamePart.Position = Vector3.new(-15, 0.5, 0)
    minigamePart.Anchored = true
    minigamePart.Parent = minigameModel
    
    local minigameMetadata = Instance.new("Folder")
    minigameMetadata.Name = "MMLMetadata"
    minigameMetadata.Parent = minigameModel
    
    local minigameType = Instance.new("StringValue")
    minigameType.Name = "ContainerType"
    minigameType.Value = "MINIGAME"
    minigameType.Parent = minigameMetadata
    
    print("✅ Test containers created")
    return {displayModel, npcModel, minigameModel}
end

-- Run comprehensive tests
local function runTests()
    print("🧪 Starting MML Network Implementation Tests...")
    print("=" .. string.rep("=", 50))
    
    -- Step 1: Create test environment
    local testContainers = createTestContainers()
    
    -- Step 2: Initialize MML Network
    print("\n📋 Test 1: Initialize MML Network")
    local success, result = pcall(function()
        return MMLNetwork.Initialize(TEST_CONFIG)
    end)
    
    if success then
        print("✅ MML Network initialized successfully")
    else
        print("❌ MML Network initialization failed:", result)
        return
    end
    
    wait(3) -- Wait for subsystems to initialize
    
    -- Step 3: Test Asset Storage
    print("\n📋 Test 2: Asset Storage System")
    local MMLAssetStorage = require(script.Parent.MMLAssetStorage)
    
    if MMLAssetStorage then
        -- Test pre-loading
        local preloadSuccess = MMLAssetStorage.preloadAllGameAds(SAMPLE_GAME_ADS)
        print(preloadSuccess and "✅ Asset pre-loading initiated" or "❌ Asset pre-loading failed")
        
        wait(5) -- Wait for pre-loading
        
        -- Check storage stats
        local stats = MMLAssetStorage.getStorageStats()
        print("📊 Storage Stats:", stats.totalAds, "ads,", stats.totalAssets, "assets")
    else
        print("❌ MMLAssetStorage module not found")
    end
    
    -- Step 4: Test Container Manager
    print("\n📋 Test 3: Container Manager")
    local MMLContainerManager = require(script.Parent.MMLContainerManager)
    
    if MMLContainerManager then
        -- Test container creation
        local containerId1 = MMLNetwork.CreateContainer({
            id = "test_display_001",
            type = "DISPLAY",
            model = testContainers[1]
        })
        
        local containerId2 = MMLNetwork.CreateContainer({
            id = "test_npc_001", 
            type = "NPC",
            model = testContainers[2]
        })
        
        local containerId3 = MMLNetwork.CreateContainer({
            id = "test_minigame_001",
            type = "MINIGAME",
            model = testContainers[3]
        })
        
        if containerId1 and containerId2 and containerId3 then
            print("✅ Containers created successfully")
            
            -- Test ad assignment
            MMLNetwork.UpdateContainerAds("test_display_001", {"ad_001", "ad_002"})
            MMLNetwork.UpdateContainerAds("test_npc_001", {"ad_002"})
            MMLNetwork.UpdateContainerAds("test_minigame_001", {"ad_003"})
            print("✅ Container ads assigned")
        else
            print("❌ Container creation failed")
        end
    else
        print("❌ MMLContainerManager module not found")
    end
    
    -- Step 5: Test Container Streamer
    print("\n📋 Test 4: Container Streamer")
    local MMLContainerStreamer = require(script.Parent.MMLContainerStreamer)
    
    if MMLContainerStreamer then
        -- Test visibility monitoring
        local stats = MMLContainerStreamer.getMovementStats()
        print("📊 Streamer Stats:", "Monitoring:", stats.isMonitoring and "✅" or "❌")
        
        -- Test manual ad display
        if MMLAssetStorage.isAdPreloaded("ad_001") then
            local displaySuccess = MMLNetwork.DisplayAdInContainer("test_display_001", "ad_001")
            print(displaySuccess and "✅ Manual ad display test passed" or "❌ Manual ad display test failed")
        else
            print("⚠️ Ad not pre-loaded for display test")
        end
    else
        print("❌ MMLContainerStreamer module not found")
    end
    
    -- Step 6: Test Request Manager
    print("\n📋 Test 5: Request Manager")
    local MMLRequestManager = require(script.Parent.MMLRequestManager)
    
    if MMLRequestManager then
        local requestStats = MMLRequestManager.getRequestStats()
        print("📊 Request Stats:")
        print("  - Game Ads Cache:", requestStats.gameAds.cacheSize, "ads")
        print("  - Player Queue:", requestStats.playerEligibility.queueSize)
        print("  - Impression Queue:", requestStats.impressions.queueSize)
        print("✅ Request Manager operational")
    else
        print("❌ MMLRequestManager module not found")
    end
    
    -- Step 7: Test System Integration
    print("\n📋 Test 6: System Integration")
    local systemStats = MMLNetwork.GetSystemStats()
    
    if systemStats.initialized then
        print("✅ System fully integrated")
        print("📊 System Overview:")
        print("  - Version:", systemStats.version)
        print("  - Asset Storage:", systemStats.assetStorage.isInitialized and "✅" or "❌")
        print("  - Request Manager:", systemStats.requestManager and "✅" or "❌")
        print("  - Container Streamer:", systemStats.containerStreamer.isMonitoring and "✅" or "❌")
    else
        print("❌ System integration incomplete")
    end
    
    -- Step 8: Test Impression Recording
    print("\n📋 Test 7: Impression Recording")
    local impressionSuccess = MMLNetwork.RecordImpression("test_display_001", "view", {
        engagement = { score = 0.8 },
        duration = 5.2
    })
    print(impressionSuccess and "✅ Impression recording works" or "❌ Impression recording failed")
    
    -- Step 9: Test Manual Functions
    print("\n📋 Test 8: Manual Control Functions")
    
    -- Test rotation
    spawn(function()
        wait(2)
        local rotateSuccess = MMLNetwork.RotateContainerAd("test_display_001")
        print(rotateSuccess and "✅ Manual rotation works" or "❌ Manual rotation failed")
    end)
    
    -- Test refresh functions
    spawn(function()
        wait(3)
        local refreshSuccess = MMLNetwork.RefreshGameAds()
        print(refreshSuccess and "✅ Manual refresh works" or "❌ Manual refresh failed")
    end)
    
    print("\n" .. string.rep("=", 50))
    print("🎯 Implementation Test Complete!")
    print("📋 Check output above for detailed results")
    
    -- Enable debug mode for detailed logging
    MMLNetwork.EnableDebugMode()
    MMLNetwork.PrintSystemStatus()
end

-- Run the tests
runTests()

-- Keep testing for 30 seconds to observe behavior
spawn(function()
    wait(30)
    print("\n🔴 Shutting down test environment...")
    MMLNetwork.Shutdown()
    print("✅ Test complete")
end) 