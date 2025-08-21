-- src/roblox/MMLImpressionTracker.lua
-- Tracks per-player views (duration) and touch interactions for container ads

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local MMLImpressionTracker = {}

local activeTrackers = {} -- containerId -> { adId, startedAt, perPlayer = { [userId] = {viewStart, duration}}, hbConn, touchConns }

local function getContainer(containerId)
\tif not _G.MMLNetwork or not _G.MMLNetwork._containers then return nil end
\treturn _G.MMLNetwork._containers[containerId]
end

local function getPlayerFromHit(part)
\tif not part or not part.Parent then return nil end
\tlocal character = part.Parent
\treturn Players:GetPlayerFromCharacter(character)
end

local function queueViewDuration(containerId, userId, seconds)
\tif seconds <= 0 then return end
\tlocal player = Players:GetPlayerByUserId(tonumber(userId))
\tlocal playerInfo = player and {
\t\tid = tostring(player.UserId),
\t\tname = player.Name,
\t\tcountry = player:GetAttribute("Country") or nil,
\t\taccountAge = player.AccountAge,
\t\tmembershipType = tostring(player.MembershipType)
\t} or nil
\tlocal container = getContainer(containerId)
\tif not container then return end
\tlocal adId = container.adRotation.currentAdId
\tif not adId then return end
\tlocal payload = {
\t\tcontainerId = containerId,
\t\tadId = adId,
\t\tevent = "view",
\t\tduration = seconds,
\t\tplayer = playerInfo,
\t\ttimestamp = tick()
\t}
\tlocal MMLRequestManager = require(script.Parent.MMLRequestManager)
\tMMLRequestManager.queueImpression(payload)
end

local function queueTouch(containerId, player)
\tlocal container = getContainer(containerId)
\tif not container then return end
\tlocal adId = container.adRotation.currentAdId
\tif not adId then return end
\tlocal payload = {
\t\tcontainerId = containerId,
\t\tadId = adId,
\t\tevent = "touch",
\t\tplayer = player and {
\t\t\tid = tostring(player.UserId),
\t\t\tname = player.Name,
\t\t\tcountry = player:GetAttribute("Country") or nil,
\t\t\taccountAge = player.AccountAge,
\t\t\tmembershipType = tostring(player.MembershipType)
\t\t} or nil,
\t\ttimestamp = tick()
\t}
\tlocal MMLRequestManager = require(script.Parent.MMLRequestManager)
\tMMLRequestManager.queueImpression(payload)
end

function MMLImpressionTracker.startTracking(containerId, assetInstance, surfaceGui, adMeta)
\tif activeTrackers[containerId] then return end
\tlocal container = getContainer(containerId)
\tif not container then return end
\tactiveTrackers[containerId] = {
\t\tadId = adMeta and adMeta.id or container.adRotation.currentAdId,
\t\tstartedAt = tick(),
\t\tperPlayer = {},
\t\ttouchConns = {}
\t}
\t-- Heartbeat accumulation per player when container visible and player near/facing
\tactiveTrackers[containerId].hbConn = RunService.Heartbeat:Connect(function(dt)
\t\tfor _, player in pairs(Players:GetPlayers()) do
\t\t\tlocal entry = activeTrackers[containerId]
\t\t\tif not entry then return end
\t\t\tlocal userId = tostring(player.UserId)
\t\t\t-- Reuse streamer visibility logic: basic proximity check via character present
\t\t\tif container.visibility.isInCameraView then
\t\t\t\tentry.perPlayer[userId] = entry.perPlayer[userId] or { duration = 0 }
\t\t\t\tentry.perPlayer[userId].duration = entry.perPlayer[userId].duration + dt
\t\t\t\t-- Ship in 5s chunks
\t\t\t\tif entry.perPlayer[userId].duration >= 5 then
\t\t\t\t\tqueueViewDuration(containerId, userId, entry.perPlayer[userId].duration)
\t\t\t\t\tentry.perPlayer[userId].duration = 0
\t\t\t\tend
\t\t\tend
\t\tend
\tend)
\t-- Touch events for BasePart assets
\tif assetInstance and assetInstance:IsA("BasePart") then
\t\tlocal conn = assetInstance.Touched:Connect(function(hit)
\t\t\tlocal player = getPlayerFromHit(hit)
\t\t\tif player then
\t\t\t\tqueueTouch(containerId, player)
\t\t\tend
\t\tend)
\t\ttable.insert(activeTrackers[containerId].touchConns, conn)
\tend
end

function MMLImpressionTracker.stopTracking(containerId)
\tlocal entry = activeTrackers[containerId]
\tif not entry then return end
\t-- Flush any remaining durations
\tfor userId, rec in pairs(entry.perPlayer) do
\t\tif rec.duration and rec.duration > 0 then
\t\t\tqueueViewDuration(containerId, userId, rec.duration)
\t\tend
\tend
\tif entry.hbConn then entry.hbConn:Disconnect() end
\tfor _, c in pairs(entry.touchConns) do
\t\tpcall(function() c:Disconnect() end)
\tend
\tactiveTrackers[containerId] = nil
end

return MMLImpressionTracker


