## MML Runtime: Current Behavior (Rendering, Fetching, Rotation, Tracking)

### Module layout and loader
- Preferred placement (sibling-first):
  - `ReplicatedStorage/MMLGameNetwork` (ModuleScript)
  - Sibling modules: `MMLRequestManager`, `MMLContainerManager`, `MMLContainerStreamer`, `MMLImpressionTracker`, `MMLAssetStorage`, `MMLUtil`
- The loader in `MMLGameNetwork.lua` resolves siblings in `ReplicatedStorage` first, then children under `MMLGameNetwork`.

### Container discovery and init
- A container in `Workspace` must include `MMLMetadata` with:
  - `StringValue` `ContainerId` (UUID)
  - `StringValue` `Type` ∈ {`DISPLAY`,`NPC`,`MINIGAME`}
- On Play, `MMLContainerManager.initializeContainersFromWorkspace()` discovers containers and populates `_G.MMLNetwork._containers`.
- During `initializeContainer` for `DISPLAY`:
  - Resolve `Stage` `BasePart`; compute dominant faces; create `MMLDisplaySurface` and `MMLDisplaySurface_Back` on `Stage`.
  - Create `Frame/AdImage/AdVideo` children if missing.
  - `SurfaceGui.AlwaysOnTop = false` (renders within 3D, not over characters).
  - `Stage.CanCollide = true` to prevent walking through the sign.
  - Deep-delete any `Decal` under `Stage` and guard against future decals.

### Display rendering (MMLContainerStreamer)
- Deterministic surfaces on dominant faces for front/back; back mirrors image only.
- Decal purge: any `Decal` under `Stage` is removed each heartbeat; a guard deletes newly-added decals.
- Thumbnail-first strategy for reliability:
  - For images, prefer `rbxthumb://type=Asset&id=<id>&w=480&h=270` to guarantee immediate render.
  - If an explicit direct asset is already loaded and valid, it is kept (idempotent).
  - Optional fallback image resolution order:
    1) `AdImage:GetAttribute("FallbackAssetId")`
    2) `_G.MMLNetwork._config.fallbackImageAssetId`
    3) `ServerStorage.MMLConfig.fallbackImageAssetId`
  - `ThumbnailOnly` attribute (if true) forces thumbnail-only behavior.
- Video rendering: show a thumbnail placeholder first, then start `VideoFrame` on top; if video fails, the thumbnail remains.

### Available ads and preloading
- Server fetch every 5 minutes: `GET /api/v1/games/:gameId/ads/available`.
- Server criteria for availability (no dependency on “Draft” UI label):
  - Game link exists in `_GameToAds`.
  - `PlaylistSchedule.status` is ACTIVE (case-insensitive).
  - Now within `[startDate, endDate)` (or no `endDate`).
  - A `GameDeployment` row targets the same game.
- After fetch, `MMLAssetStorage.preloadAllGameAds(ads)` logs: `📦 Starting pre-load of <N> game ads...` and queues all ads.
- Preload is best-effort; if an asset can’t be preloaded you’ll see `⚠️ Skipping preload...` but rendering still proceeds from cached API data/thumbnail.

### Assignment, rotation, and de-duplication
- Feeding engine (server) every 2 minutes: `POST /api/v1/feeding/container-ads` returns per-container assigned ads and a rotation schedule.
- `MMLContainerManager.updateContainerAds(containerId, adIds)` stores available ads and assigns an initial ad if none is active.
- Starting index per container is seeded from a stable hash of `containerId` to stagger unique starts.
- De-duplication: when selecting, if another container is already showing the same ad and alternatives exist, pick a different one.
- Rotation: default interval 300s (`time_interval`); also supports `weighted` and `performance_based` strategies.

### Impression tracking and batching
- On successful render, `MMLImpressionTracker.startTracking(containerId, stage, surfaceGui, { id = adId, type = 'DISPLAY' })` begins.
- View time accumulates in ~5s chunks while the player is near and the container is in view.
- Batch queue is server-only; defaults:
  - interval 90s (send cadence)
  - batchSize 20
- POST `/api/v1/impressions/batch` with `X-API-Key` auth; backend upserts raw `AdEvent` and aggregates `GameAdPerformance` daily.

### Integration notes
- Startup “heal” block in the integration script was removed from generation; the streamer owns surface creation and image selection to avoid race conditions.
- Any legacy `SurfaceGui.AlwaysOnTop=true` created in older builds can be normalized at runtime (one-time script) and will be kept at `false` by the streamer.

### Debugging quick checks
- Available ads count low: verify `_GameToAds` link, ACTIVE schedule in-window, and a `GameDeployment` targeting the game.
- Duplicate content across signs: expected if fewer ads than containers; resolves once enough ads are available.
- Sign overlays characters: ensure `SurfaceGui.AlwaysOnTop=false` (new code enforces this).
- Can walk through sign: ensure `Stage.CanCollide=true` (new code enforces this at init).
- Persistent decals: guards remove any `Decal` under `Stage` and under any model with `MMLMetadata`.

### Key code locations
- Rendering and surfaces: `src/roblox/MMLContainerStreamer.lua`
- Container discovery/rotation/de-dup: `src/roblox/MMLContainerManager.lua`
- Preloading: `src/roblox/MMLAssetStorage.lua`
- Fetching (available ads, feeding): `src/roblox/MMLRequestManager.lua`, server routes
- Impression batching: `src/roblox/MMLRequestManager.lua` / `/api/v1/impressions/batch`



