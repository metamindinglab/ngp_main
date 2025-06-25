# Roblox Game Integration Guide
## MML Game Network API

This guide shows how to integrate your Roblox game with the MML Game Network API to manage ads, assets, and game data.

## Prerequisites

1. **Game Registration**: Your game must be registered in the MML Game Network dashboard
2. **API Key**: Generate an API key from the Games Manager UI (format: `RBXG-{hash}`)
3. **HTTP Service**: Enable HTTP requests in your game's settings

## API Configuration

### Base URL
```lua
local API_BASE = "http://23.96.197.67:3000/api/roblox-game"
```

### Authentication
Use your API key in the `X-API-Key` header for all requests.

## Roblox Script Examples

### 1. HTTP Service Setup
```lua
-- ServerScriptService/MMLGameNetwork.lua
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")

local MMLGameNetwork = {}
MMLGameNetwork.__index = MMLGameNetwork

-- Configuration
local API_BASE = "http://23.96.197.67:3000/api/roblox-game"
local API_KEY = "RBXG-your-api-key-here" -- Store this securely!

-- Rate limiting
local REQUEST_COOLDOWN = 0.6 -- 100 requests per minute = 1 request per 0.6 seconds
local lastRequestTime = 0

function MMLGameNetwork.new()
    local self = setmetatable({}, MMLGameNetwork)
    return self
end

function MMLGameNetwork:makeRequest(method, endpoint, data)
    -- Rate limiting
    local currentTime = tick()
    if currentTime - lastRequestTime < REQUEST_COOLDOWN then
        wait(REQUEST_COOLDOWN - (currentTime - lastRequestTime))
    end
    lastRequestTime = tick()
    
    local url = API_BASE .. endpoint
    local headers = {
        ["Content-Type"] = "application/json",
        ["X-API-Key"] = API_KEY
    }
    
    local requestOptions = {
        Url = url,
        Method = method,
        Headers = headers
    }
    
    if data then
        requestOptions.Body = HttpService:JSONEncode(data)
    end
    
    local success, response = pcall(function()
        return HttpService:RequestAsync(requestOptions)
    end)
    
    if not success then
        warn("API Request failed:", response)
        return nil, response
    end
    
    if response.StatusCode >= 200 and response.StatusCode < 300 then
        local data = HttpService:JSONDecode(response.Body)
        return data, nil
    else
        local error = HttpService:JSONDecode(response.Body)
        warn("API Error:", response.StatusCode, error.error)
        return nil, error
    end
end

return MMLGameNetwork
```

### 2. Game Ads Management
```lua
-- Example: Fetching and displaying game ads
local MMLGameNetwork = require(script.Parent.MMLGameNetwork)
local api = MMLGameNetwork.new()

function fetchGameAds()
    local data, error = api:makeRequest("GET", "/game-ads")
    
    if error then
        warn("Failed to fetch game ads:", error.error)
        return
    end
    
    print("Successfully fetched", #data.ads, "game ads")
    
    for _, ad in pairs(data.ads) do
        print("Ad:", ad.name, "Status:", ad.status)
        -- Process ad data here
        displayAd(ad)
    end
end

function displayAd(adData)
    -- Example: Create a GUI element for the ad
    if adData.status == "active" and adData.assets then
        for _, asset in pairs(adData.assets) do
            if asset.assetType == "image" and asset.robloxAssetId then
                -- Display image ad
                createImageAd(asset.robloxAssetId, adData.name)
            end
        end
    end
end

function createImageAd(assetId, adName)
    -- Create a SurfaceGui for the ad
    local surfaceGui = Instance.new("SurfaceGui")
    surfaceGui.Name = "GameAd_" .. adName
    
    local imageLabel = Instance.new("ImageLabel")
    imageLabel.Image = "rbxassetid://" .. assetId
    imageLabel.Size = UDim2.new(1, 0, 1, 0)
    imageLabel.BackgroundTransparency = 1
    imageLabel.Parent = surfaceGui
    
    -- Find a suitable part to display the ad
    local adPart = workspace:FindFirstChild("AdDisplay")
    if adPart then
        surfaceGui.Parent = adPart
    end
end

-- Fetch ads when the script starts
fetchGameAds()
```

### 3. Performance Tracking
```lua
-- Example: Sending player engagement data
function trackAdEngagement(adId, playerId, action)
    local data = {
        adId = adId,
        playerId = playerId,
        action = action, -- "view", "click", "dismiss"
        timestamp = os.time(),
        playerLevel = getPlayerLevel(playerId),
        playerRegion = getPlayerRegion(playerId)
    }
    
    api:makeRequest("POST", "/game-ads/" .. adId .. "/engagement", data)
end

function getPlayerLevel(playerId)
    local player = game.Players:GetPlayerByUserId(playerId)
    if player and player:FindFirstChild("leaderstats") then
        local level = player.leaderstats:FindFirstChild("Level")
        return level and level.Value or 1
    end
    return 1
end

function getPlayerRegion(playerId)
    local player = game.Players:GetPlayerByUserId(playerId)
    if player then
        local localizationService = game:GetService("LocalizationService")
        local result, code = pcall(function()
            return localizationService:GetCountryRegionForPlayerAsync(player)
        end)
        return result and code or "Unknown"
    end
    return "Unknown"
end
```

### 4. Error Handling & Retry Logic
```lua
function makeRequestWithRetry(method, endpoint, data, maxRetries)
    maxRetries = maxRetries or 3
    local attempt = 1
    
    while attempt <= maxRetries do
        local response, error = api:makeRequest(method, endpoint, data)
        
        if response then
            return response, nil
        end
        
        -- Handle specific error cases
        if error and error.error then
            if error.error:find("Rate limit exceeded") then
                -- Wait for rate limit reset
                local resetTime = error.resetTime or (os.time() + 60)
                local waitTime = resetTime - os.time()
                if waitTime > 0 and waitTime < 120 then -- Max 2 minute wait
                    wait(waitTime)
                    attempt = attempt + 1
                    continue
                end
            elseif error.error:find("Invalid API key") then
                -- Don't retry for auth errors
                warn("Authentication failed - check your API key")
                return nil, error
            end
        end
        
        -- Exponential backoff for other errors
        if attempt < maxRetries then
            wait(math.pow(2, attempt - 1)) -- 1s, 2s, 4s
        end
        
        attempt = attempt + 1
    end
    
    return nil, error
end
```

### 5. Asset Management
```lua
function checkAssetUpdates()
    local data, error = api:makeRequest("GET", "/assets/updates")
    
    if error then
        warn("Failed to check asset updates:", error.error)
        return
    end
    
    for _, asset in pairs(data.updates) do
        if asset.status == "updated" then
            updateGameAsset(asset)
        elseif asset.status == "removed" then
            removeGameAsset(asset)
        end
    end
end

function updateGameAsset(assetData)
    -- Handle asset updates in your game
    print("Updating asset:", assetData.name, "to version:", assetData.version)
    
    -- Example: Update a decal
    if assetData.type == "decal" then
        local decalPart = workspace:FindFirstChild(assetData.name)
        if decalPart and decalPart:FindFirstChild("Decal") then
            decalPart.Decal.Texture = "rbxassetid://" .. assetData.robloxAssetId
        end
    end
end
```

## Best Practices

### 1. **Secure API Key Storage**
```lua
-- DON'T store API keys in scripts that replicate to client
-- DO store them in ServerStorage or use secure methods

local ServerStorage = game:GetService("ServerStorage")
local config = ServerStorage:FindFirstChild("MMLConfig")
local API_KEY = config and config:GetAttribute("APIKey") or ""
```

### 2. **Rate Limiting Compliance**
```lua
-- Respect rate limits (100 requests per minute)
-- Implement proper cooldowns between requests
-- Cache responses when possible

local CACHE_DURATION = 300 -- 5 minutes
local cache = {}

function getCachedData(endpoint)
    local cached = cache[endpoint]
    if cached and (tick() - cached.timestamp) < CACHE_DURATION then
        return cached.data
    end
    return nil
end

function setCachedData(endpoint, data)
    cache[endpoint] = {
        data = data,
        timestamp = tick()
    }
end
```

### 3. **Error Handling**
```lua
-- Always handle errors gracefully
-- Provide fallback behavior when API is unavailable
-- Log errors for debugging

function safeApiCall(method, endpoint, data)
    local success, result = pcall(function()
        return api:makeRequest(method, endpoint, data)
    end)
    
    if not success then
        warn("API call failed:", result)
        -- Return cached data or default values
        return getCachedData(endpoint) or getDefaultData(endpoint)
    end
    
    return result
end
```

### 4. **Performance Optimization**
```lua
-- Batch requests when possible
-- Use coroutines for non-blocking calls
-- Implement smart caching

function fetchMultipleAds(adIds)
    local responses = {}
    local threads = {}
    
    for _, adId in pairs(adIds) do
        local thread = coroutine.create(function()
            local data, error = api:makeRequest("GET", "/game-ads/" .. adId)
            responses[adId] = data or error
        end)
        
        table.insert(threads, thread)
        coroutine.resume(thread)
    end
    
    -- Wait for all requests to complete
    for _, thread in pairs(threads) do
        while coroutine.status(thread) ~= "dead" do
            wait(0.1)
        end
    end
    
    return responses
end
```

## Troubleshooting

### Common Issues

1. **HTTP 401 - Unauthorized**
   - Check your API key format (must start with `RBXG-`)
   - Verify the API key is active in the dashboard
   - Ensure you're using the correct header (`X-API-Key`)

2. **HTTP 429 - Rate Limited**
   - Implement proper request cooldowns
   - Cache responses to reduce API calls
   - Use exponential backoff for retries

3. **HTTP 403 - Forbidden**
   - Your game may not have permission for this endpoint
   - Contact support to verify game registration

4. **Connection Errors**
   - Check if HTTP requests are enabled in game settings
   - Verify the API server is accessible
   - Implement retry logic with timeouts

### Support

For additional support:
- Check the MML Game Network dashboard for API status
- Contact the development team through the dashboard
- Review server logs for detailed error information

## Rate Limits

- **Limit**: 100 requests per minute per API key
- **Headers**: Check `X-RateLimit-Remaining` and `X-RateLimit-Reset`
- **Recommendation**: Space requests at least 0.6 seconds apart

## Security Notes

- **Never** expose API keys in client-side scripts
- Store API keys securely in ServerStorage
- Validate all incoming data before processing
- Monitor for unusual API usage patterns 