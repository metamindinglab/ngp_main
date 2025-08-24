# 5-Minute Display Ad Guide

This guide will help you add your first display ad in just 5 minutes! Display ads are the simplest to implement and perfect for beginners.

## What You Need
- Your game open in Roblox Studio
- Your API key from the dashboard
- 5 minutes of time

## Step-by-Step Guide

### 1. Add the Module (1 minute)
```lua
-- In ServerScriptService, create a new Script
-- Name it "MMLAds" or something similar

-- Get the MML module
local MMLNetwork = require(game:GetService("ServerScriptService"):WaitForChild("MMLGameNetwork"))

-- Initialize with your API key
MMLNetwork.Initialize("your-api-key-here")
```

### 2. Create a Billboard (2 minutes)
```lua
-- In the same script, add:

-- Create a display ad
local displayAd = MMLNetwork.CreateDisplayAd({
    containerId = "your-container-id",  -- From dashboard
    position = Vector3.new(0, 5, 0),    -- 5 studs above ground
    size = Vector2.new(10, 5)           -- 10x5 studs billboard
})
```

### 3. Test It! (2 minutes)
1. Click the Play button (▶️)
2. You should see a test ad appear
3. Walk around to make sure it's visible
4. Check the Output window for any errors

## That's It! 🎉

Your game is now ready to show ads! The system will automatically:
- Load the correct ads
- Track views
- Handle updates
- Manage errors

## Want to Do More?

### Adjust the Position
```lua
-- Move it higher
position = Vector3.new(0, 10, 0)  -- 10 studs high

-- Move it forward
position = Vector3.new(0, 5, 10)  -- 10 studs forward

-- Move it to the side
position = Vector3.new(10, 5, 0)  -- 10 studs right
```

### Change the Size
```lua
-- Make it bigger
size = Vector2.new(20, 10)  -- 20x10 studs

-- Make it square
size = Vector2.new(10, 10)  -- 10x10 studs

-- Make it vertical
size = Vector2.new(5, 10)   -- 5x10 studs
```

### Add Multiple Ads
```lua
-- Create several ads
local lobbyAd = MMLNetwork.CreateDisplayAd({
    containerId = "lobby-container-id",
    position = Vector3.new(0, 5, 0),
    size = Vector2.new(10, 5)
})

local shopAd = MMLNetwork.CreateDisplayAd({
    containerId = "shop-container-id",
    position = Vector3.new(20, 5, 0),
    size = Vector2.new(10, 5)
})
```

## Common Questions

### Ad Not Showing?
1. Check your API key
2. Verify the Container ID
3. Make sure position is visible
4. Look for errors in Output

### Ad Too Big/Small?
- Adjust the `size` parameter
- Remember: size is in studs
- Test with different values

### Need More Help?
- See [Display Ad Details](../ad-containers.md#display-ads)
- Join our [Discord](https://discord.gg/mml-network)
- Email support@mml-network.com

## Next Steps
- Try [NPC Ads](./npc-ads.md)
- Add [Mini-games](./mini-games.md)
- Learn about [best practices](../best-practices.md) 