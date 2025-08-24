import { NextRequest, NextResponse } from 'next/server'
import { resolveAssetTyping } from '@/lib/assets/type-resolver'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const typing = resolveAssetTyping({ source: 'ROBLOX_ID', declaredSystemType: '', robloxAssetId: id })

    // Try Roblox public thumbnails API for a reliable preview image
    let thumbnailUrl = `https://www.roblox.com/asset-thumbnail/image?assetId=${id}&width=420&height=420&format=png`
    try {
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${id}&size=420x420&format=Png&isCircular=false`)
      if (thumbRes.ok) {
        const tjson = await thumbRes.json()
        const first = tjson?.data?.[0]
        if (first?.imageUrl) thumbnailUrl = first.imageUrl
      }
    } catch {}

    const robloxTypeLabel = typing.robloxSubtype || typing.robloxType || (typing.canonicalType.includes('.') ? typing.canonicalType.split('.').pop() : typing.canonicalType)
    const preview = {
      id,
      name: `Roblox Asset ${id}`,
      thumbnail: thumbnailUrl,
      robloxType: robloxTypeLabel,
      robloxSubtype: typing.robloxSubtype,
      robloxAssetTypeId: typing.robloxAssetTypeId,
      canonicalType: typing.canonicalType,
    }

    return NextResponse.json({ success: true, preview })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch preview' }, { status: 500 })
  }
}


