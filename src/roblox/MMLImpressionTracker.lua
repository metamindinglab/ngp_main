-- src/roblox/MMLImpressionTracker.lua
-- Tracks per-player views (duration) and touch interactions for container ads

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local MMLImpressionTracker = {}

local activeTrackers = {} -- containerId -> { adId, startedAt, perPlayer = { [userId] = {viewStart, duration}}, hbConn, touchConns }

local function getContainer(containerId)
	if not _G.MMLNetwork or not _G.MMLNetwork._containers then return nil end
	return _G.MMLNetwork._containers[containerId]
end

local function getPlayerFromHit(part)
	if not part or not part.Parent then return nil end
	local character = part.Parent
	return Players:GetPlayerFromCharacter(character)
end

local function queueViewDuration(containerId, userId, seconds)
	if seconds <= 0 then return end
	local player = Players:GetPlayerByUserId(tonumber(userId))
	local playerInfo = player and {
		id = tostring(player.UserId),
		name = player.Name,
		country = player:GetAttribute("Country") or nil,
		accountAge = player.AccountAge,
		membershipType = tostring(player.MembershipType)
	} or nil
	local container = getContainer(containerId)
	if not container then return end
	local adId = container.adRotation.currentAdId
	if not adId then return end
	local payload = {
		containerId = containerId,
		adId = adId,
		event = "view",
		duration = seconds,
		player = playerInfo,
		timestamp = tick()
	}
	print("[MML][Impression] Queue view:", containerId, adId, string.format("%.2fs", seconds), playerInfo and playerInfo.id or "anon")
	local MMLRequestManager = require(script.Parent.MMLRequestManager)
	MMLRequestManager.queueImpression(payload)
end

local function queueTouch(containerId, player)
	local container = getContainer(containerId)
	if not container then return end
	local adId = container.adRotation.currentAdId
	if not adId then return end
	local payload = {
		containerId = containerId,
		adId = adId,
		event = "touch",
		player = player and {
			id = tostring(player.UserId),
			name = player.Name,
			country = player:GetAttribute("Country") or nil,
			accountAge = player.AccountAge,
			membershipType = tostring(player.MembershipType)
		} or nil,
		timestamp = tick()
	}
	print("[MML][Impression] Queue touch:", containerId, adId, player and player.UserId or "")
	local MMLRequestManager = require(script.Parent.MMLRequestManager)
	MMLRequestManager.queueImpression(payload)
end

function MMLImpressionTracker.startTracking(containerId, assetInstance, surfaceGui, adMeta)
	if activeTrackers[containerId] then return end
	local container = getContainer(containerId)
	if not container then return end
	activeTrackers[containerId] = {
		adId = adMeta and adMeta.id or container.adRotation.currentAdId,
		startedAt = tick(),
		perPlayer = {},
		touchConns = {}
	}
	-- Heartbeat accumulation per player when container visible and player near/facing
	activeTrackers[containerId].hbConn = RunService.Heartbeat:Connect(function(dt)
		for _, player in pairs(Players:GetPlayers()) do
			local entry = activeTrackers[containerId]
			if not entry then return end
			local userId = tostring(player.UserId)
			-- Reuse streamer visibility logic: basic proximity check via character present
			if container.visibility.isInCameraView then
				entry.perPlayer[userId] = entry.perPlayer[userId] or { duration = 0 }
				entry.perPlayer[userId].duration = entry.perPlayer[userId].duration + dt
				-- Ship in 5s chunks
				if entry.perPlayer[userId].duration >= 5 then
					queueViewDuration(containerId, userId, entry.perPlayer[userId].duration)
					entry.perPlayer[userId].duration = 0
				end
			end
		end
	end)
	-- Touch events for BasePart assets
	if assetInstance and assetInstance:IsA("BasePart") then
		local conn = assetInstance.Touched:Connect(function(hit)
			local player = getPlayerFromHit(hit)
			if player then
				queueTouch(containerId, player)
			end
		end)
		table.insert(activeTrackers[containerId].touchConns, conn)
	end
end

function MMLImpressionTracker.stopTracking(containerId)
	local entry = activeTrackers[containerId]
	if not entry then return end
	-- Flush any remaining durations
	for userId, rec in pairs(entry.perPlayer) do
		if rec.duration and rec.duration > 0 then
			queueViewDuration(containerId, userId, rec.duration)
		end
	end
	if entry.hbConn then entry.hbConn:Disconnect() end
	for _, c in pairs(entry.touchConns) do
		pcall(function() c:Disconnect() end)
	end
	activeTrackers[containerId] = nil
end

return MMLImpressionTracker


