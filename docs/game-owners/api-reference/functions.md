# MML Network Module Functions

Complete reference for all functions in the MML Game Network module.

## Core Functions

### Initialize
Initializes the MML Network module with your API key and options.

```lua
MMLNetwork.Initialize(config: InitConfig): boolean
```

#### Parameters
- `config` (table):
  - `apiKey` (string): Your API key from the dashboard
  - `updateInterval` (number?, optional): How often to check for updates (seconds)
  - `debug` (boolean?, optional): Enable debug logging

#### Returns
- `boolean`: True if initialization successful

#### Example
```lua
local success = MMLNetwork.Initialize({
    apiKey = "your-api-key-here",
    updateInterval = 60,  -- Check every minute
    debug = true         -- Enable debug logs
})
```

## Display Ad Functions

### CreateDisplayAd
Creates a billboard-style display ad.

```lua
MMLNetwork.CreateDisplayAd(config: DisplayAdConfig): DisplayAdContainer
```

#### Parameters
- `config` (table):
  - `containerId` (string): Container ID from dashboard
  - `position` (Vector3): 3D position in the game world
  - `size` (Vector2): Width and height in studs
  - `rotation` (number?, optional): Y-axis rotation in degrees
  - `transparency` (number?, optional): 0-1, defaults to 0
  - `enabled` (boolean?, optional): Start enabled, defaults to true

#### Returns
- `DisplayAdContainer` (table):
  - `id` (string): Container ID
  - `instance` (Instance): Roblox part instance
  - `billboard` (BillboardGui): Billboard GUI instance
  - `frame` (Frame): Container frame
  - `SetEnabled(enabled: boolean)`: Enable/disable the ad
  - `SetPosition(position: Vector3)`: Move the ad
  - `SetSize(size: Vector2)`: Resize the ad
  - `Destroy()`: Remove the ad

#### Example
```lua
local displayAd = MMLNetwork.CreateDisplayAd({
    containerId = "abc123",
    position = Vector3.new(0, 5, 0),
    size = Vector2.new(10, 5),
    rotation = 90, -- Optional
    transparency = 0.5 -- Optional
})

-- Later, to move it:
displayAd.SetPosition(Vector3.new(10, 5, 0))
```

## NPC Ad Functions

### CreateNPCAd
Creates an interactive NPC character ad.

```lua
MMLNetwork.CreateNPCAd(config: NPCAdConfig): NPCAdContainer
```

#### Parameters
- `config` (table):
  - `containerId` (string): Container ID from dashboard
  - `position` (Vector3): Spawn position
  - `walkRadius` (number?, optional): How far NPC can walk
  - `enabled` (boolean?, optional): Start enabled, defaults to true

#### Returns
- `NPCAdContainer` (table):
  - `id` (string): Container ID
  - `instance` (Model): NPC model instance
  - `humanoid` (Humanoid): NPC humanoid
  - `OnInteraction` (BindableEvent): Fires when players interact
  - `SetEnabled(enabled: boolean)`: Enable/disable the NPC
  - `SetPosition(position: Vector3)`: Move the NPC
  - `Destroy()`: Remove the NPC

#### Example
```lua
local npcAd = MMLNetwork.CreateNPCAd({
    containerId = "abc123",
    position = Vector3.new(0, 0, 0),
    walkRadius = 10
})

npcAd.OnInteraction:Connect(function(player)
    print(player.Name .. " interacted with NPC")
end)
```

## Mini-game Ad Functions

### CreateMinigameAd
Creates an interactive mini-game ad experience.

```lua
MMLNetwork.CreateMinigameAd(config: MinigameAdConfig): MinigameAdContainer
```

#### Parameters
- `config` (table):
  - `containerId` (string): Container ID from dashboard
  - `position` (Vector3): Game area position
  - `size` (Vector3): Game area size
  - `enabled` (boolean?, optional): Start enabled, defaults to true

#### Returns
- `MinigameAdContainer` (table):
  - `id` (string): Container ID
  - `instance` (Model): Game area model
  - `OnComplete` (BindableEvent): Fires when players finish
  - `SetEnabled(enabled: boolean)`: Enable/disable the game
  - `SetPosition(position: Vector3)`: Move the game area
  - `Destroy()`: Remove the mini-game

#### Example
```lua
local minigameAd = MMLNetwork.CreateMinigameAd({
    containerId = "abc123",
    position = Vector3.new(0, 0, 0),
    size = Vector3.new(20, 10, 20)
})

minigameAd.OnComplete:Connect(function(player, score)
    print(player.Name .. " scored " .. score)
end)
```

## Engagement Tracking

### TrackEngagement
Tracks an engagement event for a container.

```lua
MMLNetwork.TrackEngagement(
    containerId: string,
    event: EngagementEvent
): boolean
```

#### Parameters
- `containerId` (string): Container ID from dashboard
- `event` (table):
  - `eventType` (string): "view" | "interaction" | "completion"
  - `data` (table):
    - `timestamp` (number): Event timestamp
    - `playerName` (string?, optional): Player name
    - `playerCount` (number?, optional): For view events
    - `interactionType` (string?, optional): For interaction events
    - `metadata` (table?, optional): Additional data

#### Returns
- `boolean`: True if tracking successful

#### Example
```lua
-- Track views
local success = MMLNetwork.TrackEngagement(containerId, {
    eventType = "view",
    data = {
        timestamp = os.time(),
        playerCount = #game.Players:GetPlayers()
    }
})

-- Track interactions
MMLNetwork.TrackEngagement(containerId, {
    eventType = "interaction",
    data = {
        timestamp = os.time(),
        playerName = player.Name,
        interactionType = "click"
    }
})

-- Track completions
MMLNetwork.TrackEngagement(containerId, {
    eventType = "completion",
    data = {
        timestamp = os.time(),
        playerName = player.Name,
        score = playerScore
    }
})
```

## Utility Functions

### SetDebugMode
Enables or disables debug logging.

```lua
MMLNetwork.SetDebugMode(enabled: boolean): void
```

#### Example
```lua
MMLNetwork.SetDebugMode(true) -- Enable debug logs
```

### GetVersion
Returns the current module version.

```lua
MMLNetwork.GetVersion(): string
```

#### Example
```lua
local version = MMLNetwork.GetVersion()
print("MML Network version: " .. version)
```

## Container Events

All containers emit these events:

### OnContentUpdate
Fired when new ad content is received.

```lua
container.OnContentUpdate:Connect(function(content: AdContent)
    print("New content:", content.assets[1].robloxAssetId)
end)
```

### OnError
Fired when an error occurs.

```lua
container.OnError:Connect(function(error: string)
    warn("Ad error:", error)
end)
```

### OnStatusChange
Fired when container status changes.

```lua
container.OnStatusChange:Connect(function(status: string)
    print("New status:", status)
end)
```

### OnEngagement
Fired when engagement is tracked.

```lua
container.OnEngagement:Connect(function(event: EngagementEvent)
    print("Engagement:", event.eventType)
end)
```

## Best Practices

1. **Error Handling**
```lua
local success, container = pcall(function()
    return MMLNetwork.CreateDisplayAd(config)
end)

if not success then
    warn("Failed to create ad:", container)
    return
end

container.OnError:Connect(function(error)
    warn("Container error:", error)
    -- Implement fallback behavior
end)
```

2. **Engagement Tracking**
```lua
-- Track views efficiently
local function checkViewers()
    local players = game.Players:GetPlayers()
    local inRange = 0
    
    for _, player in ipairs(players) do
        local distance = (player.Character.PrimaryPart.Position - adPosition).Magnitude
        if distance < viewDistance then
            inRange = inRange + 1
        end
    end
    
    if inRange > 0 then
        MMLNetwork.TrackEngagement(containerId, {
            eventType = "view",
            data = {
                timestamp = os.time(),
                playerCount = inRange
            }
        })
    end
end

game:GetService("RunService").Heartbeat:Connect(function()
    if tick() - lastCheck > checkInterval then
        checkViewers()
        lastCheck = tick()
    end
end)
```

3. **Cleanup**
```lua
-- When removing ads
container:Destroy()
```

4. **Performance**
```lua
-- Enable ads only when nearby
local function updateAdVisibility()
    local distance = (player.Position - ad.Position).Magnitude
    ad:SetEnabled(distance < 100)
end
```

## Type Definitions

```lua
type InitConfig = {
    apiKey: string,
    updateInterval: number?,
    debug: boolean?
}

type DisplayAdConfig = {
    containerId: string,
    position: Vector3,
    size: Vector2,
    rotation: number?,
    transparency: number?,
    enabled: boolean?
}

type NPCAdConfig = {
    containerId: string,
    position: Vector3,
    walkRadius: number?,
    enabled: boolean?
}

type MinigameAdConfig = {
    containerId: string,
    position: Vector3,
    size: Vector3,
    enabled: boolean?
}

type EngagementEvent = {
    eventType: "view" | "interaction" | "completion",
    data: {
        timestamp: number,
        playerName: string?,
        playerCount: number?,
        interactionType: string?,
        metadata: table?
    }
}

type AdContent = {
    hasAd: boolean,
    adType: string,
    assets: Array<{
        type: string,
        robloxAssetId: string,
        properties: table
    }>,
    config: {
        updateInterval: number,
        interactionEnabled: boolean
    }
}
```

## Need Help?

- Check our [troubleshooting guide](../testing.md)
- Join our [Discord](https://discord.gg/mml-network)
- Email support@mml-network.com 