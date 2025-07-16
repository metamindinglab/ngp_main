--[[
    MML Network Integration Script
    This script automatically initializes the MML Network system
    Place this in ServerScriptService (or it will be placed automatically when you import the .rbxm)
--]]

-- Wait for game to be loaded
game.Loaded:Wait()

-- Get the MML Network module
local MMLNetwork = require(game:GetService("ReplicatedStorage"):WaitForChild("MMLGameNetwork"))

-- ⚠️ IMPORTANT: REPLACE THIS WITH YOUR ACTUAL API KEY
-- Get your API key from the Game Owner Portal: https://your-portal-url.com
local gameAPIKey = "RBXG-REPLACE-WITH-YOUR-ACTUAL-API-KEY"

-- Configuration
local config = {
    -- How often to check for new ads (in seconds)
    updateInterval = 30,
    
    -- Enable debug logging
    debugMode = false,
    
    -- Auto-start monitoring when initialized
    autoStart = true,
    
    -- Enable automatic position synchronization
    -- When containers are moved in Studio, their positions will be automatically
    -- updated in the MML Network database
    enablePositionSync = true
}

print("🎮 MML Network: Starting initialization...")

-- Initialize the MML Network
local success, result = MMLNetwork.initialize(gameAPIKey, config)

if success then
    print("✅ MML Network initialized successfully!")
    print("📊 Found containers:", result.containerCount or 0)
    
    if config.autoStart then
        -- Start monitoring all containers
        local monitorSuccess = MMLNetwork.startContainerMonitoring()
        if monitorSuccess then
            print("🔄 MML Network: Container monitoring started")
            print("📱 Your ad containers are now active!")
        else
            warn("❌ MML Network: Failed to start container monitoring")
        end
    end
    
    -- Optional: Set up periodic health checks
    spawn(function()
        while true do
            wait(300) -- Check every 5 minutes
            local status = MMLNetwork.getStatus()
            if config.debugMode then
                print("💊 MML Network Health Check:", status)
            end
        end
    end)
    
else
    warn("❌ MML Network initialization failed:", result)
    warn("🔧 Please check:")
    warn("   1. Your API key is correct (should start with 'RBXG-')")
    warn("   2. Your game is registered in the Game Owner Portal")
    warn("   3. You have created ad containers for this game")
    warn("   4. Your internet connection is working")
end

-- Handle game shutdown gracefully
game:BindToClose(function()
    print("🛑 MML Network: Game shutting down, cleaning up...")
    MMLNetwork.cleanup()
end)

--[[ 
    🎯 POSITION SYNC FEATURE
    
    The MML Network now automatically syncs container positions!
    
    How it works:
    1. When you place containers in your game, their positions are automatically detected
    2. Any time you move a container in Studio, the new position is sent to the database
    3. The Game Owner Portal will show the updated positions automatically
    
    Manual position sync (if needed):
    ```lua
    -- Sync a specific container
    MMLNetwork.SyncContainerPosition("container_id_here")
    
    -- Sync all containers at once
    MMLNetwork.SyncAllPositions()
    ```
    
    Position sync settings:
    - Automatic sync: Enabled by default (enablePositionSync = true)
    - Sync cooldown: 5 seconds minimum between updates
    - Position threshold: 0.1 studs minimum movement to trigger sync
    
    To disable automatic position sync:
    Set enablePositionSync = false in the config above
--]]

print("📍 MML Network: Position synchronization is", config.enablePositionSync and "ENABLED" or "DISABLED")
if config.enablePositionSync then
    print("   • Container positions will be automatically synced to the database")
    print("   • Move containers in Studio and see updates in the Game Owner Portal")
    print("   • Minimum 5 second cooldown between position updates")
end 