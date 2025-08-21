import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { handleAuth, applyRateLimit, addRateLimitHeaders } from '@/app/api/middleware'

const ImpressionSchema = z.object({
  event: z.enum(['view', 'touch']),
  containerId: z.string().optional(),
  adId: z.string(),
  duration: z.number().optional(),
  timestamp: z.number().optional(),
  player: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      country: z.string().optional(),
      accountAge: z.number().optional(),
      membershipType: z.string().optional()
    })
    .optional()
})

const BatchSchema = z.object({
  impressions: z.array(ImpressionSchema),
  batchId: z.string().optional(),
  gameSession: z.string().optional(),
  serverTimestamp: z.number().optional()
})

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setUTCHours(23, 59, 59, 999)
  return d
}

export async function POST(request: NextRequest) {
  try {
    // Auth via X-API-Key
    const auth = await handleAuth(request)
    if (!auth.isValid || !auth.apiKey || !auth.gameId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
    }

    // Rate limit
    const rl = applyRateLimit(auth.apiKey)
    if (!rl.allowed) {
      const res = NextResponse.json({ error: 'Rate limit exceeded', resetTime: rl.resetTime }, { status: 429 })
      addRateLimitHeaders(res, rl)
      return res
    }

    const body = await request.json()
    const parsed = BatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }

    const impressions = parsed.data.impressions
    if (impressions.length === 0) {
      const res = NextResponse.json({ success: true, processed: 0 })
      addRateLimitHeaders(res, rl)
      return res
    }

    // Aggregate per (adId, day)
    type Agg = {
      views: number
      viewDuration: number
      touches: number
      demographics: Record<string, number>
      lastEventAt: string
      containers: Record<string, number>
      players: Record<string, { views: number; touches: number; viewDuration: number; name?: string; country?: string; accountAge?: number; membershipType?: string; lastEventAt: string }>
      timeByHour: Record<string, { views: number; touches: number; viewDuration: number }>
    }
    const buckets = new Map<string, Agg>()

    for (const ev of impressions) {
      const tsMs = (ev.timestamp ?? Date.now()) * (ev.timestamp && ev.timestamp < 10_000_000_000 ? 1000 : 1)
      const d = new Date(tsMs)
      const key = `${ev.adId}|${startOfDay(d).toISOString()}`
      if (!buckets.has(key)) {
        buckets.set(key, { views: 0, viewDuration: 0, touches: 0, demographics: {}, lastEventAt: d.toISOString(), containers: {}, players: {}, timeByHour: {} })
      }
      const agg = buckets.get(key)!
      if (ev.event === 'view') {
        agg.views += 1
        agg.viewDuration += Math.max(0, ev.duration ?? 0)
      } else if (ev.event === 'touch') {
        agg.touches += 1
      }
      if (ev.player?.country) {
        agg.demographics[ev.player.country] = (agg.demographics[ev.player.country] || 0) + 1
      }
      if (ev.containerId) {
        agg.containers[ev.containerId] = (agg.containers[ev.containerId] || 0) + 1
      }
      agg.lastEventAt = d.toISOString()

      // Player details aggregation
      const playerKey = ev.player?.id || 'anonymous'
      if (!agg.players[playerKey]) {
        agg.players[playerKey] = { views: 0, touches: 0, viewDuration: 0, name: ev.player?.name, country: ev.player?.country, accountAge: ev.player?.accountAge, membershipType: ev.player?.membershipType, lastEventAt: d.toISOString() }
      }
      const pd = agg.players[playerKey]
      if (ev.event === 'view') {
        pd.views += 1
        pd.viewDuration += Math.max(0, ev.duration ?? 0)
      } else if (ev.event === 'touch') {
        pd.touches += 1
      }
      pd.lastEventAt = d.toISOString()

      // Time distribution by hour (UTC)
      const hour = String(d.getUTCHours()).padStart(2, '0')
      if (!agg.timeByHour[hour]) {
        agg.timeByHour[hour] = { views: 0, touches: 0, viewDuration: 0 }
      }
      const hb = agg.timeByHour[hour]
      if (ev.event === 'view') {
        hb.views += 1
        hb.viewDuration += Math.max(0, ev.duration ?? 0)
      } else if (ev.event === 'touch') {
        hb.touches += 1
      }
    }

    let upserts = 0
    for (const [key, agg] of buckets.entries()) {
      const [adId, dayIso] = key.split('|')
      const day = new Date(dayIso)
      const existing = await prisma.gameAdPerformance.findFirst({
        where: {
          gameAdId: adId,
          gameId: auth.gameId,
          date: { gte: startOfDay(day), lte: endOfDay(day) }
        }
      })

      if (!existing) {
        await prisma.gameAdPerformance.create({
          data: {
            id: `perf_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            gameAdId: adId,
            gameId: auth.gameId,
            date: day,
            metrics: { views: agg.views, viewDuration: agg.viewDuration, touches: agg.touches },
            demographics: agg.demographics,
            engagements: { containers: agg.containers, lastEventAt: agg.lastEventAt },
            playerDetails: agg.players,
            timeDistribution: { byHourUtc: agg.timeByHour },
            performanceTrends: { totals: { views: agg.views, viewDuration: agg.viewDuration, touches: agg.touches }, lastEventAt: agg.lastEventAt },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      } else {
        const newViews = (existing.metrics as any)?.views || 0
        const newDur = (existing.metrics as any)?.viewDuration || 0
        const newTouches = (existing.metrics as any)?.touches || 0
        const prevDemo = (existing.demographics as any) || {}
        const prevEng = (existing.engagements as any) || {}
        const prevPlayers = (existing.playerDetails as any) || {}
        const prevTime = ((existing.timeDistribution as any)?.byHourUtc) || {}
        const prevTrends = (existing.performanceTrends as any) || {}

        const mergedPlayers: Record<string, any> = { ...prevPlayers }
        for (const [pid, p] of Object.entries(agg.players)) {
          const prev = mergedPlayers[pid] || { views: 0, touches: 0, viewDuration: 0 }
          mergedPlayers[pid] = {
            name: (prev as any).name ?? (p as any).name,
            country: (prev as any).country ?? (p as any).country,
            accountAge: (prev as any).accountAge ?? (p as any).accountAge,
            membershipType: (prev as any).membershipType ?? (p as any).membershipType,
            views: (prev as any).views + (p as any).views,
            touches: (prev as any).touches + (p as any).touches,
            viewDuration: (prev as any).viewDuration + (p as any).viewDuration,
            lastEventAt: new Date(Math.max(new Date((prev as any).lastEventAt || 0).getTime(), new Date((p as any).lastEventAt).getTime())).toISOString()
          }
        }

        const mergedTime: Record<string, any> = { ...prevTime }
        for (const [hour, tb] of Object.entries(agg.timeByHour)) {
          const prev = mergedTime[hour] || { views: 0, touches: 0, viewDuration: 0 }
          mergedTime[hour] = {
            views: (prev as any).views + (tb as any).views,
            touches: (prev as any).touches + (tb as any).touches,
            viewDuration: (prev as any).viewDuration + (tb as any).viewDuration
          }
        }

        const prevTotals = (prevTrends.totals as any) || { views: 0, viewDuration: 0, touches: 0 }
        const mergedTotals = {
          views: prevTotals.views + agg.views,
          viewDuration: prevTotals.viewDuration + agg.viewDuration,
          touches: prevTotals.touches + agg.touches
        }
        const mergedLastEventAt = new Date(Math.max(new Date(prevTrends.lastEventAt || 0).getTime(), new Date(agg.lastEventAt).getTime())).toISOString()

        await prisma.gameAdPerformance.update({
          where: { id: existing.id },
          data: {
            metrics: { views: newViews + agg.views, viewDuration: newDur + agg.viewDuration, touches: newTouches + agg.touches },
            demographics: { ...prevDemo, ...Object.fromEntries(Object.entries(agg.demographics).map(([k,v]) => [k, (prevDemo[k]||0) + (v as number)])) },
            engagements: { ...(prevEng || {}), containers: { ...((prevEng && prevEng.containers) || {}), ...agg.containers }, lastEventAt: mergedLastEventAt },
            playerDetails: mergedPlayers,
            timeDistribution: { byHourUtc: mergedTime },
            performanceTrends: { totals: mergedTotals, lastEventAt: mergedLastEventAt },
            updatedAt: new Date()
          }
        })
      }
      upserts++
    }

    const response = NextResponse.json({ success: true, processed: impressions.length, upserts })
    addRateLimitHeaders(response, rl)
    return response
  } catch (error) {
    console.error('[DEBUG] Error in impressions batch:', error)
    const e: any = error
    return NextResponse.json({ error: 'Internal server error', message: e?.message || String(e), stack: e?.stack }, { status: 500 })
  }
}


