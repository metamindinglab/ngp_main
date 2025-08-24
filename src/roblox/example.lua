-- Example script showing MML Network integration
local MMLNetwork = require(game:GetService("ReplicatedStorage").MMLNetwork)

-- Initialize the network with your API key
MMLNetwork.Initialize({
    apiKey = "YOUR_API_KEY_HERE",
    baseUrl = "https://api.mml.com/v1", -- Optional: Override default API URL
    updateInterval = 5, -- Optional: How often to check for ad updates (seconds)
    cacheTimeout = 300 -- Optional: How long to cache ad content (seconds)
})

-- Example: Create a display ad (billboard)
local displayAd = MMLNetwork.CreateDisplayAd({
    containerId = "your_container_id_1",
    position = Vector3.new(0, 5, 0),
    size = {
        width = 10,
        height = 5
    }
})

-- Example: Create an NPC ad
local npcAd = MMLNetwork.CreateNPCAd({
    containerId = "your_container_id_2",
    position = Vector3.new(10, 0, 10)
})

-- Handle NPC interactions
npcAd.OnInteraction.Event:Connect(function(player)
    print(player.Name .. " interacted with the NPC ad!")
    -- Add your custom interaction logic here
end)

-- Example: Create a minigame ad
local minigameAd = MMLNetwork.CreateMinigameAd({
    containerId = "your_container_id_3",
    position = Vector3.new(-10, 0, -10),
    size = {
        width = 10,
        height = 10,
        depth = 10
    }
})

-- Handle minigame completion
minigameAd.OnComplete.Event:Connect(function(player, score)
    print(player.Name .. " completed the minigame with score: " .. score)
    -- Add your custom completion rewards here
end)

-- Example: Create multiple display ads in a grid
local function createAdGrid(startPos, rows, cols, spacing)
    for row = 1, rows do
        for col = 1, cols do
            local position = startPos + Vector3.new(
                (col - 1) * spacing,
                0,
                (row - 1) * spacing
            )
            
            MMLNetwork.CreateDisplayAd({
                containerId = "grid_ad_" .. row .. "_" .. col,
                position = position,
                size = {
                    width = spacing * 0.8,
                    height = spacing * 0.4
                }
            })
        end
    end
end

-- Create a 3x3 grid of display ads
createAdGrid(Vector3.new(-50, 5, -50), 3, 3, 20)

-- Example: Create an NPC path
local function createPatrollingNPC(containerId, waypoints)
    local npc = MMLNetwork.CreateNPCAd({
        containerId = containerId,
        position = waypoints[1]
    })
    
    local currentWaypoint = 1
    local humanoid = npc.instance:WaitForChild("Humanoid")
    
    -- Simple patrol behavior
    spawn(function()
        while wait(1) do
            currentWaypoint = (currentWaypoint % #waypoints) + 1
            humanoid:MoveTo(waypoints[currentWaypoint])
        end
    end)
    
    return npc
end

-- Create a patrolling NPC
local npcWaypoints = {
    Vector3.new(0, 0, 0),
    Vector3.new(20, 0, 0),
    Vector3.new(20, 0, 20),
    Vector3.new(0, 0, 20)
}
local patrollingNPC = createPatrollingNPC("patrol_npc_1", npcWaypoints)

-- Example: Create a minigame zone with trigger
local function createMinigameZone(containerId, position)
    local minigame = MMLNetwork.CreateMinigameAd({
        containerId = containerId,
        position = position,
        size = {
            width = 30,
            height = 20,
            depth = 30
        }
    })
    
    -- Create visual markers
    local markers = Instance.new("Model")
    markers.Name = "MinigameMarkers"
    
    local function createMarker(pos)
        local part = Instance.new("Part")
        part.Anchored = true
        part.Size = Vector3.new(1, 10, 1)
        part.Position = pos
        part.BrickColor = BrickColor.new("Really blue")
        part.Material = Enum.Material.Neon
        part.Parent = markers
    end
    
    -- Create corner markers
    local size = Vector3.new(30, 20, 30)
    local corners = {
        position + Vector3.new(size.X/2, 0, size.Z/2),
        position + Vector3.new(-size.X/2, 0, size.Z/2),
        position + Vector3.new(size.X/2, 0, -size.Z/2),
        position + Vector3.new(-size.X/2, 0, -size.Z/2)
    }
    
    for _, cornerPos in ipairs(corners) do
        createMarker(cornerPos)
    end
    
    markers.Parent = workspace
    
    return minigame
end

-- Create a minigame zone
local minigameZone = createMinigameZone(
    "minigame_zone_1",
    Vector3.new(50, 0, 50)
) 