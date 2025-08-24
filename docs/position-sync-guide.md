# MML Network Position Sync System

## Overview

The MML Network now includes **automatic position synchronization** between Roblox Studio and the database. When you move containers in your game, their positions are automatically updated in the AdContainer table.

## How It Works

### 1. **Automatic Detection**
- The system monitors all containers every frame for position changes
- When a container moves more than **0.5 studs**, it triggers a sync
- Minimum **5 second cooldown** prevents excessive API calls

### 2. **Database Update**
- Position changes are sent to `/api/v1/containers/{id}/position`
- The API validates the request using the game's API key
- Position is updated in the `AdContainer` table
- An engagement event is logged for analytics

### 3. **Real-time Sync**
- Changes appear in the Game Owner Portal immediately
- Other systems (feeding engine, analytics) get updated positions
- Position history is tracked for debugging

## Features

### ✅ **Automatic Position Sync**
- **Enabled by default** in all new containers
- **Movement threshold**: 0.5 studs minimum
- **Cooldown**: 5 seconds between syncs per container
- **Background monitoring**: No performance impact

### ✅ **Manual Position Sync**
```lua
-- Sync a specific container
MMLNetwork.SyncContainerPosition("container_id_here")

-- Sync all containers at once
MMLNetwork.SyncAllPositions()
```

### ✅ **Container Registration**
- Containers automatically register with MML Network
- Database IDs are preserved from the Game Owner Portal
- Position sync metadata is embedded in containers

## Configuration

### Enable/Disable Position Sync
```lua
-- In your MML Network configuration
local config = {
    enablePositionSync = true,  -- Set to false to disable
    -- ... other config
}
```

### Position Sync Settings
- **Movement Threshold**: 0.5 studs
- **Sync Cooldown**: 5 seconds
- **API Timeout**: 15 seconds
- **Max Retries**: 3 attempts

## Technical Details

### Container Metadata
Every container includes position sync metadata:
```lua
-- MMLMetadata folder contains:
├── ContainerId (StringValue) -- Real database ID
├── GameId (StringValue) -- Game database ID  
├── Type (StringValue) -- DISPLAY, NPC, MINIGAME
├── EnablePositionSync (BoolValue) -- true/false
└── LastSyncedPosition (Vector3Value) -- Last synced position
```

### API Endpoint
```
PUT /api/v1/containers/{containerId}/position
Headers:
  X-API-Key: {gameApiKey}
  Content-Type: application/json

Body:
{
  "position": {
    "x": 567.5,
    "y": 6.57,
    "z": 291.25
  },
  "timestamp": 1754341140
}
```

### Database Schema
The `AdContainer` table stores:
```sql
position: {
  "x": 567.49951171875,
  "y": 6.568245887756348,  
  "z": 291.24969482421875
}
updatedAt: "2025-08-04T21:01:48.888Z"
```

## Troubleshooting

### Position Not Syncing?
1. **Check container ID**: Ensure the container has the correct database ID in metadata
2. **Verify API key**: Make sure your game's API key is correct
3. **Network connection**: HTTP requests must be enabled in Studio
4. **Movement threshold**: Move the container more than 0.5 studs
5. **Cooldown period**: Wait 5 seconds between moves for the same container

### Debug Commands
```lua
-- Check container registration
print("Registered containers:", #MMLNetwork.getActiveContainerIds())

-- Check position sync status
print("Position sync enabled:", MMLNetwork._config.enablePositionSync)

-- Force sync all positions
local synced = MMLNetwork.SyncAllPositions()
print("Synced", synced, "containers")
```

## Performance

### Monitoring Overhead
- **Minimal CPU usage**: Runs once per frame via RunService.Heartbeat
- **Smart filtering**: Only checks containers that exist and have moved
- **Efficient calculations**: Uses Vector3 magnitude for distance checks
- **Cooldown system**: Prevents spam requests to the API

### Network Usage
- **Bandwidth**: ~200 bytes per position sync
- **Frequency**: Maximum once per 5 seconds per container
- **Batching**: Individual containers sync independently
- **Compression**: JSON payload is minimal

## Best Practices

### 1. **Container Placement**
- Use the **smart positioning system** for initial placement
- Move containers in **Studio** for precise positioning
- Allow time for sync before testing in-game

### 2. **Performance Optimization**
- Avoid moving containers during gameplay
- Position containers during development/setup phase
- Use manual sync for immediate updates when needed

### 3. **Database Consistency**
- Always use containers downloaded from Game Owner Portal
- Don't modify container IDs manually
- Verify position sync in Portal after moving containers

## Examples

### Example 1: Move Container and Verify Sync
```lua
-- Move a container in Studio
local container = workspace:FindFirstChild("0163874a-c2f5-4531-a6da-bac6032fd7c4")
container.Position = Vector3.new(100, 10, 200)

-- Wait for auto-sync (5 seconds)
wait(6)

-- Verify sync
print("Position synced to database!")
```

### Example 2: Manual Position Sync
```lua
-- Force immediate sync
local success = MMLNetwork.SyncContainerPosition("0163874a-c2f5-4531-a6da-bac6032fd7c4")
if success then
    print("✅ Position synced manually")
else
    warn("❌ Sync failed - check container ID and network")
end
```

### Example 3: Bulk Position Sync
```lua
-- Sync all containers at once
local syncedCount = MMLNetwork.SyncAllPositions()
print("📍 Synced positions for", syncedCount, "containers")
```

## Integration with Game Owner Portal

The Game Owner Portal now shows **real-time position updates**:
- Container positions update automatically when moved in Studio
- Position history is tracked for analytics
- Smart positioning recommendations based on spawn points
- Distance calculations from spawn points

## Summary

The MML Network Position Sync System provides:
- ✅ **Automatic** position synchronization
- ✅ **Real-time** database updates  
- ✅ **Performance optimized** monitoring
- ✅ **Developer friendly** manual controls
- ✅ **Portal integration** for position management

**No additional setup required** - position sync works automatically with all containers downloaded from the Game Owner Portal!