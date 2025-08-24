# Ad Container Implementation Workflow

## Overview
This document describes the complete workflow from creating an ad container in the Game Owner Portal to tracking engagement data from the Roblox game.

## 1. Container Creation in Game Owner Portal

### 1.1 Create Container
```typescript
// POST /api/game-owner/containers
{
  gameId: "game_uuid",
  name: "Main Plaza Billboard",
  type: "DISPLAY",
  position: { x: 0, y: 5, z: 0 },
  description: "Billboard near spawn area"
}
```

### 1.2 Server Response
```typescript
{
  container: {
    id: "container_uuid",
    type: "DISPLAY",
    position: { x: 0, y: 5, z: 0 },
    status: "ACTIVE"
  },
  placeholderAsset: {
    robloxAssetId: "rbxassetid://default_billboard",
    properties: {
      size: { width: 10, height: 5 },
      transparency: 0.1
    }
  }
}
```

## 2. Roblox Game Integration

### 2.1 Initialize MML Network
```lua
local MMLNetwork = require(game:GetService("ReplicatedStorage").MMLNetwork)

MMLNetwork.Initialize({
    apiKey = "your_game_api_key",
    updateInterval = 60  -- Check for new ads every 60 seconds
})
```

### 2.2 Create Container Instance
```lua
local displayAd = MMLNetwork.CreateDisplayAd({
    containerId = "container_uuid",
    position = Vector3.new(0, 5, 0),
    size = {
        width = 10,
        height = 5
    }
})

-- Handle container events
displayAd.OnContentUpdate:Connect(function(newContent)
    print("New ad content received")
end)

displayAd.OnError:Connect(function(error)
    print("Error:", error)
end)
```

## 3. Server-Game Communication

### 3.1 Initial Content Request
```http
GET /api/v1/containers/{containerId}/ad
Authorization: Bearer {game_api_key}
```

### 3.2 Server Response
```json
{
  "hasAd": true,
  "adType": "DISPLAY",
  "position": {"x": 0, "y": 5, "z": 0},
  "assets": [{
    "type": "DISPLAY",
    "robloxAssetId": "rbxassetid://ad_asset_id",
    "properties": {
      "size": {"width": 10, "height": 5},
      "transparency": 0.1
    }
  }],
  "config": {
    "updateInterval": 60,
    "interactionEnabled": true
  }
}
```

### 3.3 Content Update Flow
```lua
-- In MMLNetwork module
local function checkForUpdates()
    local response = HttpService:GetAsync(
        API_URL .. "/containers/" .. containerId .. "/ad",
        {["Authorization"] = "Bearer " .. API_KEY}
    )
    
    if response.hasAd then
        updateAdContent(response.assets)
    end
end

-- Run update check on interval
game:GetService("RunService").Heartbeat:Connect(function()
    if tick() - lastUpdate > updateInterval then
        checkForUpdates()
        lastUpdate = tick()
    end
end)
```

## 4. Engagement Tracking

### 4.1 Track View Events
```lua
local function trackView()
    MMLNetwork.TrackEngagement(containerId, {
        eventType = "view",
        data = {
            timestamp = os.time(),
            playerCount = #game.Players:GetPlayers()
        }
    })
end
```

### 4.2 Track Interaction Events
```lua
local function onInteraction(player)
    MMLNetwork.TrackEngagement(containerId, {
        eventType = "interaction",
        data = {
            timestamp = os.time(),
            playerName = player.Name,
            interactionType = "click"
        }
    })
end

-- Connect to interaction events
adInstance.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player then
        onInteraction(player)
    end
end)
```

### 4.3 Server Engagement Endpoint
```http
POST /api/v1/containers/{containerId}/engagement
Authorization: Bearer {game_api_key}
Content-Type: application/json

{
  "eventType": "interaction",
  "data": {
    "timestamp": 1634567890,
    "playerName": "Player1",
    "interactionType": "click"
  }
}
```

## 5. Error Handling

### 5.1 Network Errors
```lua
local function handleNetworkError(err)
    -- Log error
    print("Network error:", err)
    
    -- Use placeholder content
    displayAd:SetContent(PLACEHOLDER_ASSETS[displayAd.type])
    
    -- Retry after delay
    wait(RETRY_INTERVAL)
    checkForUpdates()
end
```

### 5.2 Content Errors
```lua
local function handleContentError(err)
    -- Log error
    print("Content error:", err)
    
    -- Fallback to placeholder
    displayAd:SetContent(PLACEHOLDER_ASSETS[displayAd.type])
    
    -- Report to analytics
    MMLNetwork.TrackEngagement(containerId, {
        eventType = "error",
        data = {
            timestamp = os.time(),
            error = err
        }
    })
end
```

## 6. Best Practices

1. **Error Handling**
   - Always implement fallback to placeholder content
   - Use exponential backoff for retries
   - Log errors for debugging

2. **Performance**
   - Cache ad content locally
   - Implement proper cleanup on container removal
   - Use appropriate update intervals

3. **User Experience**
   - Smooth transitions between content updates
   - Graceful error handling
   - Non-intrusive ad placement

4. **Security**
   - Secure API key storage
   - Validate all server responses
   - Monitor for abuse

## 7. Testing

1. **Container Creation**
   ```lua
   -- Test container creation
   local success, container = pcall(function()
       return MMLNetwork.CreateDisplayAd(config)
   end)
   assert(success and container, "Container creation failed")
   ```

2. **Content Updates**
   ```lua
   -- Test content update
   container.OnContentUpdate:Connect(function(content)
       assert(content.assets, "Invalid content format")
       assert(content.assets[1].robloxAssetId, "Missing asset ID")
   end)
   ```

3. **Engagement Tracking**
   ```lua
   -- Test engagement tracking
   local success = MMLNetwork.TrackEngagement(containerId, {
       eventType = "test",
       data = { test = true }
   })
   assert(success, "Engagement tracking failed")
   ``` 