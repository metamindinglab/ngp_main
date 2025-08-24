import { PrismaClient } from '@prisma/client'
import { resolveAssetTyping } from '@/lib/assets/type-resolver'

const prisma = new PrismaClient()

async function main() {
  console.log('[backfill] starting')

  // 1) Backfill Asset typing
  const assets = await prisma.asset.findMany({ select: { id: true, type: true, robloxId: true, robloxType: true, canonicalType: true } })
  let updated = 0
  for (const a of assets) {
    const typing = resolveAssetTyping({
      source: a.robloxId ? 'ROBLOX_ID' : 'LOCAL_UPLOAD',
      declaredSystemType: a.type,
      robloxAssetId: a.robloxId || undefined,
    })
    // Always refresh typing to adopt new rules; keep idempotent values
    await prisma.asset.update({ where: { id: a.id }, data: {
      robloxType: typing.robloxType,
      robloxSubtype: typing.robloxSubtype,
      robloxAssetTypeId: typing.robloxAssetTypeId,
      canonicalType: typing.canonicalType,
      capabilities: typing.capabilities,
      source: typing.source,
    }})
    updated++
  }
  console.log(`[backfill] assets updated: ${updated}`)

  // 2) Deduplicate GameDeployment by (scheduleId, gameId)
  const deployments = await prisma.gameDeployment.findMany({ select: { id: true, scheduleId: true, gameId: true } })
  const seen = new Set<string>()
  let deleted = 0
  for (const d of deployments) {
    const key = `${d.scheduleId}::${d.gameId}`
    if (seen.has(key)) {
      await prisma.gameDeployment.delete({ where: { id: d.id } })
      deleted++
    } else {
      seen.add(key)
    }
  }
  console.log(`[backfill] duplicate deployments removed: ${deleted}`)

  console.log('[backfill] done')
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })


