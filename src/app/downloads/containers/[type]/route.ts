import { NextRequest, NextResponse } from 'next/server'
function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  _request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const containerType = String(params.type || '').toUpperCase() as 'DISPLAY' | 'NPC' | 'MINIGAME'
    if (!['DISPLAY', 'NPC', 'MINIGAME'].includes(containerType)) {
      return NextResponse.json({ error: 'Invalid container type' }, { status: 400 })
    }

    const xml = buildXml(containerType)
    const filename = `MMLContainer_${containerType}.rbxmx`
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error generating public prebuilt container:', error)
    return NextResponse.json({ error: 'Failed to generate container' }, { status: 500 })
  }
}
function buildXml(type: 'DISPLAY' | 'NPC' | 'MINIGAME') {
  const size = type === 'DISPLAY' ? { x: 10, y: 5, z: 0.5 } : type === 'NPC' ? { x: 4, y: 4, z: 4 } : { x: 12, y: 8, z: 12 }
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" version="4">
  <Item class="Model">
    <Properties><string name="Name">${escapeXml(`MMLContainer_${type}`)}</string></Properties>
    <Item class="Folder">
      <Properties><string name="Name">MMLMetadata</string></Properties>
      <Item class="StringValue"><Properties><string name="Name">ContainerId</string><string name="Value"></string></Properties></Item>
      <Item class="StringValue"><Properties><string name="Name">GameId</string><string name="Value"></string></Properties></Item>
      <Item class="StringValue"><Properties><string name="Name">Type</string><string name="Value">${type}</string></Properties></Item>
      <Item class="BoolValue"><Properties><string name="Name">EnablePositionSync</string><bool name="Value">true</bool></Properties></Item>
    </Item>
    <Item class="Part">
      <Properties>
        <string name="Name">Stage</string>
        <bool name="Anchored">true</bool>
        <bool name="CanCollide">false</bool>
        <Vector3 name="Size"><X>${size.x}</X><Y>${size.y}</Y><Z>${size.z}</Z></Vector3>
        <string name="Material">SmoothPlastic</string>
        <string name="BrickColor">Medium stone grey</string>
      </Properties>
      ${type === 'DISPLAY' ? `
      <Item class="SurfaceGui">
        <Properties>
          <string name="Name">MMLDisplaySurface</string>
          <string name="Face">Front</string>
          <string name="SizingMode">PixelsPerStud</string>
          <Vector2 name="CanvasSize"><X>1024</X><Y>576</Y></Vector2>
          <bool name="AlwaysOnTop">false</bool>
        </Properties>
        <Item class="Frame"><Properties><string name="Name">Frame</string><UDim2 name="Size"><XS>1</XS><XO>0</XO><YS>1</YS><YO>0</YO></UDim2><float name="BackgroundTransparency">1</float></Properties>
          <Item class="ImageLabel"><Properties><string name="Name">AdImage</string><UDim2 name="Size"><XS>1</XS><XO>0</XO><YS>1</YS><YO>0</YO></UDim2><float name="BackgroundTransparency">1</float><string name="ScaleType">Fit</string></Properties></Item>
          <Item class="VideoFrame"><Properties><string name="Name">AdVideo</string><UDim2 name="Size"><XS>1</XS><XO>0</XO><YS>1</YS><YO>0</YO></UDim2><float name="BackgroundTransparency">1</float></Properties></Item>
        </Item>
      </Item>` : ''}
    </Item>
  </Item>
</roblox>`
  return xml
}


