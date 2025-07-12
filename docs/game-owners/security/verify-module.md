# Verifying MML Network Module Security

## Quick Security Check

1. **View Module Source**
```lua
-- In Roblox Studio:
1. Open Explorer
2. Find MMLNetwork in ReplicatedStorage
3. Right-click > View Source
```

2. **Enable Debug Mode**
```lua
MMLNetwork.Initialize({
    apiKey = "your-key",
    debug = true  -- Shows all operations
})
```

3. **Monitor Network Traffic**
```lua
-- In Roblox Studio:
1. Open Developer Console (View > Developer Console)
2. Filter for "HttpService"
3. Verify all calls go to api.mml-network.com
```

## Step-by-Step Verification

### 1. Check Module Structure
```lua
-- Module should ONLY contain:
1. Standard Lua code (no binary/encrypted content)
2. Clear function names and comments
3. Documented API endpoints
4. Standard Roblox services (HttpService, RunService)
```

### 2. Verify Object Creation
```lua
-- In Explorer, find:
MMLNetwork_Ad_[container-id]/
  ├── AdSurface (Part)
  │   └── AdContent (BillboardGui)
  │       └── ContentFrame (Frame)
```

### 3. Monitor Network Calls
```lua
-- Should ONLY see calls to:
GET  https://api.mml-network.com/containers/{id}/ad
POST https://api.mml-network.com/containers/{id}/engagement
```

### 4. Check Data Collection
```lua
-- Only collects:
{
    "eventType": "view",
    "data": {
        "timestamp": 1234567890,
        "playerCount": 10
    }
}
```

## Security Red Flags

Watch for these suspicious behaviors:

### 1. Unauthorized Network Calls
```lua
-- BAD: Calls to unknown domains
HttpService:GetAsync("https://unknown-domain.com")

-- GOOD: Only our domain
HttpService:GetAsync("https://api.mml-network.com")
```

### 2. Hidden Objects
```lua
-- BAD: Hidden or strangely named objects
Instance.new("Script").Parent = nil

-- GOOD: Clear hierarchy
MMLNetwork_Ad_123/AdSurface/AdContent
```

### 3. Code Execution
```lua
-- BAD: Loading remote code
loadstring(httpGet("..."))

-- GOOD: Only local functions
local function createBillboard()
```

### 4. Data Access
```lua
-- BAD: Accessing game data
game.Players.PlayerAdded:Connect()

-- GOOD: Only ad-related data
container.OnContentUpdate:Connect()
```

## Testing Protocol

1. **Test Environment**
```lua
-- Create test place
-- Enable HTTP requests
-- Enable Developer Console
```

2. **Module Installation**
```lua
-- Verify module source
-- Place in ReplicatedStorage
-- Check for any errors
```

3. **Create Test Container**
```lua
-- Monitor object creation
-- Check hierarchy
-- Verify properties
```

4. **Network Monitoring**
```lua
-- Enable debug mode
-- Watch Developer Console
-- Verify all URLs
-- Check request bodies
```

5. **Data Collection**
```lua
-- Monitor engagement data
-- Verify player privacy
-- Check analytics
```

## Reporting Issues

If you find suspicious behavior:

1. **Disable Module**
```lua
-- Remove from game
-- Report container ID
-- Save diagnostic logs
```

2. **Contact Security Team**
- Email: security@mml-network.com
- Include:
  - Game ID
  - Container ID
  - Screenshots/logs
  - Description of issue

## Best Practices

1. **Regular Audits**
```lua
-- Check module updates
-- Review network logs
-- Monitor object creation
```

2. **Access Control**
```lua
-- Keep API key secure
-- Use server-side scripts
-- Monitor permissions
```

3. **Testing**
```lua
-- Test in private servers
-- Monitor performance
-- Check error handling
```

## Support Resources

- Documentation: [docs.mml-network.com/security](https://docs.mml-network.com/security)
- GitHub: [github.com/mml-network/roblox-module](https://github.com/mml-network/roblox-module)
- Discord: [discord.gg/mml-network](https://discord.gg/mml-network)
- Email: security@mml-network.com 