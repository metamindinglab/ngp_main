--[[
    MML Network Integration Script for: Magical playground
    Game ID: game_b2e6f7b7
    Generated with pre-configured API key
--]]

-- Wait for game to be loaded
game.Loaded:Wait()

-- Get the MML Network module
local MMLNetwork = require(game:GetService("ReplicatedStorage"):WaitForChild("MMLGameNetwork"))

-- Pre-configured API Key for this game
local gameAPIKey = "RBXG-8985de596504cde3b47921b0ed3f0c00df1256d74f97a701"

-- Configuration
local config = {
    -- How often to check for new ads (in seconds)
    updateInterval = 30,
    
    -- Enable debug logging
    debugMode = false,
    
    -- Auto-start monitoring when initialized
    autoStart = true,
    
    -- Enable automatic position synchronization
    enablePositionSync = true
}

print("🎮 MML Network: Starting initialization for Magical playground...")

-- Initialize the MML Network
local success, result = MMLNetwork.initialize(gameAPIKey, config)

if success then
    print("✅ MML Network initialized successfully!")
    print("📊 Game: Magical playground")
    print("🔑 API Key configured")
    
    if config.autoStart then
        local monitorSuccess = MMLNetwork.startContainerMonitoring()
        if monitorSuccess then
            print("🔄 MML Network: Container monitoring started")
            print("📱 Your ad containers are now active!")
        else
            warn("❌ MML Network: Failed to start container monitoring")
        end
    end
    
else
    warn("❌ MML Network initialization failed:", result)
    warn("🔧 Game: Magical playground")
    warn("🔧 Game ID: game_b2e6f7b7")
end

-- Handle game shutdown gracefully
game:BindToClose(function()
    print("🛑 MML Network: Game shutting down, cleaning up...")
    MMLNetwork.cleanup()
end)
