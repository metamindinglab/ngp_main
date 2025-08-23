### v2 (2025-08-23)

- Bootstrap/Container rbxmx builds with token-based downloads
  - POST `/api/v1/builds/token` → signed short-lived token
  - GET `/api/v1/builds/bootstrap?token=...`
  - GET `/api/v1/builds/container?containerId=...&token=...`
- Container builder presets and panel creation
  - `preset=portrait|landscape`, `mount=ground|wall`
  - Server-side setup creates `Panel` part with appropriate size/orientation when missing
- Full MML Roblox flow re-enabled with debug logging
  - Server bootstrap initializes `_G.MMLNetwork` and `_G.MMLImpressionTracker`
  - `MMLRequestManager` normalized payloads and re-enabled impression batching
  - `MMLContainerStreamer` proximity/view detection with view_start/view_end events
  - `MMLContainerManager` summary normalization (`position` as `{x,y,z}`, string-keyed `impressionsByAd`)
- API fixes
  - `/api/v1/feeding/container-ads` pre-Zod payload normalization for Roblox tables
  - `/api/v1/impressions/batch` extended schema (player details, distribution, trends)
  - `/api/v1/games/[gameId]/ads/available` schedule filtering improvements
- Docs
  - README: v2 install, token flow, duplicate/version guard


