# Game Owner's Guide to Ad Container Implementation

## Quick Start Guide 🚀

### Step 1: Create an Ad Container in Game Owner Portal
1. Log in to your Game Owner Portal
2. Navigate to "Ad Containers" → "Create New Container"
3. Fill in the container details:
   - Name (e.g., "Main Plaza Billboard")
   - Type (Display, NPC, or Minigame)
   - Position (X, Y, Z coordinates in your game)
   - Size (Width and Height for billboards)
4. Click "Create Container"
5. Save the Container ID provided - you'll need this for your game!

### Step 2: Add the Container to Your Game
1. Download the MML Network module from the portal
2. In Roblox Studio:
   - Add the module to `ReplicatedStorage`
   - Copy your Game API Key from the portal
   - Add this code to a Script in `ServerScriptService`:
   ```lua
   local MMLNetwork = require(game:GetService("ReplicatedStorage").MMLNetwork)
   
   -- Initialize with your API key
   MMLNetwork.Initialize({
       apiKey = "your_game_api_key"  -- Get this from the portal
   })
   ```

### Step 3: Place the Ad Container
1. In your game script, add:
   ```lua
   -- Create the ad container
   local displayAd = MMLNetwork.CreateDisplayAd({
       containerId = "your_container_id",  -- From Step 1
       position = Vector3.new(0, 5, 0)     -- Your desired position
   })
   ```
2. The system will automatically:
   - Create a placeholder billboard
   - Handle content updates
   - Track basic engagement

## What Happens Next? 🎮

### Automatic Updates
- Your container automatically checks for new ad content
- Updates happen smoothly without interrupting gameplay
- Default placeholder shows when no ad is assigned

### Player Interactions
- Views are tracked automatically
- Clicks/interactions are recorded
- All data is visible in your analytics dashboard

## Viewing Results 📊

### Real-time Analytics
1. Go to Game Owner Portal → "Analytics"
2. Select your container
3. View:
   - Total views
   - Player interactions
   - Engagement rates
   - Performance metrics

### Container Management
1. Visit "Container Management"
2. You can:
   - Pause/resume containers
   - Update positions
   - Change container types
   - View status and health

## Common Tasks

### 📌 Update Container Position
1. Portal: Edit container coordinates
2. OR in game script:
   ```lua
   displayAd:UpdatePosition(Vector3.new(x, y, z))
   ```

### 🎯 Change Container Type
1. Portal: Select container → "Edit" → Change type
2. Update game script to match new type

### ⏸️ Pause Container
1. Portal: Select container → "Pause"
2. Container will show placeholder until resumed

### 📊 View Performance
1. Portal: "Analytics" → Select container
2. Choose date range
3. Export reports if needed

## Troubleshooting Guide 🔧

### Container Not Showing
✅ Check:
1. API Key is correct
2. Container ID matches portal
3. MMLNetwork module is in ReplicatedStorage
4. Script has proper permissions

### Content Not Updating
✅ Verify:
1. Container is "Active" in portal
2. Game has internet connectivity
3. No script errors in output

### Missing Analytics
✅ Confirm:
1. API Key has analytics permission
2. Container is properly initialized
3. Game is published (not in Studio)

## Best Practices 💡

1. **Container Placement**
   - Place in high-traffic areas
   - Ensure good visibility
   - Don't obstruct gameplay

2. **Performance**
   - Limit containers per game
   - Use recommended update intervals
   - Clean up unused containers

3. **Testing**
   - Test in Studio first
   - Verify with multiple players
   - Check different device types

## Need Help? 🆘

- Visit our documentation at [docs.mmlnetwork.com]
- Contact support: support@mmlnetwork.com
- Join our Discord community: [discord.gg/mmlnetwork]

## Quick Reference 📝

### Container Types
- **Display**: Static billboards
- **NPC**: Interactive characters
- **Minigame**: Interactive games

### Status Types
- **Active**: Serving ads
- **Paused**: Showing placeholder
- **Maintenance**: Under update

### Key Commands
```lua
-- Create container
local ad = MMLNetwork.CreateDisplayAd(config)

-- Update position
ad:UpdatePosition(newPosition)

-- Pause container
ad:SetEnabled(false)

-- Resume container
ad:SetEnabled(true)
```

Remember: Always test in Studio before publishing to live games! 