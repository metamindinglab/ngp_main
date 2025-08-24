# Code Transparency and Security

## Our Commitment to Transparency

At MML Network, we believe in complete transparency about how our module interacts with your game. This document explains exactly what our code does and doesn't do.

## What Our Module CAN Do

1. **HTTP Communications**
```lua
-- We ONLY communicate with our API endpoints
local BASE_URL = "https://api.mml-network.com"
-- All network calls are visible in our source code
-- You can monitor all traffic in Developer Console
```

2. **Game Objects**
```lua
-- We ONLY create and modify:
- Billboard advertisements (Part + BillboardGui)
- NPC characters (if using NPC ads)
- Designated mini-game areas (if using mini-game ads)
```

3. **Data Collection**
```lua
-- We ONLY collect:
- Ad view counts
- Player interaction with ads
- Basic analytics (player count, engagement time)
- Error reports for troubleshooting
```

## What Our Module CANNOT Do

1. **Cannot Access Game Data**
```lua
-- We DO NOT:
- Read your game's scripts
- Access game data structures
- Modify existing game objects
- Access player data beyond basic counts
```

2. **Cannot Make Unauthorized Communications**
```lua
-- We DO NOT:
- Connect to any servers except api.mml-network.com
- Send any data except ad metrics
- Download unauthorized content
```

3. **Cannot Modify Game**
```lua
-- We DO NOT:
- Change any game settings
- Modify existing scripts
- Add unauthorized scripts
- Change game behavior
```

## Code Verification

1. **Open Source Module**
- All our code is visible in the ModuleScript
- No obfuscated or encrypted code
- Clear comments explaining functionality
- Documented API calls

2. **Verify Network Calls**
```lua
-- Monitor all HTTP traffic in Developer Console:
game:GetService("HttpService"):GetAsync()
game:GetService("HttpService"):PostAsync()
```

3. **Verify Created Objects**
```lua
-- All objects we create are visible in Explorer:
workspace.MMLNetwork_Containers
```

## Security Best Practices

1. **API Key Security**
```lua
-- CORRECT: Place in ServerScript
local API_KEY = "your-key"  -- Only visible to server

-- INCORRECT: DO NOT place in ReplicatedStorage
-- This would expose your key to clients
```

2. **Module Location**
```lua
-- Place module in ReplicatedStorage
-- This allows proper client/server communication
-- But keeps API key and sensitive operations on server
```

3. **Monitoring**
```lua
-- Enable debug mode to see all operations
MMLNetwork.Initialize({
    apiKey = "your-key",
    debug = true  -- Logs all actions to Output
})
```

## Independent Verification

1. **Code Review**
- Have your developers review our code
- All functions are documented and commented
- No minified or obfuscated code
- Clear variable and function names

2. **Network Monitoring**
- Use Roblox Developer Console to monitor traffic
- All requests go to api.mml-network.com
- Data payloads are human-readable JSON

3. **Object Monitoring**
- All created objects use clear naming
- Objects only appear in designated locations
- No hidden or unauthorized changes

## Regular Audits

1. **Version Control**
- All code changes are documented
- Change logs available in our portal
- Previous versions accessible

2. **Security Updates**
- Regular security audits
- Transparent update process
- Advance notice of changes

## Contact and Support

If you have security concerns:
- Email: security@mml-network.com
- Discord: [Security Channel](https://discord.gg/mml-network)
- Documentation: [Security Docs](https://docs.mml-network.com/security)

## Code Examples

### 1. Network Calls
```lua
-- Example of ALL possible network calls:
local function makeRequest(method, endpoint, body, headers)
    -- Only connects to our API
    local url = "https://api.mml-network.com" .. endpoint
    
    -- All headers visible
    headers = headers or {}
    headers["Authorization"] = "Bearer " .. API_KEY
    
    -- Clear, readable data
    return HttpService:RequestAsync({
        Url = url,
        Method = method,
        Headers = headers,
        Body = body and HttpService:JSONEncode(body) or nil
    })
end
```

### 2. Object Creation
```lua
-- Example of ALL objects we create:
local function createBillboard(config)
    -- Visible in workspace
    local container = Instance.new("Folder")
    container.Name = "MMLNetwork_Ad_" .. config.containerId
    container.Parent = workspace
    
    -- Standard Roblox objects only
    local part = Instance.new("Part")
    part.Anchored = true
    part.CanCollide = false
    
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(config.size.X, 0, config.size.Y, 0)
    
    return container
end
```

### 3. Data Collection
```lua
-- Example of ALL data we collect:
local function trackView(containerId)
    return {
        eventType = "view",
        data = {
            timestamp = os.time(),
            playerCount = #game.Players:GetPlayers()
        }
    }
end
``` 