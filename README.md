# New Gen Pulse System

A comprehensive asset management system for Roblox games, featuring modules for managing assets, games, game ads, playlists, and performance tracking.

## Features

- **Assets Manager**: Manage and organize all your assets in one place
- **Games Manager**: Control and monitor your games
- **Game Ads Manager**: Configure and manage game advertisements
- **Playlist Manager**: Organize and schedule game playlists
- **Game Ads Performance**: Track and analyze ad performance metrics

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
