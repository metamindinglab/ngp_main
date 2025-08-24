export type AssetSource = 'LOCAL_UPLOAD' | 'ROBLOX_ID'

export interface ResolveInput {
  source: AssetSource
  declaredSystemType?: string
  robloxAssetId?: string
  filename?: string
  mimeType?: string
}

export interface ResolveOutput {
  robloxType: string
  robloxSubtype?: string
  robloxAssetTypeId?: number
  canonicalType: string
  capabilities: Record<string, unknown>
  source: AssetSource
}

function inferFromSystemType(system?: string): { robloxType: string; canonicalType: string } {
  const t = String(system || '').trim().toLowerCase()
  const tNoPunct = t.replace(/[^a-z0-9]/g, '')
  // Handle multi-media signage aliases up-front to avoid multiple default labels
  if (tNoPunct === 'multimediasignage' || tNoPunct === 'multimediasign' || tNoPunct === 'multimedia') {
    return { robloxType: 'Video', canonicalType: 'DISPLAY.video' }
  }
  switch (t) {
    // DISPLAY families
    case 'image':
    case 'decal':
      return { robloxType: 'Image', robloxSubtype: t === 'decal' ? 'Decal' : 'Image', robloxAssetTypeId: 13, canonicalType: 'DISPLAY.image' }
    case 'video':
    case 'videoframe':
    case 'multi_display': // legacy template, default to image-like unless specified
      return { robloxType: 'Video', robloxSubtype: t === 'videoframe' ? 'VideoFrame' : 'Video', robloxAssetTypeId: 62, canonicalType: 'DISPLAY.video' }
    case 'audio':
    case 'sound':
      return { robloxType: 'Audio', robloxSubtype: 'Sound', robloxAssetTypeId: 3, canonicalType: 'DISPLAY.audio' }

    // NPC families (character and wearables)
    case 'kol_character':
      return { robloxType: 'Model', robloxSubtype: 'Model', robloxAssetTypeId: 10, canonicalType: 'NPC.character_model' }
    case 'animation':
      return { robloxType: 'Animation', robloxSubtype: 'Animation', robloxAssetTypeId: 24, canonicalType: 'NPC.animation' }
    case 'hat':
      return { robloxType: 'Accessory', robloxSubtype: 'Accessory', robloxAssetTypeId: 8, canonicalType: 'NPC.character_model' }
    case 'clothing':
    case 'clothing_top':
      return { robloxType: 'Shirt', robloxSubtype: 'Shirt', robloxAssetTypeId: 11, canonicalType: 'NPC.character_model' }
    case 'clothing_bottom':
      return { robloxType: 'Pants', robloxSubtype: 'Pants', robloxAssetTypeId: 12, canonicalType: 'NPC.character_model' }
    case 'shoes':
      return { robloxType: 'Accessory', robloxSubtype: 'Accessory', robloxAssetTypeId: 8, canonicalType: 'NPC.character_model' }
    case 'item':
      return { robloxType: 'Model', robloxSubtype: 'Model', robloxAssetTypeId: 10, canonicalType: 'NPC.character_model' }

    // MINIGAME family
    case 'minigame':
    case 'minigame_ad':
      return { robloxType: 'Model', robloxSubtype: 'Model', robloxAssetTypeId: 10, canonicalType: 'MINIGAME.minigame_model' }
    case 'model':
    case 'meshpart':
    case 'folder':
    case 'humanoiddescription':
      return { robloxType: 'Model', robloxSubtype: 'Model', robloxAssetTypeId: 10, canonicalType: 'MINIGAME.minigame_model' }

    default:
      return { robloxType: 'Unknown', canonicalType: 'DISPLAY.image' }
  }
}

function inferCapabilities(input: ResolveInput): Record<string, unknown> {
  const caps: Record<string, unknown> = {}
  if (input.mimeType) caps.mime = input.mimeType
  if (input.filename) caps.filename = input.filename
  if (input.robloxAssetId) caps.robloxAssetId = input.robloxAssetId
  return caps
}

export function resolveAssetTyping(input: ResolveInput): ResolveOutput {
  const result = inferFromSystemType(input.declaredSystemType) as any
  return {
    robloxType: result.robloxType,
    robloxSubtype: result.robloxSubtype,
    robloxAssetTypeId: result.robloxAssetTypeId,
    canonicalType: result.canonicalType,
    capabilities: inferCapabilities(input),
    source: input.source,
  }
}


