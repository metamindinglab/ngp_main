import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function escapeXml(value: string) {
  return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    const containerId = request.nextUrl.searchParams.get('containerId')
    const preset = (request.nextUrl.searchParams.get('preset') || 'portrait').toLowerCase()
    const mount = (request.nextUrl.searchParams.get('mount') || 'ground').toLowerCase() // 'ground' | 'wall'
    const apiKey = request.headers.get('X-API-Key')
    if (!containerId) return NextResponse.json({ error: 'Missing containerId' }, { status: 400 })

    let gameIdFromToken: string | null = null
    if (token) {
      const { verifyToken } = await import('@/lib/downloadToken')
      const payload = verifyToken(token)
      if (!payload || payload.type !== 'container' || payload.containerId !== containerId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      gameIdFromToken = payload.gameId
    }

    if (!apiKey && !gameIdFromToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const game = gameIdFromToken
      ? await prisma.game.findUnique({ where: { id: gameIdFromToken } })
      : await prisma.game.findFirst({ where: { serverApiKey: apiKey! } })
    if (!game) return NextResponse.json({ error: 'Game not found for API key' }, { status: 404 })

    const container = await prisma.adContainer.findUnique({ where: { id: containerId } })
    if (!container) return NextResponse.json({ error: 'Container not found' }, { status: 404 })

    // Build a simple container model with metadata + setup script
    const metadata = `
  <Item class="Folder">
    <Properties><string name="Name">MMLMetadata</string></Properties>
    <Item class="StringValue"><Properties><string name="Name">ContainerId</string><string name="Value">${escapeXml(containerId)}</string></Properties></Item>
    <Item class="StringValue"><Properties><string name="Name">Type</string><string name="Value">DISPLAY</string></Properties></Item>
    <Item class="BoolValue"><Properties><string name="Name">EnablePositionSync</string><bool name="Value">true</bool></Properties></Item>
  </Item>`

    // Panel presets: created at install time to avoid complex XML
    local function presetSize()
      local p = '${preset}'
      if p == 'landscape' then return Vector3.new(12, 8, 0.5) end
      return Vector3.new(8, 12, 0.5) -- portrait default
    end

    const setup = `
local model = script.Parent
local meta = model:FindFirstChild('MMLMetadata') or Instance.new('Folder', model)
meta.Name = 'MMLMetadata'
local function ensureSV(name, value)
  local sv = meta:FindFirstChild(name) or Instance.new(name == 'EnablePositionSync' and 'BoolValue' or 'StringValue', meta)
  sv.Name = name
  sv.Value = value
  return sv
end
ensureSV('ContainerId', '${containerId}')
ensureSV('Type', 'DISPLAY')
ensureSV('EnablePositionSync', true)
-- PrimaryPart best-effort
pcall(function()
  if not model.PrimaryPart then
    local p = model:FindFirstChildWhichIsA('BasePart', true)
    if p then model.PrimaryPart = p end
  end
end)

-- Create a visible Panel part when absent, using server-side preset
pcall(function()
  local panel = model:FindFirstChild('Panel')
  if not panel then
    panel = Instance.new('Part')
    panel.Name = 'Panel'
    panel.Anchored = true
    panel.CanCollide = false
    panel.Size = presetSize()
    panel.Parent = model
    if model.PrimaryPart then
      local pp = model.PrimaryPart
      if '${mount}' == 'wall' then
        panel.CFrame = pp.CFrame * CFrame.new(0, 0, - (panel.Size.Z/2 + 0.1))
      else
        panel.CFrame = CFrame.new(pp.Position + Vector3.new(0, panel.Size.Y/2, 0))
      end
    end
  end
end)
`

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" version="4">
  <Item class="Model">
    <Properties><string name="Name">MMLAdContainer_${escapeXml(container.name || 'Container')}</string></Properties>
    ${metadata}
    <Item class="Script"><Properties><string name="Name">MMLContainerSetup</string><ProtectedString name="Source"><![CDATA[${setup}]]></ProtectedString></Properties></Item>
    <Item class="Folder"><Properties><string name="Name">MMLContainer.Manifest</string></Properties>
      <Item class="StringValue"><Properties><string name="Name">Version</string><string name="Value">2.0.0</string></Properties></Item>
      <Item class="StringValue"><Properties><string name="Name">ContainerId</string><string name="Value">${escapeXml(containerId)}</string></Properties></Item>
      <Item class="StringValue"><Properties><string name="Name">GameId</string><string name="Value">${escapeXml(game.id)}</string></Properties></Item>
    </Item>
  </Item>
</roblox>`

    const res = new NextResponse(xml)
    res.headers.set('Content-Type', 'application/xml')
    res.headers.set('Content-Disposition', `attachment; filename="MML_Container_${containerId}.rbxmx"`)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to build container', message: e?.message }, { status: 500 })
  }
}


