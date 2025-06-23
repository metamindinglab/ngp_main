# Roblox Asset Management System - Application Structure & Functionality

## 1. Application Overview

The Roblox Asset Management System is a comprehensive Next.js web application designed to manage Roblox games, assets, and advertising campaigns. It provides a modern, responsive interface for asset management with direct integration to Roblox's API.

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives with custom styling
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization

### Backend
- **Runtime**: Node.js with Next.js API routes
- **File Handling**: Formidable for multipart form data
- **HTTP Client**: Node-fetch for external API calls
- **Data Storage**: JSON-based file system (ready for database migration)

### Development Tools
- **Linting**: ESLint with Next.js configuration
- **Type Checking**: TypeScript
- **Git Hooks**: Husky for pre-commit hooks
- **Package Manager**: npm

## 3. Application Architecture

### 3.1 Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── games/         # Game management endpoints
│   │   ├── assets/        # Asset management endpoints
│   │   ├── game-ads/      # Advertisement endpoints
│   │   ├── playlists/     # Playlist management
│   │   ├── roblox/        # Roblox integration
│   │   └── auth/          # Authentication
│   ├── dashboard/         # Dashboard pages
│   │   ├── games/         # Games management UI
│   │   ├── assets/        # Assets management UI
│   │   ├── game-ads/      # Ads management UI
│   │   └── playlists/     # Playlist management UI
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   ├── games/           # Game management components
│   ├── assets/          # Asset management components
│   ├── game-ads/        # Advertisement components
│   └── playlists/       # Playlist components
├── types/               # TypeScript type definitions
├── lib/                 # Utility functions
└── constants/           # Application constants
```

### 3.2 Data Flow Architecture
```
Frontend (React) → API Routes (Next.js) → JSON Files → Roblox API
     ↑                    ↓                    ↓           ↓
   State Management ← Response Handling ← Data Processing ← External Data
```

## 4. Core Features & Functionality

### 4.1 Dashboard System
The main dashboard (`/dashboard`) serves as the central hub with navigation cards to different management modules:

- **Games Manager**: Manage Roblox games and their configurations
- **Assets Manager**: Upload and manage game assets
- **Game Ads Manager**: Create and manage advertisements
- **Playlist Manager**: Organize assets into collections
- **Performance Analytics**: View ad performance metrics

### 4.2 Game Management
**Location**: `/dashboard/games`

**Features**:
- View all registered games with search and filtering
- Add new games with comprehensive metadata
- Edit game information and metrics
- Delete games with confirmation
- View detailed game information in modal dialogs
- Geographic player distribution tracking
- Game performance metrics (DAU, MAU, retention)

**API Endpoints**:
- `GET /api/games` - Retrieve all games
- `POST /api/games` - Create new game
- `PUT /api/games` - Update existing game
- `DELETE /api/games?id={id}` - Delete game

### 4.3 Asset Management
**Location**: `/dashboard/assets`

**Features**:
- Upload new assets to Roblox
- Support for multiple asset types (Model, Audio, Image, Animation, etc.)
- Asset metadata management
- Version control for assets
- Asset relationships and tagging
- Preview and thumbnail generation
- Integration with Roblox catalog

**Supported Asset Types**:
- **Models**: .rbxm, .rbx files
- **Audio**: .mp3, .ogg files
- **Images**: .png, .jpg, .jpeg files
- **Animations**: .fbx, .rbxm files
- **Videos**: .mp4 files
- **Clothing**: .rbxm, .rbx files

**API Endpoints**:
- `GET /api/assets` - Retrieve all assets
- `POST /api/assets` - Create new asset record
- `POST /api/roblox/upload` - Upload asset to Roblox
- `PUT /api/roblox/update-asset` - Update asset on Roblox
- `DELETE /api/roblox/delete-asset` - Delete asset from Roblox

### 4.4 Game Advertising
**Location**: `/dashboard/game-ads`

**Features**:
- Create advertising campaigns
- Set targeting parameters (geography, age groups, platforms)
- Schedule ad campaigns
- Track performance metrics
- View analytics and reports
- Manage ad creative assets

**Performance Tracking**:
- Impressions and click-through rates
- Conversion tracking
- Geographic performance analysis
- Time-based performance trends

### 4.5 Playlist Management
**Location**: `/dashboard/playlists`

**Features**:
- Create asset collections
- Organize assets by category or theme
- Set playlist visibility and permissions
- Manage asset ordering within playlists
- Tag-based organization

## 5. Roblox Integration

### 5.1 API Integration
The system integrates with Roblox's API for:
- Asset upload and management
- Game information retrieval
- Thumbnail generation
- Catalog management
- Group and user information

### 5.2 Authentication
- API key-based authentication for Roblox
- OAuth support for user authentication
- Secure credential storage
- Token refresh and validation

### 5.3 Asset Upload Process
1. **File Validation**: Check file type and size
2. **Metadata Collection**: Gather asset information
3. **Roblox Upload**: Upload to Roblox API
4. **Local Database**: Store asset record locally
5. **Thumbnail Generation**: Create preview images
6. **Relationship Mapping**: Link to games and playlists

## 6. User Interface Design

### 6.1 Design System
- **Color Scheme**: Indigo, purple, and slate gradients
- **Typography**: Inter font family
- **Components**: Custom-built with Radix UI primitives
- **Animations**: Smooth hover effects and transitions
- **Responsive**: Mobile-first design approach

### 6.2 Component Architecture
- **Atomic Design**: Reusable UI components
- **Form Components**: Consistent form handling
- **Modal Dialogs**: Detailed information display
- **Data Tables**: Sortable and filterable data display
- **Charts**: Performance visualization

### 6.3 User Experience
- **Intuitive Navigation**: Clear dashboard structure
- **Real-time Feedback**: Toast notifications for actions
- **Loading States**: Visual feedback during operations
- **Error Handling**: Graceful error messages
- **Search & Filter**: Quick data access

## 7. Data Management

### 7.1 JSON Database Structure
The application uses JSON files for data storage:
- `games.json`: Game information and metrics
- `assets.json`: Asset metadata and relationships
- `game-ads.json`: Advertising campaign data
- `playlists.json`: Asset collection management
- `game-ad-performance.json`: Performance metrics

### 7.2 Data Validation
- **Zod Schemas**: Runtime type validation
- **TypeScript**: Compile-time type checking
- **Form Validation**: Client-side validation
- **API Validation**: Server-side validation

### 7.3 Data Relationships
- Games ↔ Assets (many-to-many)
- Assets ↔ Playlists (many-to-many)
- Games ↔ Advertisements (one-to-many)
- Users ↔ Assets (ownership)

## 8. Security & Performance

### 8.1 Security Features
- **Input Validation**: All user inputs validated
- **File Upload Security**: Type and size restrictions
- **API Key Management**: Secure credential handling
- **CORS Configuration**: Proper cross-origin settings

### 8.2 Performance Optimizations
- **Lazy Loading**: Component-level code splitting
- **Image Optimization**: Next.js image optimization
- **Caching**: API response caching
- **Bundle Optimization**: Tree shaking and minification

## 9. Development Workflow

### 9.1 Code Organization
- **Feature-based Structure**: Components organized by feature
- **Type Safety**: Comprehensive TypeScript usage
- **Component Reusability**: Shared UI components
- **API Abstraction**: Centralized API handling

### 9.2 Testing Strategy
- **Type Checking**: TypeScript compilation
- **Linting**: ESLint for code quality
- **Git Hooks**: Pre-commit validation
- **Manual Testing**: Feature validation

### 9.3 Deployment
- **Build Process**: Next.js build optimization
- **Environment Configuration**: Environment-specific settings
- **Static Assets**: Optimized asset delivery
- **API Routes**: Serverless function deployment

## 10. Future Enhancements

### 10.1 Planned Features
- **Database Migration**: Move from JSON to PostgreSQL
- **Real-time Updates**: WebSocket integration
- **Advanced Analytics**: Enhanced reporting
- **Bulk Operations**: Batch asset management
- **API Rate Limiting**: Improved API management

### 10.2 Scalability Improvements
- **Caching Layer**: Redis integration
- **CDN Integration**: Global asset delivery
- **Microservices**: Service decomposition
- **Monitoring**: Application performance monitoring

This comprehensive structure provides a solid foundation for managing Roblox assets and games, with clear separation of concerns and extensible architecture for future enhancements. 