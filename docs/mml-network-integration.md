## MML Network Integration – Updated Logic and Flows

### Overview
This document summarizes the current Roblox-side integration, the server API behavior, and key flows for serving ads, moving assets, and tracking performance.

### Roblox Modules and Responsibilities
- **MMLGameNetwork.lua**
  - Initializes subsystems with config: `apiKey`, `baseUrl`, `gameId`, `debugMode`.
  - Boots: AssetStorage → ContainerManager → RequestManager → ContainerStreamer → Rotation + Position monitors.
  - Exposes helpers to refresh ads/assignments, record impressions, and sync positions.
  - Uses `MMLUtil.getInstancePosition/CFrame` for all model/part world transforms.

- **MMLContainerManager.lua**
  - Discovers containers in `Workspace` via `MMLMetadata` on `Model`/`Part`.
    - Requires `MMLMetadata/ContainerId` (StringValue) and `MMLMetadata/Type`.
    - Optional: `MMLMetadata/EnablePositionSync` (BoolValue) to push positions to API.
  - Maintains rotation state, metrics, and visibility flags per container.
  - Position monitoring now calls `MMLNetwork.syncContainerPosition(...)` with safe positions via `MMLUtil`.

- **MMLContainerStreamer.lua**
  - Proximity/camera monitoring to decide visibility. Uses:
    - Camera distance threshold (~100 studs + buffer).
    - Look vector dot-product for coarse FOV check.
  - Moves preloaded assets from storage to containers using tweens.
  - Starts/stops impression tracking on show/hide.
  - All container transforms use `MMLUtil` to avoid `Model.Position` errors.

- **MMLAssetStorage.lua**
  - Preloads assets and stores original CFrame/positions for smooth moves.
  - Supports `Image` via `SurfaceGui+ImageLabel`, `Decal` via `Decal`, and 3D models via `InsertService`.

- **MMLImpressionTracker.lua**
  - Tracks per-container, per-ad visibility sessions and touch events.
  - Collects player data (UserId, Name, Country, AccountAge, MembershipType; future: DisplayName, Locale, SystemLocale, DeviceType).
  - Batches impressions for network send.

- **MMLRequestManager.lua**
  - Handles HTTP with `X-API-Key`. GET requests avoid disallowed `Content-Type` header.
  - Fetches game ads and per-container assignments.
  - Queues impression events (view/touch). Sends batch to `/api/v1/impressions/batch` on a short interval (testing: 5s).

- **MMLUtil.lua** (NEW)
  - Safe helpers for models/parts:
    - `ensurePrimaryPart(model)` picks a reasonable `PrimaryPart` if missing.
    - `getInstanceCFrame(instance)` and `getInstancePosition(instance)` return robust world transforms for `Model` or `BasePart`.
  - Eliminates `Position is not a valid member of Model` errors.

### Initialization Flow
1. `MMLNetwork.Initialize(config)` called from `ServerScriptService` integration script.
2. Containers are discovered in `Workspace` by scanning for `MMLMetadata`.
3. RequestManager fetches game ads and container assignments.
4. AssetStorage preloads referenced assets (images/decals/models).
5. ContainerStreamer monitors players; when in view, moves assets to container and triggers impression tracking.

### Ad Serving and Scheduling
- Server resolves ads via:
  - `GET /api/v1/games/:gameId/ads/available` – lists eligible ads for a game based on active `PlaylistSchedule` windows and deployments.
  - `POST /api/v1/feeding/container-ads` – per-container assignment with optional client hints; server trusts API key to resolve `gameId`.
- `PlaylistSchedule.duration` is interpreted in days (not seconds).

### Position Sync
- Optional per-container via `MMLMetadata/EnablePositionSync = true`:
  - `PUT /api/v1/containers/:containerId/position` with `{ position: { x,y,z }, timestamp }`.
  - Throttled (≥ 5s) and only when movement exceeds 0.5 studs.

### Impression Tracking and Aggregation
- Client sends batched events to `POST /api/v1/impressions/batch` with items:
  - `{ event: 'view'|'touch', containerId?, adId, duration?, timestamp?, player? }`.
- Server aggregates per `(gameId from API key, adId, day)` into `GameAdPerformance`:
  - `metrics`: `{ views, viewDuration, touches }` (incremental upsert).
  - `demographics`: `{ countryCode: count }` (merged counts).
  - `engagements`: `{ containers: { containerId: count }, lastEventAt }`.

### Debugging
- Enable `debugMode` in config to print verbose logs in Studio and server terminal.
- Common issues addressed:
  - GET `Content-Type` header removal due to Roblox restrictions.
  - Timeouts fall back to local behavior.
  - Robust asset handling for images vs decals vs models.
  - Safe model position access via `MMLUtil` to stop Studio loop errors.

### Data Model Notes
- `GameAd` to `Game` is many-to-many via `_GameToAds`.
- `GameAdPerformance` extended with `views`, `viewDuration`, `touches`, demographics, and engagements.
  - Indexed for performance.

### Operational Tips
- Ensure the integration script runs on the server (not client) and initializes with the correct API key and `gameId`.
- Add `MMLMetadata` to container models with real `ContainerId` values from the database.
- Make assets public and preload via `MMLAssetStorage` for reliability.


