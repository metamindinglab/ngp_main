# **MML Network v2.0 - Quick Start Guide**
## **🚀 Get Started in 15 Minutes**

---

## **⚡ Prerequisites**
- Roblox Studio access
- Published Roblox game
- Game Owner Portal account

---

## **📋 5-Step Quick Setup**

### **Step 1: Portal Setup (3 minutes)**
```
1. 🌐 Go to: your-domain.com/game-owner
2. 📝 Register → Add Game → Get API Key
3. 🏗️ Create Containers (one per ad location)
4. 📥 Download integration package
```

### **Step 2: Studio Import (2 minutes)**
```
1. 📁 ReplicatedStorage → Create "MMLNetwork" folder
2. 📄 Import all .lua files as ModuleScripts
3. 🏗️ Import .rbxm container models to Workspace
```

### **Step 3: Add Setup Script (3 minutes)**
```lua
-- ServerScriptService/MMLSetup.server.lua
local MML = require(game.ReplicatedStorage.MMLNetwork.MMLGameNetwork)

MML.Initialize({
    apiKey = "RBXG-your-api-key-here",  -- From Game Owner Portal
    enableAssetPreloading = true,
    enableFeedingEngine = true
})
```

### **Step 4: Test Integration (2 minutes)**
```
1. ▶️ Run game in Studio
2. 👀 Check console for "✅ MML Network initialized"
3. 📍 Verify containers are positioned correctly
4. 🔍 Enable debug: MML.EnableDebugMode()
```

### **Step 5: Go Live (5 minutes)**
```
1. 🚀 Publish game to Roblox
2. 📊 Monitor Game Owner Portal analytics
3. 🎯 Containers will automatically show ads when assigned
4. 💰 Revenue tracking begins immediately
```

---

## **🔧 Essential Code Snippets**

### **Basic Integration**
```lua
local MMLNetwork = require(game.ReplicatedStorage.MMLNetwork.MMLGameNetwork)

-- Initialize with minimal config
MMLNetwork.Initialize({
    apiKey = "RBXG-your-key"
})
```

### **Production Config**
```lua
-- Optimized for live games
MMLNetwork.Initialize({
    apiKey = "RBXG-your-key",
    enableAssetPreloading = true,
    enableFeedingEngine = true,
    updateInterval = 30,
    debugMode = false  -- Always false in production
})
```

### **Manual Controls**
```lua
-- Force display specific ad (testing)
MMLNetwork.DisplayAdInContainer("container-id", "ad-id")

-- Rotate to next ad
MMLNetwork.RotateContainerAd("container-id")

-- Record custom impression
MMLNetwork.RecordImpression("container-id", "interaction", {
    engagement = { score = 0.8 }
})
```

---

## **🏗️ Container Quick Setup**

### **Simple Display Billboard**
```lua
-- Minimal display container
local billboard = Instance.new("Part")
billboard.Size = Vector3.new(10, 5, 0.2)
billboard.Position = Vector3.new(0, 10, 0)
billboard.Anchored = true
billboard.Transparency = 1  -- Starts invisible

-- Add MML metadata
local metadata = Instance.new("Folder")
metadata.Name = "MMLMetadata"
metadata.Parent = billboard

local containerType = Instance.new("StringValue")
containerType.Name = "ContainerType"
containerType.Value = "DISPLAY"
containerType.Parent = metadata
```

### **NPC Spawn Point**
```lua
-- NPC container for character ads
local npcSpawn = Instance.new("Part")
npcSpawn.Size = Vector3.new(4, 7, 4)
npcSpawn.Position = Vector3.new(15, 3.5, 0)
npcSpawn.Anchored = true
npcSpawn.Transparency = 1

-- Metadata for NPC type
local metadata = Instance.new("Folder")
metadata.Name = "MMLMetadata"
metadata.Parent = npcSpawn

local containerType = Instance.new("StringValue")
containerType.Name = "ContainerType"
containerType.Value = "NPC"
containerType.Parent = metadata
```

---

## **🔍 Quick Debug**

### **Check System Status**
```lua
-- Verify everything is working
MMLNetwork.PrintSystemStatus()

-- Get detailed stats
local stats = MMLNetwork.GetSystemStats()
print("Containers:", stats.containers.total)
print("Assets Loaded:", stats.assetStorage.totalAssets)
```

### **Common Debug Commands**
```lua
-- Enable detailed logging
MMLNetwork.EnableDebugMode()

-- Force refresh data
MMLNetwork.RefreshGameAds()
MMLNetwork.RefreshContainerAssignments()

-- Manual testing
MMLNetwork.DisplayAdInContainer("test-container", "test-ad")
```

---

## **⚠️ Troubleshooting**

### **Containers Not Showing**
```
✅ Check: API key is correct
✅ Check: Containers have MMLMetadata
✅ Check: Game has active campaigns in portal
✅ Check: Initialize() returns true
```

### **Performance Issues**
```lua
-- Optimize for high-traffic servers
MMLNetwork.Initialize({
    apiKey = "your-key",
    maxPreloadedAds = 25,        -- Reduce if memory issues
    updateInterval = 60,         -- Less frequent updates
    maxConcurrentRequests = 2    -- Limit HTTP requests
})
```

### **Debug Console Messages**
```
✅ "MML Network initialized successfully" = Good
❌ "API key validation failed" = Check key
⚠️ "Container not found" = Check container setup
📦 "Pre-loaded X ads" = Assets loading correctly
```

---

## **🚀 Next Steps**

### **After Basic Setup:**
1. 📊 Monitor Game Owner Portal analytics
2. 🎯 Create more containers for better coverage
3. 🔧 Tune performance settings based on server size
4. 📈 Review revenue reports and optimize placement

### **Advanced Features:**
1. 🎮 Custom impression tracking
2. 🔄 Manual ad rotation control
3. 📱 Mobile-optimized containers
4. 🎯 Player demographic targeting

### **Support Resources:**
- 📖 Full documentation: `/docs/roblox-developer-guide.md`
- 🔧 Integration flow: `/docs/complete-integration-flow.md`
- 💬 Community Discord: [Link]
- 🎮 Example games: [Links to working examples]

---

**🎯 That's it! Your game now has intelligent, revenue-optimizing ad containers that automatically manage content, track performance, and maximize earnings while maintaining excellent player experience.**

**Need help?** Check the full documentation or join our developer community! 