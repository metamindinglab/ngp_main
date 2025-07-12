# Getting Started with MML Game Network

This guide will walk you through the process of adding MML advertisements to your Roblox game. No advanced programming knowledge required!

## Step 1: Create Your Account

1. Visit [dashboard.mml-network.com](https://dashboard.mml-network.com)
2. Click "Game Owner Sign Up"
3. Fill in your details:
   - Name
   - Email
   - Roblox Username
   - Discord Username (optional, but recommended for support)

## Step 2: Add Your Game

1. Log into the dashboard
2. Click "Add Game"
3. Enter your game details:
   - Game Name
   - Roblox Game ID (found in your game's URL)
   - Genre
   - Description
   - Upload thumbnail (optional)

## Step 3: Get Your API Key

1. In your game's dashboard page
2. Find the "API Access" section
3. Click "Generate API Key"
4. Copy the API key - you'll need this later
5. ⚠️ Keep this key secret! Don't share it or commit it to public repositories

## Step 4: Install the MML Module

### Option A: Quick Install (Recommended)
1. In your game's dashboard
2. Click "Download Module"
3. In Roblox Studio:
   - Open your game
   - In Explorer, right-click on `ReplicatedStorage`
   - Select "Insert from File"
   - Choose the downloaded `MMLGameNetwork.rbxm`

### Option B: Manual Install
1. In Roblox Studio:
   - Create a new `ModuleScript` in `ReplicatedStorage`
   - Name it `MMLGameNetwork`
   - Copy our [module code](https://github.com/mml-network/roblox-module/blob/main/MMLGameNetwork.lua) into it

## Step 5: Add Your First Ad Container

1. In your game's dashboard:
   - Click "Ad Containers"
   - Click "Add Container"
   - Fill in the details:
     - Name (e.g., "Main Plaza Billboard")
     - Type (start with "Display")
     - Position (X, Y, Z coordinates)
     - Size (Width and Height)
   - Click Create and copy the Container ID

2. In Roblox Studio:
```lua
-- In a Script under ServerScriptService
local MMLNetwork = require(game:GetService("ReplicatedStorage").MMLGameNetwork)

-- Initialize with your API key
MMLNetwork.Initialize({
    apiKey = "your-api-key-here",
    updateInterval = 60,  -- Check for updates every minute
    debug = true         -- Enable debug logging while testing
})

-- Create a display ad
local displayAd = MMLNetwork.CreateDisplayAd({
    containerId = "your-container-id", -- Paste ID from dashboard
    position = Vector3.new(0, 5, 0),   -- Match portal coordinates
    size = Vector2.new(10, 5)          -- Match portal size
})

-- Handle content updates
displayAd.OnContentUpdate:Connect(function(content)
    print("New ad content received:", content.assets[1].robloxAssetId)
end)

-- Handle errors
displayAd.OnError:Connect(function(error)
    warn("Ad error:", error)
end)

-- Track engagement
game:GetService("RunService").Heartbeat:Connect(function()
    if tick() - lastCheck > 60 then  -- Check every minute
        MMLNetwork.TrackEngagement(displayAd.id, {
            eventType = "view",
            data = {
                timestamp = os.time(),
                playerCount = #game.Players:GetPlayers()
            }
        })
        lastCheck = tick()
    end
end)
```

## Step 6: Test Your Integration

1. In Roblox Studio:
   - Click "Play" (▶️)
   - You should see a placeholder ad appear
   - Check the Output window for any errors
   - Verify that content updates work
   - Test engagement tracking

2. In your game's dashboard:
   - Go to "Analytics"
   - Verify that views are being tracked
   - Check engagement metrics
   - Try different test ads

## What's Next?

- Read our [Ad Container Guide](./ad-containers.md) for detailed options
- Learn about [engagement tracking](./api-reference/functions.md#engagement-tracking)
- Explore [different container types](./ad-containers.md#container-types)
- Join our [Discord community](https://discord.gg/mml-network) for help and tips

## Common Issues

### No Ad Showing?
- Check if your API key is correct
- Verify the Container ID exists in dashboard
- Make sure the position is in a visible area
- Check Output window for error messages
- Verify MMLNetwork module is in ReplicatedStorage

### Engagement Not Tracking?
- Check if your API key has analytics permissions
- Verify the container is properly initialized
- Make sure the game is published (not in Studio)
- Check for script errors in Output

### Need More Help?
- See our [Troubleshooting Guide](./testing.md#troubleshooting)
- Join our [Discord](https://discord.gg/mml-network)
- Email support@mml-network.com 