# Ad Container System

## Overview

The Ad Container system provides a simple way to integrate dynamic advertisements into your Roblox game. The system follows a two-step process:

1. Create a container record in the Game Owner Portal
2. Link the container to a location in your game

## Creating a Container

1. In the Game Owner Portal, navigate to "Ad Containers"
2. Click "Create Container"
3. Fill in the required information:
   - Name: A descriptive name (e.g., "Spawn Area Billboard")
   - Type: Choose from:
     - DISPLAY (Billboards)
     - NPC (Interactive Characters)
     - MINIGAME (Interactive Experiences)
   - Status: Container state:
     - ACTIVE (Ready for ads)
     - INACTIVE (Temporarily disabled)
     - MAINTENANCE (Under maintenance)
   - Position: The X, Y, Z coordinates where the ad will appear
   - Description: Optional notes about the container's location/purpose

The system will generate a unique Container ID that you'll use in your game.

## Implementing in Your Game

### 1. Display Ads (Billboards)
```lua
local displayAd = MMLNetwork.CreateDisplayAd({
    containerId = "your-container-id",  -- From Game Owner Portal
    position = Vector3.new(0, 5, 0),    -- Match portal coordinates
    size = Vector2.new(10, 5)           -- Width and height in studs
})
```

### 2. NPC Ads
```lua
local npcAd = MMLNetwork.CreateNPCAd({
    containerId = "your-container-id",  -- From Game Owner Portal
    position = Vector3.new(0, 0, 0),    -- Match portal coordinates
})

-- Optional: Handle NPC interactions
npcAd.OnInteraction:Connect(function(player)
    print(player.Name .. " interacted with the NPC")
end)
```

### 3. Mini-game Ads
```lua
local minigameAd = MMLNetwork.CreateMinigameAd({
    containerId = "your-container-id",  -- From Game Owner Portal
    position = Vector3.new(0, 0, 0),    -- Match portal coordinates
    size = Vector3.new(10, 10, 10)      -- Area size in studs
})
```

## How It Works

1. When you create a container in the portal, it's registered in our system with:
   - Container ID
   - Game ID
   - Type
   - Status
   - Position
   - Description

2. In your game:
   - Create a base object at the specified position
   - Use the MMLNetwork module to link the Container ID
   - The system automatically:
     - Validates the Container ID
     - Loads the current ad content
     - Updates the display as needed
     - Tracks engagement metrics

3. The server handles:
   - Authentication
   - Content delivery
   - Performance tracking
   - Ad rotation
   - Engagement analytics

## Best Practices

1. Position
   - Place containers in high-visibility areas
   - Ensure good lighting
   - Avoid obstructing gameplay
   - Consider player viewing distance

2. Performance
   - Containers automatically handle content updates
   - Assets are cached for performance
   - Updates occur smoothly without interrupting gameplay
   - Engagement tracking is automatic

3. Testing
   - Use the Game Owner Portal to preview ads
   - Test different container types
   - Verify interaction zones
   - Check visibility from different angles
   - Monitor engagement metrics

## API Reference

### Container Creation
```typescript
POST /api/game-owner/containers
{
  "gameId": "string",
  "name": "string",
  "type": "DISPLAY" | "NPC" | "MINIGAME",
  "position": {
    "x": number,
    "y": number,
    "z": number
  },
  "size": {  // For DISPLAY and MINIGAME types
    "width": number,
    "height": number
  },
  "description": "string"
}

// Response
{
  "container": {
    "id": "string",
    "type": "string",
    "position": { "x": number, "y": number, "z": number },
    "status": "ACTIVE"
  },
  "placeholderAsset": {
    "robloxAssetId": "string",
    "properties": {
      "size": { "width": number, "height": number },
      "transparency": number
    }
  }
}
```

### Get Container Content
```typescript
GET /api/v1/containers/{containerId}/ad
Authorization: Bearer {game_api_key}

// Response
{
  "hasAd": boolean,
  "adType": "DISPLAY" | "NPC" | "MINIGAME",
  "position": { "x": number, "y": number, "z": number },
  "assets": [{
    "type": string,
    "robloxAssetId": string,
    "properties": {
      "size": { "width": number, "height": number },
      "transparency": number
    }
  }],
  "config": {
    "updateInterval": number,
    "interactionEnabled": boolean
  }
}
```

### Track Ad Engagement
```typescript
POST /api/v1/containers/{containerId}/engagement
Authorization: Bearer {game_api_key}
Content-Type: application/json

{
  "eventType": "view" | "interaction" | "completion",
  "data": {
    "timestamp": number,
    "playerName": string,  // Optional
    "playerCount": number, // For view events
    "interactionType": string, // For interaction events
    "metadata": object    // Additional event-specific data
  }
}

// Response
{
  "success": boolean,
  "engagementId": string
}
```

### Container Status Update
```typescript
PATCH /api/game-owner/containers/{containerId}
{
  "status": "ACTIVE" | "INACTIVE" | "MAINTENANCE",
  "position": {  // Optional
    "x": number,
    "y": number,
    "z": number
  },
  "size": {  // Optional
    "width": number,
    "height": number
  }
}

// Response
{
  "success": boolean,
  "container": {
    "id": string,
    "status": string,
    "position": { "x": number, "y": number, "z": number },
    "size": { "width": number, "height": number }
  }
}
```

## Engagement Tracking

The system automatically tracks several types of engagement:

### View Events
- Triggered when players are in viewing range
- Includes player count and timestamp
- Tracked automatically by the MMLNetwork module

### Interaction Events
- Clicks/touches on Display ads
- NPC conversations
- Mini-game participation
- Includes player information and interaction type

### Completion Events
- Mini-game completion
- NPC conversation completion
- Ad video view completion

### Sample Engagement Code
```lua
-- Track a view event
MMLNetwork.TrackEngagement(containerId, {
    eventType = "view",
    data = {
        timestamp = os.time(),
        playerCount = #game.Players:GetPlayers()
    }
})

-- Track an interaction
MMLNetwork.TrackEngagement(containerId, {
    eventType = "interaction",
    data = {
        timestamp = os.time(),
        playerName = player.Name,
        interactionType = "click"
    }
})

-- Track completion
MMLNetwork.TrackEngagement(containerId, {
    eventType = "completion",
    data = {
        timestamp = os.time(),
        playerName = player.Name,
        score = playerScore  -- For mini-games
    }
})
``` 