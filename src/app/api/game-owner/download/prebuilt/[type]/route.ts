import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const execAsync = promisify(exec)

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    // Authenticate the game owner (reuse session token)
    const authHeader = request.headers.get('Authorization')
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let userId: string
    try {
      const decoded = verify(sessionToken, JWT_SECRET) as { userId: string }
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    const user = await prisma.gameOwner.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const containerType = String(params.type || '').toUpperCase()
    if (!['DISPLAY', 'NPC', 'MINIGAME'].includes(containerType)) {
      return NextResponse.json({ error: 'Invalid container type' }, { status: 400 })
    }

    const data = await buildPrebuiltContainer(containerType)
    const filename = `MMLContainer_${containerType}.rbxmx`
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error generating prebuilt container:', error)
    return NextResponse.json({ error: 'Failed to generate prebuilt container' }, { status: 500 })
  }
}

async function buildPrebuiltContainer(type: 'DISPLAY' | 'NPC' | 'MINIGAME') {
  const tempDir = join(process.cwd(), 'temp', `prebuilt-${type.toLowerCase()}-${Date.now()}`)
  await execAsync(`rm -rf "${tempDir}" && mkdir -p "${tempDir}"`)

  // Runtime script embedded in the model to ensure surfaces/stage behavior
  const runtimeLua = makeRuntimeLua(type)
  await writeFile(join(tempDir, 'MMLContainerRuntime.server.lua'), runtimeLua)

  // Create a minimal Rojo project that builds a Model with metadata and a stage Part
  const modelName = `MMLContainer_${type}`

  const rojoProject = {
    name: modelName,
    tree: {
      "$className": "Model",
      "Name": modelName,
      "MMLMetadata": {
        "$className": "Folder",
        "ContainerId": { "$className": "StringValue", "Value": "" },
        "GameId": { "$className": "StringValue", "Value": "" },
        "Type": { "$className": "StringValue", "Value": type },
        "EnablePositionSync": { "$className": "BoolValue", "Value": true }
      },
      "Stage": {
        "$className": "Part",
        "Anchored": true,
        "CanCollide": false,
        "Size": type === 'DISPLAY' ? [10, 5, 0.5] : type === 'NPC' ? [4, 4, 4] : [12, 8, 12],
        "Material": "SmoothPlastic",
        "BrickColor": "Medium stone grey"
      },
      "MMLContainerRuntime": { "$className": "Script", "$path": "MMLContainerRuntime.server.lua" }
    }
  } as any

  // Write project
  const projectPath = join(tempDir, 'default.project.json')
  await writeFile(projectPath, JSON.stringify(rojoProject, null, 2))

  // Build rbxmx
  await execAsync(`cd "${tempDir}" && rojo build --output prebuilt.rbxmx`)
  const data = await readFile(join(tempDir, 'prebuilt.rbxmx'))
  return data
}

function makeRuntimeLua(type: 'DISPLAY' | 'NPC' | 'MINIGAME') {
  const ensureDisplay = `
local function ensureDisplaySurface(model)
    local part = model:FindFirstChild("Stage")
    if not part or not part:IsA("BasePart") then return end
    local surfaceGui = part:FindFirstChild("MMLDisplaySurface")
    if not surfaceGui then
        surfaceGui = Instance.new("SurfaceGui")
        surfaceGui.Name = "MMLDisplaySurface"
        surfaceGui.Face = Enum.NormalId.Front
        surfaceGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
        surfaceGui.CanvasSize = Vector2.new(1024, 576)
        surfaceGui.AlwaysOnTop = true
        surfaceGui.Parent = part
    end
    local frame = surfaceGui:FindFirstChild("Frame")
    if not frame then
        frame = Instance.new("Frame")
        frame.Name = "Frame"
        frame.Size = UDim2.new(1, 0, 1, 0)
        frame.BackgroundTransparency = 1
        frame.Parent = surfaceGui
    end
end`

  const invisibleStage = `
local function makeStageInvisible(model)
    local part = model:FindFirstChild("Stage")
    if part and part:IsA("BasePart") then
        part.Transparency = 1
        part.CanCollide = false
    end
end`

  const body = `
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local model = script.Parent
local metadata = model:FindFirstChild("MMLMetadata")
if not metadata then return end

-- Ensure correct shape
${type === 'DISPLAY' ? 'ensureDisplaySurface(model)' : 'makeStageInvisible(model)'}

-- Attempt to load network modules (no hard fails)
local ok, MMLGameNetwork = pcall(function()
    return require(ReplicatedStorage:WaitForChild("MMLGameNetwork"))
end)
if ok and MMLGameNetwork and MMLGameNetwork.RefreshContainerAssignments then
    -- Let the network know a container is present; no-op if not initialized yet
    spawn(function()
        wait(2)
        pcall(function() MMLGameNetwork.RefreshContainerAssignments() end)
    end)
end
`

  return `-- MML Container Runtime (${type})
${type === 'DISPLAY' ? ensureDisplay : invisibleStage}
${body}
`
}


