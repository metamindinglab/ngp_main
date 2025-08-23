## Roblox Integration (v2)

### Download builds
- Bootstrap (server-only): GET `/api/v1/builds/bootstrap` with `X-API-Key`, or request a token via POST `/api/v1/builds/token` and use `?token=...`.
- Container (per signage): GET `/api/v1/builds/container?containerId=...&preset=portrait|landscape&mount=ground|wall` (token or API key).

### Install
1. Import Bootstrap.rbxmx and place the `MML` folder under `ServerScriptService`.
2. Import Container.rbxmx models into `Workspace`.
3. Run Test → Start (Local Server). Expect 200s for feeding and impressions.

### Duplicate/Version guard
- Server registry `ServerStorage.MML.Registry` prevents duplicate bootstrap/container installs and supports upgrades by version.

# New Gen Pulse System

A comprehensive asset management system for Roblox games, featuring modules for managing assets, games, game ads, playlists, and performance tracking.

## Features

- **Assets Manager**: Manage and organize all your assets in one place
- **Games Manager**: Control and monitor your games
- **Game Ads Manager**: Configure and manage game advertisements
- **Playlist Manager**: Organize and schedule game playlists
- **Game Ads Performance**: Track and analyze ad performance metrics with optimized loading states and memory management
  - Real-time performance data fetching
  - Efficient memory management with proper cleanup
  - Improved component lifecycle handling
  - AbortController integration for request management

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/mml_roblox_asset_management.git
   cd mml_roblox_asset_management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── dialogs/          # Dialog components
│   ├── display-objects/  # Display components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
└── lib/                  # Utility functions
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Performance Optimization

The system includes several performance optimizations:
- Proper handling of React Strict Mode double-mounting
- Efficient cleanup of intervals and active fetches
- Memory leak prevention through useRef hooks
- Improved loading state management
- Request cancellation using AbortController

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
