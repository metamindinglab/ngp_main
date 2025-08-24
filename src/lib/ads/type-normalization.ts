export type CanonicalGameAdType = 'DISPLAY' | 'NPC' | 'MINIGAME'

const legacyToCanonical: Record<string, CanonicalGameAdType> = {
  multimedia_display: 'DISPLAY',
  display: 'DISPLAY',
  DISPLAY: 'DISPLAY',
  dancing_npc: 'NPC',
  kol: 'NPC',
  NPC: 'NPC',
  minigame_ad: 'MINIGAME',
  minigame: 'MINIGAME',
  MINIGAME: 'MINIGAME',
}

export function normalizeGameAdType(input: string): CanonicalGameAdType {
  const key = String(input || '').trim()
  const mapped = legacyToCanonical[key as keyof typeof legacyToCanonical]
  return mapped || 'DISPLAY'
}

export const AcceptedGameAdTypes = [
  // canonical
  'DISPLAY', 'NPC', 'MINIGAME',
  // legacy
  'multimedia_display', 'display', 'dancing_npc', 'kol', 'minigame_ad', 'minigame',
] as const


