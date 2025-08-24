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
    -- Count containers properly
    local containerCount = 0
    if _G.MMLNetwork and _G.MMLNetwork._containers then
        for _ in pairs(_G.MMLNetwork._containers) do
            containerCount = containerCount + 1
        end
    end
    print("📊 Found containers:", containerCount)
    
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
              <CardTitle>Step 1: Download MML Network Integration Package</CardTitle>
              <CardDescription>
                Choose your integration method - Individual game package (recommended) or custom package for multiple games
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Individual Game Package */}
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">🎮 Individual Game Package (Recommended)</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Download a package specifically configured for one of your games
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-blue-600">
                      ✅ Pre-configured with your game's API key<br/>
                      ✅ Includes container creation scripts<br/>
                      ✅ Smart positioning system<br/>
                      ✅ No manual configuration needed
                    </p>
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Select Game Below
                    </Button>
                  </div>
                </div>

                {/* Custom Package */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">📦 Custom Package (Multiple Games)</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Download a package that includes all your games and containers
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      ⚡ All games in one package<br/>
                      ⚡ All containers included<br/>
                      ⚠️ Requires manual positioning<br/>
                      ⚠️ May create duplicates
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/api/game-owner/download/custom-package" download>
                        <Download className="h-4 w-4 mr-2" />
                        Download Custom Package
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">📥 Modern Installation Steps (2024):</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
                  <li>Download your game-specific <code>.rbxm</code> file above</li>
                  <li>Open your game in Roblox Studio</li>
                  <li>Right-click in the Explorer window → <strong>"Insert from File..."</strong></li>
                  <li>Select the downloaded <code>MMLNetwork_[YourGame].rbxm</code> file</li>
                  <li>A temporary folder (e.g., <code>MML_Network_[GameName]</code>) will appear in Explorer</li>
                  <li><strong>🔄 Move Files to Correct Locations:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li><strong>Drag</strong> <code>MMLGameNetwork</code> from temp folder → <code>ReplicatedStorage</code></li>
                      <li><strong>Drag</strong> <code>MMLNetworkIntegration</code> from temp folder → <code>ServerScriptService</code></li>
                      <li><strong>Drag</strong> <code>CreateContainers</code> from temp folder → <code>ServerScriptService</code></li>
                    </ul>
                  </li>
                  <li><strong>🗑️ Delete</strong> the temporary folder after moving all files</li>
                  <li><strong>✅ No manual configuration needed!</strong> The API key is pre-configured</li>
                  <li>Test by pressing ▶️ Play - check output for "✅ MML Network initialized successfully!"</li>
                </ol>
              </div>

              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">⚠️ CRITICAL: File Movement Required!</h4>
                <p className="text-sm text-red-800 mb-2">
                  The .rbxm import creates a temporary folder structure. You <strong>MUST</strong> move the files to the correct Roblox services or the integration will not work.
                </p>
                <div className="text-xs text-red-700 bg-red-100 p-2 rounded">
                  <strong>❌ Common Mistake:</strong> Leaving files in the temporary folder<br/>
                  <strong>✅ Correct:</strong> Moving files to ReplicatedStorage and ServerScriptService
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Pro Tip:</strong> Each game gets its own package to prevent configuration conflicts and ensure proper setup.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Ready to Test! 🚀</CardTitle>
              <CardDescription>
                The modern integration package is pre-configured and ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>No Manual Configuration Required!</AlertTitle>
                <AlertDescription>
                  The individual game packages come pre-configured with your API keys and container scripts. Just import and test!
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">🔑 Your Game API Key (Reference):</h4>
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

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">✅ What's Already Configured:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                    <li>API key is pre-configured in the integration script</li>
                    <li>Container creation scripts include your containers</li>
                    <li>Smart positioning system is enabled</li>
                    <li>Automatic initialization on game start</li>
                    <li>All MML Network modules properly linked</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">🔍 Verify Installation:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Press ▶️ <strong>Play</strong> in Roblox Studio</li>
                    <li>Check the <strong>Output</strong> window for:</li>
                    <li className="ml-4">✅ "MML Network initialized successfully!"</li>
                    <li className="ml-4">📊 "Found containers: [number]"</li>
                    <li className="ml-4">🔄 "Container monitoring started"</li>
                    <li>Look for container objects in your workspace with blue highlights</li>
                  </ol>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">📋 Integration Script (Auto-Generated):</h4>
                <p className="text-sm text-gray-600 mb-2">
                  This script is automatically generated and included in your download package:
                </p>
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
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">🆕 Individual Container Download (Recommended)</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Download plug-and-play .rbxm files for specific containers. Smart positioning and zero configuration!
                    </p>
                    <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
                      <li>Create container in Game Owner Portal</li>
                      <li>Click "Download Container" button next to each container</li>
                      <li>Import <code>MMLContainer_[Name].rbxm</code> into Roblox Studio</li>
                      <li>The container will auto-position relative to spawn points</li>
                      <li>Move container if needed - position syncs automatically!</li>
                      <li>Container becomes active immediately when ads are assigned</li>
                    </ol>
                    <div className="mt-3 p-2 bg-blue-100 rounded">
                      <p className="text-xs text-blue-800">
                        <strong>✨ Features:</strong> Smart spawn detection, duplicate prevention, auto-positioning, type-specific setup
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-2">📦 Game Package (Complete Setup)</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Download complete game integration with all containers included in one package.
                    </p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>• All containers for a specific game</p>
                      <p>• Pre-configured integration scripts</p>
                      <p>• Bulk container creation</p>
                      <p>• May require manual positioning adjustments</p>
                    </div>
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
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">🚀 Modern Container Setup (2024):</h4>
                  <p className="text-sm text-green-800 mb-3">Individual container downloads with plug-and-play installation:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong className="text-green-900">🎯 Recommended: Individual Downloads</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-green-700">
                        <li>Download each container's .rbxm file</li>
                        <li>Import directly into Studio</li>
                        <li>Auto-positioning and setup</li>
                        <li>Zero manual configuration</li>
                        <li>Smart spawn point detection</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-gray-700">📦 Alternative: Game Package</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                        <li>Complete integration package</li>
                        <li>All containers in one download</li>
                        <li>Bulk creation scripts</li>
                        <li>Manual positioning may be needed</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-green-100 rounded">
                    <p className="text-xs text-green-800">
                      <strong>💡 Tip:</strong> Use individual downloads for precise control and to avoid duplicates. Use game packages for quick setup of multiple containers.
                    </p>
                  </div>
                </div>

                {containers.map((container, index) => (
                  <Card key={container.id} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {container.name}
                            <Badge variant="secondary">{container.type}</Badge>
                          </CardTitle>
                          <CardDescription>
                            ID: {container.id} | Initial Position: ({container.position.x}, {container.position.y}, {container.position.z})
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Container {index + 1}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Recommended Download Method */}
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">🎯 Recommended: Individual Download</h4>
                          <p className="text-sm text-blue-700 mb-3">
                            Download this container as a plug-and-play .rbxm file
                          </p>
                          <div className="space-y-2">
                            <Button asChild className="w-full" size="sm">
                              <Link href={`/api/game-owner/download/container/${container.id}`} download>
                                <Download className="h-4 w-4 mr-2" />
                                Download MMLContainer_{container.name.replace(/[^a-zA-Z0-9]/g, '_')}.rbxm
                              </Link>
                            </Button>
                            <div className="text-xs text-blue-600 space-y-1">
                              <p>✅ Includes smart positioning relative to spawn points</p>
                              <p>✅ Auto-configures container type and metadata</p>
                              <p>✅ Prevents duplicates and conflicts</p>
                              <p>✅ Ready to use immediately after import</p>
                            </div>
                          </div>
                        </div>

                        {/* Container Info */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">📋 Container Information:</p>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p><strong>Container ID:</strong> <code className="bg-white px-1 rounded">{container.id}</code></p>
                            <p><strong>Type:</strong> {container.type}</p>
                            <p><strong>Smart Features:</strong> Auto-positioning, spawn detection, type-specific setup</p>
                          </div>
                        </div>

                        {/* Alternative Manual Method */}
                        <details className="border rounded-lg">
                          <summary className="p-3 cursor-pointer font-medium text-sm text-gray-700 hover:bg-gray-50">
                            📝 Alternative: Manual Creation Code (Advanced)
                          </summary>
                          <div className="p-3 border-t bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Legacy creation code:</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyCode(getContainerCreationCode(container), `Container Code ${index + 1}`)}
                              >
                                {copiedCode === `Container Code ${index + 1}` ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-48">
                              {getContainerCreationCode(container)}
                            </pre>
                            <p className="text-xs text-gray-500 mt-2">
                              ⚠️ Manual creation requires precise positioning and may cause conflicts if run multiple times.
                            </p>
                          </div>
                        </details>

                        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                          <strong>💡 Pro Tips:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Individual downloads automatically position containers near spawn points</li>
                            <li>You can move containers after import - positions sync to the database</li>
                            <li>Containers are invisible until they have ad content assigned</li>
                            <li>Use the Admin Panel to assign ads to your containers for testing</li>
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
              <CardTitle>🧠 Smart Positioning System (2024)</CardTitle>
              <CardDescription>
                Advanced auto-positioning with spawn detection and intelligent placement algorithms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">🚀 How Smart Positioning Works:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
                  <li><strong>Spawn Detection:</strong> Automatically finds SpawnLocation and Spawn parts in your game</li>
                  <li><strong>Intelligent Placement:</strong> Positions containers relative to spawn points based on type:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li><strong>DISPLAY:</strong> 15 studs in front of spawn, 5 studs up (visible to players)</li>
                      <li><strong>NPC:</strong> 8 studs to the side, ground level (for interaction)</li>
                      <li><strong>MINIGAME:</strong> 20 studs away, 10 studs to side (separate area)</li>
                    </ul>
                  </li>
                  <li><strong>Fallback Positioning:</strong> Uses configured coordinates if no spawn points found</li>
                  <li><strong>Real-time Sync:</strong> Moving containers updates the database automatically</li>
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
              <CardTitle>🧪 Testing Your Modern Integration (2024)</CardTitle>
              <CardDescription>
                Verify your plug-and-play containers are working correctly with smart positioning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">🚀 Quick Testing Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Import your <strong>game package .rbxm</strong> or individual container files</li>
                    <li>Press <strong>▶️ Play</strong> in Roblox Studio</li>
                    <li>Check <strong>Output</strong> window for success messages</li>
                    <li>Look for containers with <strong>blue highlights</strong> in workspace</li>
                    <li>Verify containers are near your spawn points (smart positioning)</li>
                    <li>Containers should show <code>"MML Ad Loading..."</code> placeholder</li>
                  </ol>

                  <Alert>
                    <Play className="h-4 w-4" />
                    <AlertTitle>Expected Output (Auto-Configured)</AlertTitle>
                    <AlertDescription className="mt-2">
                      <code className="text-xs block bg-green-100 p-2 rounded mt-1 text-green-900">
                        🎮 MML Network: Starting initialization...<br/>
                        📍 Found spawn 'SpawnLocation' at: 0, 4, 0<br/>
                        📺 Positioning DISPLAY container in front of spawn<br/>
                        🎯 Smart position: 15, 9, 0<br/>
                        ✅ MML Network initialized successfully!<br/>
                        📊 Found containers: {containers.length}<br/>
                        🔄 Container monitoring started<br/>
                        📱 Your ad containers are now active!
                      </code>
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">✅ Modern Setup Checklist (2024):</h4>
                  <div className="space-y-2">
                    {[
                      '✅ Downloaded and imported game package .rbxm file',
                      '✅ MMLGameNetwork module auto-placed in ReplicatedStorage', 
                      '✅ Integration scripts auto-placed in ServerScriptService',
                      '✅ Container objects created with smart positioning',
                      '✅ Studio testing shows successful initialization',
                      '✅ Smart positioning messages in Output window',
                      '✅ Containers positioned correctly relative to spawn',
                      '✅ No error messages - all green success messages'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" disabled checked />
                        <span className="text-sm text-green-700">{item}</span>
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

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">🎉 What Happens After Publishing (Automatic):</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  <li><strong>Smart Container Activation:</strong> Containers automatically start serving ads when assigned</li>
                  <li><strong>Intelligent Updates:</strong> Content refreshes every 30 seconds with smart caching</li>
                  <li><strong>Auto Analytics:</strong> Player interactions tracked automatically (no code needed)</li>
                  <li><strong>Graceful Fallback:</strong> Containers remain invisible when no ads available</li>
                  <li><strong>Real-time Monitoring:</strong> Live data available in Game Owner Portal</li>
                  <li><strong>Position Sync:</strong> Moving containers in Studio updates database in real-time</li>
                  <li><strong>Performance Optimized:</strong> Minimal HTTP requests with intelligent batching</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">💰 Monetization Ready:</h4>
                <p className="text-sm text-yellow-800">
                  Your containers are now ready to display ads from brand users on the platform. Revenue tracking and analytics begin immediately when ads are assigned through the Game Advertising Portal (GAP).
                </p>
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