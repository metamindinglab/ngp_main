--[[
    MML Network Advertisement Module
    Version: 1.0.0
    
    SECURITY AND TRANSPARENCY NOTICE:
    - This module ONLY creates ad-related objects in your game
    - ONLY communicates with api.mml-network.com
    - ONLY collects ad engagement metrics
    - Source code is fully visible and documented
    - No obfuscated or encrypted code
    - All network calls can be monitored in Developer Console
    - All created objects are clearly named and visible in Explorer
    
    For security documentation visit:
    https://docs.mml-network.com/security
    
    Report security concerns:
    security@mml-network.com
--]]

local MMLNetwork = {}

-- Services
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")

-- Constants
local BASE_URL = "https://api.mml-network.com"  -- Only server we connect to
local DEFAULT_UPDATE_INTERVAL = 60
local DEFAULT_VIEW_DISTANCE = 100

-- Private variables
local API_KEY = nil
local debug = false
local containers = {}
local lastUpdate = 0
local updateInterval = DEFAULT_UPDATE_INTERVAL

-- Debug logging
local function log(...)
    if debug then
        print("[MMLNetwork]", ...)
    end
end

--[[
    Network Communication
    - Only connects to api.mml-network.com
    - Only sends ad-related data
    - All calls use HTTPS
    - Visible in Developer Console
--]]
local function makeRequest(method, endpoint, body, headers)
    -- Log all network calls when debug is enabled
    if debug then
        print("[MMLNetwork] Making request:", method, endpoint)
        if body then
            print("[MMLNetwork] Request body:", HttpService:JSONEncode(body))
        end
    end
    
    headers = headers or {}
    headers["Authorization"] = "Bearer " .. API_KEY
    
    local success, result = pcall(function()
        return HttpService:RequestAsync({
            Url = BASE_URL .. endpoint,
            Method = method,
            Headers = headers,
            Body = body and HttpService:JSONEncode(body) or nil
        })
    end)
    
    -- Log responses in debug mode
    if debug and success then
        print("[MMLNetwork] Response:", result.Body)
    end
    
    if success then
        if result.Success then
            return true, HttpService:JSONDecode(result.Body)
        else
            return false, "HTTP " .. result.StatusCode .. ": " .. result.StatusMessage
        end
    else
        return false, "Request failed: " .. result
    end
end

--[[
    Ad Content Fetching
    - Only fetches ad content from our server
    - Returns standardized ad format
    - No executable code is downloaded
--]]
local function getAdContent(containerId)
    local success, result = makeRequest(
        "GET",
        "/containers/" .. containerId .. "/ad"
    )
    
    if success then
        log("Got ad content for container", containerId)
        return result
    else
        warn("Failed to get ad content:", result)
        return nil
    end
end

--[[
    Billboard Creation
    - Creates standard Roblox objects only
    - All objects are visible in Explorer
    - Clear naming convention
    - No hidden objects
--]]
local function createBillboard(config)
    -- Create a container folder for organization
    local container = Instance.new("Folder")
    container.Name = "MMLNetwork_Ad_" .. config.containerId
    container.Parent = workspace
    
    -- Create the physical part
    local part = Instance.new("Part")
    part.Name = "AdSurface"
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = config.transparency or 0
    part.Position = config.position
    part.Parent = container
    
    -- Create the billboard GUI
    local billboard = Instance.new("BillboardGui")
    billboard.Name = "AdContent"
    billboard.Size = UDim2.new(config.size.X, 0, config.size.Y, 0)
    billboard.StudsOffset = Vector3.new(0, 0, 0)
    billboard.Parent = part
    
    -- Create the container frame
    local frame = Instance.new("Frame")
    frame.Name = "ContentFrame"
    frame.Size = UDim2.new(1, 0, 1, 0)
    frame.BackgroundTransparency = 1
    frame.Parent = billboard
    
    return {
        container = container,
        part = part,
        billboard = billboard,
        frame = frame
    }
end

--[[
    Module Initialization
    - Sets up API key and configuration
    - No game modifications
    - Clear debug logging
--]]
function MMLNetwork.Initialize(config)
    if not config or not config.apiKey then
        error("MMLNetwork.Initialize requires an API key")
        return false
    end
    
    API_KEY = config.apiKey
    debug = config.debug or false
    updateInterval = config.updateInterval or DEFAULT_UPDATE_INTERVAL
    
    log("Initialized with update interval", updateInterval)
    return true
end

--[[
    Display Ad Creation
    - Creates visible billboard only
    - Standard Roblox objects
    - Clear object hierarchy
    - Automatic cleanup
--]]
function MMLNetwork.CreateDisplayAd(config)
    if not API_KEY then
        error("MMLNetwork not initialized. Call Initialize first.")
        return nil
    end
    
    if not config.containerId then
        error("containerId is required")
        return nil
    end
    
    -- Create the container object
    local container = {
        id = config.containerId,
        type = "DISPLAY",
        position = config.position,
        size = config.size,
        enabled = config.enabled ~= false,
        OnContentUpdate = Instance.new("BindableEvent"),
        OnError = Instance.new("BindableEvent"),
        OnStatusChange = Instance.new("BindableEvent"),
        OnEngagement = Instance.new("BindableEvent")
    }
    
    -- Create the physical billboard
    local billboard = createBillboard(config)
    container.container = billboard.container
    container.part = billboard.part
    container.billboard = billboard.billboard
    container.frame = billboard.frame
    
    -- Add methods
    function container:SetEnabled(enabled)
        self.enabled = enabled
        self.part.Transparency = enabled and 0 or 1
        self.billboard.Enabled = enabled
        self.OnStatusChange:Fire(enabled and "ACTIVE" or "INACTIVE")
    end
    
    function container:SetPosition(position)
        self.position = position
        self.part.Position = position
    end
    
    function container:Destroy()
        self.OnContentUpdate:Destroy()
        self.OnError:Destroy()
        self.OnStatusChange:Destroy()
        self.OnEngagement:Destroy()
        self.container:Destroy()
        containers[self.id] = nil
    end
    
    -- Set up content updates
    spawn(function()
        while container.enabled do
            local content = getAdContent(container.id)
            if content then
                if content.hasAd then
                    -- Update the billboard with new content
                    -- This is simplified; actual implementation would handle
                    -- different asset types and transitions
                    container.OnContentUpdate:Fire(content)
                end
            end
            wait(updateInterval)
        end
    end)
    
    -- Store the container
    containers[config.containerId] = container
    log("Created display ad container", config.containerId)
    
    return container
end

--[[
    Engagement Tracking
    - Only tracks ad-related metrics
    - Basic player counts and interactions
    - No personal data collection
    - Clear data format
--]]
function MMLNetwork.TrackEngagement(containerId, event)
    if not API_KEY then
        error("MMLNetwork not initialized. Call Initialize first.")
        return false
    end
    
    if not containerId or not event then
        error("containerId and event are required")
        return false
    end
    
    -- Log what data we're sending
    if debug then
        print("[MMLNetwork] Tracking engagement:", HttpService:JSONEncode(event))
    end
    
    local success, result = makeRequest(
        "POST",
        "/containers/" .. containerId .. "/engagement",
        event,
        {["Content-Type"] = "application/json"}
    )
    
    if success then
        log("Tracked engagement for container", containerId)
        local container = containers[containerId]
        if container then
            container.OnEngagement:Fire(event)
        end
        return true
    else
        warn("Failed to track engagement:", result)
        return false
    end
end

--[[
    Version Information
    - Clear version tracking
    - No hidden updates
--]]
function MMLNetwork.GetVersion()
    return "1.0.0"
end

--[[
    Debug Mode
    - Enables detailed logging
    - Shows all network calls
    - Tracks object creation
--]]
function MMLNetwork.SetDebugMode(enabled)
    debug = enabled
    log("Debug mode:", enabled)
end

return MMLNetwork 