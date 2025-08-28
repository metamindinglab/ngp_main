import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
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

export async function POST(request: NextRequest) {
  try {
    // Require authenticated game owner
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

    const outDir = join(process.cwd(), 'public', 'downloads', 'containers')
    await mkdir(outDir, { recursive: true })

    const results: Record<string, string> = {}
    for (const type of ['DISPLAY', 'NPC', 'MINIGAME'] as const) {
      const data = await buildPrebuiltContainer(type)
      const filename = `MMLContainer_${type}.rbxmx`
      await writeFile(join(outDir, filename), data)
      results[type] = `/downloads/containers/${filename}`
    }

    return NextResponse.json({ success: true, urls: results })
  } catch (error) {
    console.error('Error generating static prebuilt containers:', error)
    return NextResponse.json({ error: 'Failed to generate prebuilt containers' }, { status: 500 })
  }
}

async function buildPrebuiltContainer(type: 'DISPLAY' | 'NPC' | 'MINIGAME') {
  const tempDir = join(process.cwd(), 'temp', `prebuilt-${type.toLowerCase()}-${Date.now()}`)
  await execAsync(`rm -rf "${tempDir}" && mkdir -p "${tempDir}"`)

  const runtimeLua = makeRuntimeLua(type)
  await writeFile(join(tempDir, 'MMLContainerRuntime.server.lua'), runtimeLua)

  const modelName = `MMLContainer_${type}`
  const rojoProject: any = {
    name: modelName,
    tree: {
      $className: 'Model',
      Name: modelName,
      MMLMetadata: {
        $className: 'Folder',
        ContainerId: { $className: 'StringValue', Value: '' },
        GameId: { $className: 'StringValue', Value: '' },
        Type: { $className: 'StringValue', Value: type },
        EnablePositionSync: { $className: 'BoolValue', Value: true },
      },
      Stage: {
        $className: 'Part',
        Anchored: true,
        CanCollide: false,
        Size: type === 'DISPLAY' ? [10, 5, 0.5] : type === 'NPC' ? [4, 4, 4] : [12, 8, 12],
        Material: 'SmoothPlastic',
        BrickColor: 'Medium stone grey',
        ...(type === 'DISPLAY'
          ? {
              MMLDisplaySurface: {
                $className: 'SurfaceGui',
                Frame: {
                  $className: 'Frame',
                  AdImage: { $className: 'ImageLabel' },
                  AdVideo: { $className: 'VideoFrame' },
                },
              },
            }
          : {}),
      },
      MMLContainerRuntime: { $className: 'Script', $path: 'MMLContainerRuntime.server.lua' },
    },
  }

  const projectPath = join(tempDir, 'default.project.json')
  await writeFile(projectPath, JSON.stringify(rojoProject, null, 2))
  await execAsync(`cd "${tempDir}" && rojo build --output prebuilt.rbxmx`)
  const data = await (await import('fs/promises')).readFile(join(tempDir, 'prebuilt.rbxmx'))
  return data
}

function makeRuntimeLua(type: 'DISPLAY' | 'NPC' | 'MINIGAME') {
  const ensureDisplay = `
local function ensureDisplaySurface(model)
    local part = model:FindFirstChild("Stage")
    if not part or not part:IsA("BasePart") then return end
    local surfaceGui = part:FindFirstChild("MMLDisplaySurface")
    if not surfaceGui then return end
    local frame = surfaceGui:FindFirstChild("Frame")
    if not frame then return end
    -- Default visibility
    local img = frame:FindFirstChild("AdImage")
    local vid = frame:FindFirstChild("AdVideo")
    if img then img.Visible = true end
    if vid then vid.Visible = false; vid.Playing = false end
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
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local model = script.Parent
${type === 'DISPLAY' ? 'ensureDisplaySurface(model)' : 'makeStageInvisible(model)'}
spawn(function()
    wait(2)
    local ok, M = pcall(function() return require(ReplicatedStorage:WaitForChild("MMLGameNetwork")) end)
    if ok and M and M.RefreshContainerAssignments then pcall(function() M.RefreshContainerAssignments() end) end
end)
`

  return `-- MML Static Container Runtime (${type})
${type === 'DISPLAY' ? ensureDisplay : invisibleStage}
${body}
`
}


