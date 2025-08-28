## MML Runtime: Display, Fetching, Tracking, and Posting

### Module layout and loader
- Preferred placement (sibling-first):
  - `ReplicatedStorage/MMLGameNetwork` (ModuleScript)
  - `ReplicatedStorage/MMLRequestManager`, `MMLContainerManager`, `MMLContainerStreamer`, `MMLImpressionTracker`, `MMLAssetStorage`, `MMLUtil`
- The loader in `MMLGameNetwork.lua` resolves siblings in `ReplicatedStorage` first, then children under `MMLGameNetwork`.

### Container registration
- A container in `Workspace` must include `MMLMetadata` with:
  - `StringValue` `ContainerId`: UUID
  - `StringValue` `Type`: one of `DISPLAY` | `NPC` | `MINIGAME`
- On Play, `MMLContainerManager.initializeContainersFromWorkspace()` discovers these and populates `_G.MMLNetwork._containers`.

### Display rendering (DISPLAY type)
- Images: rendered via `Decal` named `AdDecal` on the `Stage` part (avoids overlaying characters).
- Videos: rendered via `SurfaceGui` with `VideoFrame` (`AlwaysOnTop = false`).
- `SurfaceGui` fallback is created if missing; `Frame/AdImage/AdVideo` are auto-created as needed.
- Image source strategy:
  - Prefer direct `rbxassetid://<assetId>`; wait up to 2s for load.
  - If not loaded, fall back to thumbnail `rbxthumb://type=Asset&id=<id>&w=480&h=270`.
  - Idempotent: if the correct direct asset is already loaded, it isn’t overwritten.

### Fetching and assignments
- Game ads cache: GET `/games/:gameId/ads/available` every 5 minutes (server-only HTTP).
- Container assignments: POST `/feeding/container-ads` every 2 minutes; response may include `containerAssignments` and optional `rotationSchedule`.
- On assignment update: `MMLContainerManager.updateContainerAds()` refreshes available ads and triggers a render if none is active.

### Tracking logic
- Hook: `MMLImpressionTracker.startTracking(containerId, assetInstance, surfaceGui, adMeta)` is called by the streamer on render.
- View accumulation: Heartbeat adds per-player duration when:
  - `container.visibility.isInCameraView == true`, and
  - player within ~65 studs of the container’s anchor (`Model.PrimaryPart` if available).
- Emits a `view` event every ~5 seconds per player with `durationDeltaSec` (5s chunks).
- Touch events: if a `BasePart` is used for assets, `Touched` events queue `touch` events.

### Batching and posting
- Queue is server-only (guarded by `RunService:IsServer()`).
- Batch settings (defaults):
  - `interval = 60` seconds
  - `batchSize = 20`
- Flush conditions:
  - Periodic worker checks queue every 15s and flushes only if `interval` elapsed since `lastBatch`.
  - Immediate flush on `Players.PlayerRemoving` and on `game:BindToClose()`.
  - Manual: `MMLRequestManager.sendImpressionBatch()`.
- Endpoint: POST `/api/v1/impressions/batch` (auth `X-API-Key`).
- Backend behavior:
  - Upserts `GameAd` records to satisfy FK.
  - Aggregates daily into `GameAdPerformance`.
  - Also writes raw events to `AdEvent` (for analytics).

### Debug logs
- `[MML][Impression] Queue view: <containerId> <adId> <secs> <playerId>` — a 5s chunk queued.
- `[MML][Impression] Pending queue: <N>` — current queue length.
- `[MML][Impression] Debug send: len= <N> hasKey= true adId= <adId> bytes= <size>` — payload summary before POST.
- `📤 Sent batch of <N> events ...` — POST success; backend returns `processed` and `upserts`.

### Tuning knobs (code locations)
- Batch interval/size: `src/roblox/MMLRequestManager.lua` (requestBatches.impressions).
- Worker cadence and timed flush: `MMLRequestManager.initialize()` loop.
- Proximity threshold (~65 studs): `src/roblox/MMLImpressionTracker.lua` (Heartbeat near-check).
- Image/video rendering behavior: `src/roblox/MMLContainerStreamer.lua`.

### Troubleshooting quick checks
- No events posting:
  - Ensure server console (not client) and that `_G.MMLNetwork._initialized == true`.
  - Confirm container registered: list `_G.MMLNetwork._containers`.
  - Render once to set `currentAdId` if nil (use `Streamer.moveAssetsToContainer(containerId, adId)`).
  - Verify player is near and container visible (see distance/visible diagnostic).
- Module errors:
  - Keep modules at `ReplicatedStorage` root per loader strategy.
  - Ensure `MMLUtil.lua` exists next to other modules.

### Notes
- Daily aggregation is per UTC day; raw `AdEvent` provides per-event analytics.
- Player metadata captured when available: `id`, `name`, `country`, `accountAge`, `membershipType`.


