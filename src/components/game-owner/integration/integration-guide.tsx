'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle, AlertCircle, Download, ExternalLink, Play, Settings, Monitor, Info, Box } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

interface IntegrationGuideProps {
  gameApiKey?: string
  containers?: Array<{
    id: string
    name: string
    type: string
    position: { x: number; y: number; z: number }
  }>
}

export function IntegrationGuide({ gameApiKey, containers = [] }: IntegrationGuideProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCopyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(label)
    setTimeout(() => setCopiedCode(null), 2000)
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    })
  }

  const serverScriptCode = `--[[
    MML Network Integration Script
    This script automatically initializes the MML Network system
    Place this in ServerScriptService
--]]

-- Wait for game to be loaded
game.Loaded:Wait()

-- Get the MML Network module
local MMLNetwork = require(game:GetService("ReplicatedStorage"):WaitForChild("MMLGameNetwork"))

-- ⚠️ IMPORTANT: Replace with your actual API key
local gameAPIKey = "${gameApiKey || 'RBXG-REPLACE-WITH-YOUR-ACTUAL-API-KEY'}"

-- Configuration
local config = {
    -- How often to check for new ads (in seconds)
    updateInterval = 30,
    
    -- Enable debug logging
    debugMode = false,
    
    -- Auto-start monitoring when initialized
    autoStart = true
}

print("🎮 MML Network: Starting initialization...")

-- Initialize the MML Network
local success, result = MMLNetwork.initialize(gameAPIKey, config)

if success then
    print("✅ MML Network initialized successfully!")
    print("📊 Found containers:", result.containerCount or 0)
    
    if config.autoStart then
        -- Start monitoring all containers
        local monitorSuccess = MMLNetwork.startContainerMonitoring()
        if monitorSuccess then
            print("🔄 MML Network: Container monitoring started")
            print("📱 Your ad containers are now active!")
        else
            warn("❌ MML Network: Failed to start container monitoring")
        end
    end
    
else
    warn("❌ MML Network initialization failed:", result)
    warn("🔧 Please check:")
    warn("   1. Your API key is correct (should start with 'RBXG-')")
    warn("   2. Your game is registered in the Game Owner Portal")
    warn("   3. You have created ad containers for this game")
    warn("   4. Your internet connection is working")
end

-- Handle game shutdown gracefully
game:BindToClose(function()
    print("🛑 MML Network: Game shutting down, cleaning up...")
    MMLNetwork.cleanup()
end)`

  const getContainerCreationCode = (container: { id: string; name: string; type: string; position: { x: number; y: number; z: number } }) => {
    return `-- Create physical container for: ${container.name}
-- Place this code where you want to create the container object

local ${container.name.replace(/[^a-zA-Z0-9]/g, '_')} = Instance.new("Part")
${container.name.replace(/[^a-zA-Z0-9]/g, '_')}.Name = "${container.id}"
${container.name.replace(/[^a-zA-Z0-9]/g, '_')}.Size = Vector3.new(${container.type === 'DISPLAY' ? '10, 5, 0.5' : container.type === 'NPC' ? '2, 6, 2' : '8, 8, 8'})
${container.name.replace(/[^a-zA-Z0-9]/g, '_')}.Position = Vector3.new(${container.position.x}, ${container.position.y}, ${container.position.z})
${container.name.replace(/[^a-zA-Z0-9]/g, '_')}.Anchored = true
${container.name.replace(/[^a-zA-Z0-9]/g, '_')}.Material = Enum.Material.Neon
${container.name.replace(/[^a-zA-Z0-9]/g, '_')}.BrickColor = BrickColor.new("Bright blue")
${container.name.replace(/[^a-zA-Z0-9]/g, '_')}.Parent = workspace

-- Add a SurfaceGui for display ads
${container.type === 'DISPLAY' ? `local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.Parent = ${container.name.replace(/[^a-zA-Z0-9]/g, '_')}

local frame = Instance.new("Frame")
frame.Size = UDim2.new(1, 0, 1, 0)
frame.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
frame.Parent = surfaceGui

local textLabel = Instance.new("TextLabel")
textLabel.Size = UDim2.new(1, 0, 1, 0)
textLabel.BackgroundTransparency = 1
textLabel.Text = "MML Ad Loading..."
textLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
textLabel.TextScaled = true
textLabel.Parent = frame` : '-- Container ready for MML Network to populate with content'}

print("📦 Container ${container.name} created at position:", ${container.name.replace(/[^a-zA-Z0-9]/g, '_')}.Position)`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            MML Network Integration Guide
          </CardTitle>
          <CardDescription>
            Follow these steps to integrate MML Network into your Roblox game and start displaying ads.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="positioning">Positioning</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📋 Integration Overview</CardTitle>
              <CardDescription>
                What you'll accomplish by following this guide
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">✅ What You'll Set Up:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>MML Network module in ReplicatedStorage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Auto-initialization script in ServerScriptService</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Physical ad container objects in your game world</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Automatic ad content loading and updates</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">🎯 What Players Will See:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Monitor className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Dynamic ads that change automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Monitor className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Smooth, non-intrusive ad experiences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Monitor className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Engaging interactive content (when applicable)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Monitor className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Fallback content when no ads are available</span>
                    </li>
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Prerequisites</AlertTitle>
                <AlertDescription className="mt-2">
                  Before starting, make sure you have:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Created at least one ad container in this portal</li>
                    <li>Generated an API key for your game</li>
                    <li>Basic familiarity with Roblox Studio</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">📱 Works in Published Games</Badge>
                <Badge variant="outline">🔧 Studio Testing Supported</Badge>
                <Badge variant="outline">⚡ Real-time Updates</Badge>
                <Badge variant="outline">📊 Analytics Included</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Download and Import MML Network Module</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button asChild>
                    <Link href="/api/game-owner/download/custom-package" download>
                      <Download className="h-4 w-4 mr-2" />
                      Download Custom Package (Recommended)
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/api/download/roblox-module" download>
                      <Download className="h-4 w-4 mr-2" />
                      Download Generic Package
                    </Link>
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Custom Package:</strong> Pre-configured with YOUR API keys and container creation scripts</p>
                  <p><strong>Generic Package:</strong> Requires manual configuration of API keys and container creation</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/docs/integration-video" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch Video Tutorial
                  </Link>
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">📥 Installation Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Download the <code>MMLNetworkComplete.rbxm</code> file above</li>
                  <li>Open your game in Roblox Studio</li>
                  <li>Right-click in the Explorer window → "Insert from File..."</li>
                  <li>Select the downloaded <code>.rbxm</code> file</li>
                  <li>A folder called "MMLNetworkComplete" will appear</li>
                  <li><strong>Drag</strong> <code>MMLNetworkComplete/ReplicatedStorage/MMLGameNetwork</code> to your <code>ReplicatedStorage</code></li>
                  <li><strong>Drag</strong> <code>MMLNetworkComplete/ServerScriptService/MMLNetworkIntegration</code> to your <code>ServerScriptService</code></li>
                  <li><strong>Delete</strong> the temporary <code>MMLNetworkComplete</code> folder</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Configure Your API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important: Update Your API Key</AlertTitle>
                <AlertDescription>
                  The integration script needs your game's API key to connect to MML Network.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">🔑 Your Game API Key:</h4>
                  {gameApiKey ? (
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">{gameApiKey}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCode(gameApiKey, 'API Key')}
                      >
                        {copiedCode === 'API Key' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No API key found. Please generate one in the Games tab first.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">📝 Update the Integration Script:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Double-click <code>ServerScriptService/MMLNetworkIntegration</code> in Studio</li>
                    <li>Find the line: <code>local gameAPIKey = "RBXG-REPLACE-WITH-YOUR-ACTUAL-API-KEY"</code></li>
                    <li>Replace the placeholder with your actual API key above</li>
                    <li>Save the script (Ctrl+S)</li>
                  </ol>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">📋 Complete Script Preview:</h4>
                <div className="relative">
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-64">
                    {serverScriptCode}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyCode(serverScriptCode, 'Integration Script')}
                  >
                    {copiedCode === 'Integration Script' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="containers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Container Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Box className="h-5 w-5 mr-2" />
                  Container Management
                </CardTitle>
                <CardDescription>
                  Two approaches for adding containers to your game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">🆕 Individual Container Download (Recommended)</h4>
                    <p className="text-sm text-blue-700">
                      Download a specific .rbxm file for each container. No duplicates, easy positioning!
                    </p>
                    <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
                      <li>Create container in Game Owner Portal</li>
                      <li>Click "Download Container" button</li>
                      <li>Import .rbxm file into Roblox Studio</li>
                      <li>Move the container object to desired position</li>
                      <li>Position automatically syncs to database!</li>
                    </ol>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">📦 Bulk Download (Legacy)</h4>
                    <p className="text-sm text-gray-600">
                      Download all containers at once. May cause duplicates if run multiple times.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {containers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Containers Found</AlertTitle>
                <AlertDescription>
                  You haven't created any ad containers yet. Go to the "Ad Containers" tab to create your first container.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🏗️ Container Creation Options:</h4>
                  <p className="text-sm mb-3">You can create containers using either method:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Option A: Manual Creation</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Use the provided Lua code</li>
                        <li>Customize appearance as needed</li>
                        <li>Full control over design</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Option B: Studio Insertion</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Create Parts manually in Studio</li>
                        <li>Name them with the Container ID</li>
                        <li>Position as specified</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {containers.map((container, index) => (
                  <Card key={container.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{container.name}</CardTitle>
                          <CardDescription>
                            Type: {container.type} | Position: ({container.position.x}, {container.position.y}, {container.position.z})
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Container {index + 1}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-sm font-medium">📋 Container ID (Important!):</p>
                          <code className="text-sm bg-white px-2 py-1 rounded mt-1 inline-block">{container.id}</code>
                          <p className="text-xs text-gray-600 mt-1">
                            The physical object must be named exactly this ID for MML Network to find it.
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">🔧 Creation Code:</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyCode(getContainerCreationCode(container), `Container Code ${index + 1}`)}
                            >
                              {copiedCode === `Container Code ${index + 1}` ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                            {getContainerCreationCode(container)}
                          </pre>
                        </div>

                        <div className="text-sm text-gray-600">
                          <strong>💡 Tips:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>You can customize the appearance (color, material, etc.) but keep the Name and Position</li>
                            <li>Make sure the container is visible and accessible to players</li>
                            <li>Test different positions to find the best placement for your game</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="positioning">
          <Card>
            <CardHeader>
              <CardTitle>🎯 Automatic Position Synchronization</CardTitle>
              <CardDescription>
                The MML Network automatically syncs container positions between your game and the portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">How Position Sync Works:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li><strong>Automatic Detection:</strong> When you place containers in your game, their positions are automatically detected</li>
                  <li><strong>Real-time Updates:</strong> Moving containers in Studio automatically updates the database</li>
                  <li><strong>Portal Synchronization:</strong> The Game Owner Portal shows live position data from your game</li>
                  <li><strong>Smart Throttling:</strong> Position updates are throttled to prevent spam (5-second cooldown)</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">✅ What's Tracked</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>X, Y, Z coordinates</li>
                    <li>Position changes in Studio</li>
                    <li>Container placement updates</li>
                    <li>Real-time location data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">⚙️ Configuration</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Enabled by default</li>
                    <li>5-second minimum update interval</li>
                    <li>0.1 stud movement threshold</li>
                    <li>Can be disabled if needed</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Position Display in Portal</AlertTitle>
                <AlertDescription>
                  Container positions in the "Ad Containers" tab are now marked as "Auto-detected" and will update automatically when you move containers in Studio. You no longer need to manually enter coordinates!
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Manual Position Sync (Advanced)</h4>
                <p className="text-sm mb-3">If you need to manually trigger position synchronization:</p>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`-- Sync a specific container
MMLNetwork.SyncContainerPosition("container_id_here")

-- Sync all containers at once  
MMLNetwork.SyncAllPositions()

-- Disable auto-sync (in config)
enablePositionSync = false`}
                </pre>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">💡 Pro Tips:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Test Mode:</strong> Position sync works in Studio test mode for real-time feedback</li>
                  <li><strong>Batch Changes:</strong> Multiple rapid position changes are automatically batched</li>
                  <li><strong>Monitoring:</strong> Check the Output window for position sync confirmation messages</li>
                  <li><strong>Performance:</strong> Position sync has minimal impact on game performance</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Test Your Integration</CardTitle>
              <CardDescription>
                Verify that everything is working correctly before publishing your game.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">🧪 Studio Testing:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click the <strong>Play</strong> button in Roblox Studio</li>
                    <li>Check the <strong>Output</strong> window for MML Network messages</li>
                    <li>Look for: <code>"✅ MML Network initialized successfully!"</code></li>
                    <li>Verify your containers appear in the game world</li>
                    <li>Check that placeholders show "MML Ad Loading..." initially</li>
                  </ol>

                  <Alert>
                    <Play className="h-4 w-4" />
                    <AlertTitle>Expected Console Output</AlertTitle>
                    <AlertDescription className="mt-2">
                      <code className="text-xs block bg-gray-100 p-2 rounded mt-1">
                        🎮 MML Network: Starting initialization...<br/>
                        ✅ MML Network initialized successfully!<br/>
                        📊 Found containers: {containers.length}<br/>
                        🔄 MML Network: Container monitoring started<br/>
                        📱 Your ad containers are now active!
                      </code>
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">🚀 Publishing Checklist:</h4>
                  <div className="space-y-2">
                    {[
                      'MMLGameNetwork module is in ReplicatedStorage',
                      'Integration script is in ServerScriptService',
                      'API key is correctly configured',
                      'All container objects are created and named properly',
                      'Studio testing shows successful initialization',
                      'No error messages in the Output window'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Ready to Publish!</AlertTitle>
                    <AlertDescription>
                      Once all items are checked, you can publish your game. The MML Network will automatically start serving ads to your containers.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">🎉 What Happens After Publishing:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Automatic Ad Loading:</strong> Your containers will start receiving and displaying ads</li>
                  <li><strong>Real-time Updates:</strong> Content updates every 30 seconds (configurable)</li>
                  <li><strong>Analytics Tracking:</strong> All player interactions are automatically recorded</li>
                  <li><strong>Fallback Content:</strong> Default content shows when no ads are available</li>
                  <li><strong>Performance Monitoring:</strong> View real-time data in your Game Owner Portal</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button asChild>
                  <Link href="/game-owner" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    View Analytics Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/docs/troubleshooting" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Troubleshooting Guide
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 