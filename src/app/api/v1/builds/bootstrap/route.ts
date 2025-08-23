import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function readModule(modulePath: string) {
  // Dynamic import of raw files at runtime is not available; instead, read from the filesystem
  // Using process.cwd() relative paths
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const abs = path.join(process.cwd(), modulePath)
  const buf = await fs.readFile(abs, 'utf8')
  return buf
}

function wrapModule(name: string, source: string) {
  return `
    <Item class="ModuleScript">
      <Properties>
        <string name="Name">${escapeXml(name)}</string>
        <ProtectedString name="Source"><![CDATA[${source}]]></ProtectedString>
      </Properties>
    </Item>`
}

function wrapScript(name: string, source: string) {
  return `
    <Item class="Script">
      <Properties>
        <string name="Name">${escapeXml(name)}</string>
        <ProtectedString name="Source"><![CDATA[${source}]]></ProtectedString>
      </Properties>
    </Item>`
}

function manifestFolder(values: Record<string, string>) {
  const entries = Object.entries(values).map(([k, v]) => `
    <Item class="StringValue">
      <Properties>
        <string name="Name">${escapeXml(k)}</string>
        <string name="Value">${escapeXml(v)}</string>
      </Properties>
    </Item>`).join('\n')
  return `
  <Item class="Folder">
    <Properties>
      <string name="Name">MML.Manifest</string>
    </Properties>
    ${entries}
  </Item>`
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Allow either API key header or signed token (?token=...)
    const token = request.nextUrl.searchParams.get('token')
    let gameIdFromToken: string | null = null
    if (token) {
      const { verifyToken } = await import('@/lib/downloadToken')
      const payload = verifyToken(token)
      if (!payload || payload.type !== 'bootstrap') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      gameIdFromToken = payload.gameId
    }

    const apiKey = request.headers.get('X-API-Key')
    if (!apiKey && !gameIdFromToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const game = gameIdFromToken
      ? await prisma.game.findUnique({ where: { id: gameIdFromToken } })
      : await prisma.game.findFirst({ where: { serverApiKey: apiKey! } })
    if (!game) {
      return NextResponse.json({ error: 'Game not found for API key' }, { status: 404 })
    }

    // Load module sources from repo
    const modules = await Promise.all([
      ['MMLGameNetwork', 'src/roblox/MMLGameNetwork.lua'],
      ['MMLContainerManager', 'src/roblox/MMLContainerManager.lua'],
      ['MMLContainerStreamer', 'src/roblox/MMLContainerStreamer.lua'],
      ['MMLRequestManager', 'src/roblox/MMLRequestManager.lua'],
      ['MMLAssetStorage', 'src/roblox/MMLAssetStorage.lua'],
      ['MMLImpressionTracker', 'src/roblox/MMLImpressionTracker.lua'],
      ['MMLUtil', 'src/roblox/MMLUtil.lua'],
    ].map(async ([name, p]) => [name, await readModule(p as string)] as const))

    const moduleXml = modules.map(([name, src]) => wrapModule(name, src)).join('\n')

    const bootstrapSource = `
local SSS = game:GetService('ServerScriptService')
local function log(...) local t={} for i,v in ipairs({...}) do t[i]=tostring(v) end print('[MML][Bootstrap]', table.concat(t,' ')) end
local ok, MML = pcall(function() return require(SSS:WaitForChild('MMLGameNetwork', 10)) end)
if not ok or not MML then warn('[MML][Bootstrap] Missing MMLGameNetwork'); return end
log('Initializing MML...')
MML.Initialize({
  apiKey = '${apiKey}',
  baseUrl = '${process.env.NEXT_PUBLIC_MML_BASE_URL || 'http://23.96.197.67:3000/api/v1'}',
  debugMode = true,
  enablePositionSync = true,
  gameId = '${game.id}',
})
`

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" version="4">
  <Item class="Folder">
    <Properties>
      <string name="Name">MML</string>
    </Properties>
    ${manifestFolder({ Version: '2.0.0', GameId: game.id, BuildTimestamp: new Date().toISOString() })}
    ${moduleXml}
    ${wrapScript('MMLNetworkBootstrap', bootstrapSource)}
  </Item>
</roblox>`

    const res = new NextResponse(xml)
    res.headers.set('Content-Type', 'application/xml')
    res.headers.set('Content-Disposition', `attachment; filename="MML_Bootstrap_${game.id}.rbxmx"`)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to build bootstrap', message: e?.message }, { status: 500 })
  }
}


