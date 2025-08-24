## MML Roblox Integration Guide (v2)

### What’s new in v2
- Token-based rbxmx downloads (Bootstrap + Container)
- Container presets: `preset=portrait|landscape`, `mount=ground|wall`
- Server-side panel creation when missing
- Full debug logging across bootstrap, requests, streaming, and impressions
- Proximity-driven streaming and view enter/exit tracking with batching

### Download builds
- Bootstrap: GET `/api/v1/builds/bootstrap` with `X-API-Key`
  - Or POST `/api/v1/builds/token` then GET `/api/v1/builds/bootstrap?token=...`
- Container: GET `/api/v1/builds/container?containerId=...&preset=portrait|landscape&mount=ground|wall`
  - Supports `?token=...` (from POST `/api/v1/builds/token`)

### Install steps
1) Import `Bootstrap.rbxmx`; move the `MML` folder into `ServerScriptService`.
2) Import `Container.rbxmx`; place each model under `Workspace` where you want signage.
3) Start Local Server (Test → Start). Expect 200s for feeding and impressions endpoints.

### Runtime behavior & debug
- `_G.MMLNetwork` and `_G.MMLImpressionTracker` initialized by `MMLNetworkBootstrap` (server-only).
- Modules use `require(script.Parent.<ModuleName>)`; no ReplicatedStorage required.
- Requests: `MMLRequestManager` normalizes payloads (positions `{x,y,z}`, string-keyed maps), preloads assets, and batches impressions (~5s).
- Streaming: `MMLContainerStreamer` proximity and visibility checks; emits `view_start`/`view_end`.
- Containers: `MMLContainerManager` provides normalized summaries and uses safe transforms via `MMLUtil`.

### Duplicate/version guard
- Registry under `ServerStorage.MML.Registry` prevents duplicate installs and allows upgrades by version.

### Troubleshooting
- 401 ads/impressions: ensure valid `X-API-Key` or `token`; use Local Server.
- "MML missing" / `_G.MMLNetwork` nil: ensure modules are under `ServerScriptService` and Bootstrap executed.
- "Position is not a valid member of Model": models without `BasePart`—ensure at least one part; utilities avoid direct `.Position`.
- "Unable to assign property Source … length >= 4000": builder embeds scripts as ModuleScripts to avoid oversized string sources.

### Key endpoints
- Builds: `/api/v1/builds/bootstrap`, `/api/v1/builds/container`, `/api/v1/builds/token`
- Feeding: `/api/v1/feeding/container-ads`
- Impressions: `/api/v1/impressions/batch`
- Ads availability: `/api/v1/games/[gameId]/ads/available`
- Schedules: `/api/v1/schedules`, `/api/v1/schedules/[scheduleId]/deployments`
- Game Ads linking: `/api/v1/game-ads/[adId]/link-games`
