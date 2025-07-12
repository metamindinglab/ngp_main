# MML Game Network Integration Guide

## Overview

The MML Game Network allows Roblox game developers to easily integrate dynamic advertising content into their games. This guide covers the integration process, available container types, and best practices.

## Quick Start

1. Install the MML Network module in your game:
   - Add the `MMLNetwork.lua` module to `ReplicatedStorage`
   - Initialize with your API key

```lua
local MMLNetwork = require(game:GetService("ReplicatedStorage").MMLNetwork)

MMLNetwork.Initialize({
    apiKey = "YOUR_API_KEY_HERE"
})
```

2. Create ad containers in your game:

```lua
-- Create a billboard display
local displayAd = MMLNetwork.CreateDisplayAd({
    containerId = "your_container_id",
    position = Vector3.new(0, 5, 0),
    size = {
        width = 10,
        height = 5
    }
})

-- Create an interactive NPC
local npcAd = MMLNetwork.CreateNPCAd({
    containerId = "your_npc_container_id",
    position = Vector3.new(10, 0, 10)
})

-- Create a minigame zone
local minigameAd = MMLNetwork.CreateMinigameAd({
    containerId = "your_minigame_container_id",
    position = Vector3.new(-10, 0, -10),
    size = {
        width = 10,
        height = 10,
        depth = 10
    }
})
```

## Container Types

### Display Containers
- Purpose: Show visual advertisements (images, videos)
- Features:
  - Automatic content updates
  - Size customization
  - Position adjustment
  - Transparency control
- Best Practices:
  - Place in high-visibility areas
  - Avoid blocking gameplay elements
  - Consider viewing angles
  - Use appropriate scaling

### NPC Containers
- Purpose: Interactive character-based advertisements
- Features:
  - Customizable appearance
  - Animation support
  - Interaction handling
  - Pathfinding capabilities
- Best Practices:
  - Place in accessible areas
  - Set appropriate interaction radius
  - Handle interactions gracefully
  - Consider player flow

### Minigame Containers
- Purpose: Interactive advertising experiences
- Features:
  - Custom game logic
  - Score tracking
  - Reward integration
  - Zone management
- Best Practices:
  - Clear player instructions
  - Fair difficulty scaling
  - Appropriate rewards
  - Smooth gameplay integration

## API Reference

### MMLNetwork.Initialize(config)
Initialize the MML Network module.

Parameters:
- `config.apiKey` (string): Your API key
- `config.baseUrl` (string, optional): Custom API endpoint
- `config.updateInterval` (number, optional): Update frequency in seconds
- `config.cacheTimeout` (number, optional): Cache duration in seconds

### MMLNetwork.CreateDisplayAd(config)
Create a billboard display advertisement.

Parameters:
- `config.containerId` (string): Container ID from dashboard
- `config.position` (Vector3): World position
- `config.size` (table): Width and height in studs

### MMLNetwork.CreateNPCAd(config)
Create an interactive NPC advertisement.

Parameters:
- `config.containerId` (string): Container ID from dashboard
- `config.position` (Vector3): World position

Events:
- `OnInteraction`: Fired when a player interacts with the NPC

### MMLNetwork.CreateMinigameAd(config)
Create a minigame advertisement zone.

Parameters:
- `config.containerId` (string): Container ID from dashboard
- `config.position` (Vector3): World position
- `config.size` (table): Width, height, and depth in studs

Events:
- `OnComplete`: Fired when a player completes the minigame

## Best Practices

1. Performance Optimization
   - Use appropriate update intervals
   - Implement proper caching
   - Manage asset loading efficiently
   - Monitor memory usage

2. Player Experience
   - Non-intrusive ad placement
   - Smooth content transitions
   - Appropriate interaction timing
   - Clear player feedback

3. Error Handling
   - Handle network failures gracefully
   - Provide fallback content
   - Monitor error rates
   - Implement retry logic

4. Security
   - Secure API key storage
   - Validate player interactions
   - Monitor for abuse
   - Regular security audits

## Troubleshooting

Common Issues:
1. Content Not Loading
   - Verify API key
   - Check network connectivity
   - Confirm container IDs
   - Review error logs

2. Performance Issues
   - Adjust update intervals
   - Optimize asset loading
   - Monitor memory usage
   - Review container placement

3. Integration Problems
   - Verify module installation
   - Check initialization
   - Review container configuration
   - Monitor error events

## Support

For additional support:
- Documentation: [docs.mml.com](https://docs.mml.com)
- Support Email: support@mml.com
- Developer Forum: [forum.mml.com](https://forum.mml.com) 