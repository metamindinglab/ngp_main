-- src/roblox/MMLUtil.lua
-- Utility helpers for safely handling Models/Parts positions and CFrames

local MMLUtil = {}

-- Find the most reasonable PrimaryPart candidate inside a Model
function MMLUtil.findBestPrimaryPart(model)
	if not model or not model:IsA("Model") then
		return nil
	end

	-- Prefer existing PrimaryPart
	if model.PrimaryPart then
		return model.PrimaryPart
	end

	-- Prefer common part names if present
	local preferredNames = { "PrimaryPart", "HumanoidRootPart", "RootPart", "Handle", "Head" }
	for _, name in ipairs(preferredNames) do
		local candidate = model:FindFirstChild(name)
		if candidate and candidate:IsA("BasePart") then
			return candidate
		end
	end

	-- Fallback: first BasePart descendant
	for _, descendant in ipairs(model:GetDescendants()) do
		if descendant:IsA("BasePart") then
			return descendant
		end
	end

	return nil
end

-- Ensure PrimaryPart is set when possible; returns the PrimaryPart if set/available
function MMLUtil.ensurePrimaryPart(model)
	if not model or not model:IsA("Model") then
		return nil
	end

	if model.PrimaryPart then
		return model.PrimaryPart
	end

	local best = MMLUtil.findBestPrimaryPart(model)
	if best then
		pcall(function()
			model.PrimaryPart = best
		end)
		return best
	end

	return nil
end

-- Safely get a CFrame from a Model or BasePart. Returns nil if not resolvable.
function MMLUtil.getInstanceCFrame(instance)
	if not instance then
		return nil
	end

	if instance:IsA("BasePart") then
		return instance.CFrame
	end

	if instance:IsA("Model") then
		local primary = MMLUtil.ensurePrimaryPart(instance)
		if primary then
			return primary.CFrame
		end
		-- Try Model:GetPivot() on newer runtimes
		local ok, pivot = pcall(function()
			return instance:GetPivot()
		end)
		if ok and typeof(pivot) == "CFrame" then
			return pivot
		end
	end

	return nil
end

-- Safely get a Vector3 position from a Model or BasePart. Defaults to (0,0,0)
function MMLUtil.getInstancePosition(instance)
	local cf = MMLUtil.getInstanceCFrame(instance)
	if cf then
		return cf.Position
	end
	return Vector3.new(0, 0, 0)
end

return MMLUtil


