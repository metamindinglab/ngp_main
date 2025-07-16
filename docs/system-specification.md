# MML Game Network System Specification

## System Overview

The MML Game Network is a comprehensive advertising platform that enables dynamic ad content delivery in Roblox games. The system consists of multiple components working together to provide seamless ad integration, management, and analytics across three main user types: Game Owners, Brand Users, and Platform Administrators.

## Architecture Components

### 1. Client Layer
- **Web Client**: Browser-based interface for administrators and game owners
- **Game Advertising Portal (GAP)**: Dedicated interface for brand users to create and manage ad campaigns
- **Game Owner Portal**: Interface for game developers to manage their games and ad containers
- **Platform Administration**: System-wide management and oversight interface
- **Roblox Games**: Games integrated with the MML Network via API
- **Roblox Studio**: Development environment with MCP integration for real-time testing

### 2. Backend Services

#### API Layer
- **API Gateway**: Central entry point for all requests with CORS support
- **Authentication & Authorization**: 
  - API key validation for Roblox games (`RBXG-` format)
  - JWT authentication for web users (game owners, brand users, platform admins)
  - Session-based authentication with HTTP-only cookies
  - Rate limiting and access control (100 requests/minute per API key)
- **Middleware**: Request handling, authentication, rate limiting, and CORS management

#### Core Services
- **Game Service**: 
  - Game registration and management
  - API key generation and management (`RBXG-{hash}` format)
  - Game metadata and owner relationships
  - Roblox integration and data fetching
  
- **Asset Service**:
  - Multi-format asset upload and management (images, audio, animations, models, videos)
  - Roblox Cloud API integration for asset publishing
  - Asset type validation and conversion
  - Thumbnail generation and preview systems
  
- **Ad Service**:
  - Game ad campaign management with template support
  - Multi-media display ads, dancing NPC ads, and minigame ads
  - Ad content delivery and scheduling
  - Cross-platform ad serving
  
- **Playlist Service**:
  - Playlist creation and management with scheduling
  - Schedule management with start dates and durations
  - Multi-game deployment coordination
  - Automated content rotation
  
- **Container Service**:
  - Container lifecycle management (DISPLAY, NPC, MINIGAME types)
  - Content delivery orchestration
  - Position and configuration validation
  - Real-time content updates via API
  
- **Engagement Service**:
  - Real-time interaction tracking
  - Performance monitoring and analytics
  - Event-based data collection (view, interaction, completion)
  - Unique engagement ID generation
  
- **Brand User Service**:
  - Brand user registration and profile management
  - Subscription tier management (free trial, starter, professional, enterprise)
  - Campaign creation and optimization tools
  - Access control and feature gating
  
- **Game Owner Service**:
  - Game owner profile management
  - Multi-game management capabilities
  - Access control and permissions
  - API key administration
  
- **Media Service**:
  - Game media management and storage
  - Asset processing and optimization
  - Media approval workflows
  - Thumbnail and preview generation

#### Integration Services
- **Roblox Integration**:
  - Cloud API integration for asset management
  - Games API integration for game data
  - Analytics API integration for performance data
  - Economy API integration for monetization
  - Marketplace API integration for asset publishing
  - Thumbnails API integration for image processing
  
- **MCP (Model Context Protocol) Integration**:
  - Cross-VM communication (Cursor SSH ↔ Azure VM ↔ Roblox Studio Mac)
  - Real-time Roblox Studio integration
  - `insert_model` and `run_code` tools
  - HTTP bridge on port 44755
  - Live testing and development environment
  
- **Analytics Service**:
  - Performance tracking and metrics aggregation
  - Report generation and data visualization
  - Business intelligence and insights
  - Real-time dashboard updates

### 3. Data Layer

#### Database Schema (PostgreSQL)

##### Core Tables
```sql
-- Games and Ownership
CREATE TABLE "Game" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  robloxLink TEXT,
  thumbnail TEXT,
  gameOwnerId TEXT,
  serverApiKey TEXT UNIQUE,
  serverApiKeyStatus TEXT,
  serverApiKeyCreatedAt TIMESTAMP,
  robloxInfo JSONB,
  metrics JSONB,
  dates JSONB,
  owner JSONB,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

CREATE TABLE "GameOwner" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

CREATE TABLE "PlatformAdmin" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Brand Users and Subscriptions
CREATE TABLE "BrandUser" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  companyName TEXT,
  companySize TEXT NOT NULL,
  jobTitle TEXT NOT NULL,
  country TEXT NOT NULL,
  industry TEXT,
  subscriptionTier TEXT DEFAULT 'free_trial',
  subscriptionStatus TEXT DEFAULT 'active',
  subscriptionExpiresAt TIMESTAMP,
  isActive BOOLEAN DEFAULT true,
  emailVerified BOOLEAN DEFAULT false,
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

CREATE TABLE "BrandUserSubscription" (
  id TEXT PRIMARY KEY,
  brandUserId TEXT NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP,
  features JSONB,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Assets and Media
CREATE TABLE "Asset" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT,
  robloxId TEXT,
  creator JSONB,
  metadata JSONB,
  versions JSONB,
  relationships JSONB,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

CREATE TABLE "GameMedia" (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  localPath TEXT NOT NULL,
  thumbnailUrl TEXT,
  gameId TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  approved BOOLEAN DEFAULT true,
  robloxId TEXT,
  altText TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);
```

##### Advertisement Tables
```sql
-- Game Ads and Campaigns
CREATE TABLE "GameAd" (
  id TEXT PRIMARY KEY,
  gameId TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  assets JSONB,
  brandUserId TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

CREATE TABLE "GameAdPerformance" (
  id TEXT PRIMARY KEY,
  gameAdId TEXT NOT NULL,
  gameId TEXT NOT NULL,
  playlistId TEXT,
  date TIMESTAMP NOT NULL,
  metrics JSONB,
  demographics JSONB,
  engagements JSONB,
  playerDetails JSONB,
  timeDistribution JSONB,
  performanceTrends JSONB,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Container System
CREATE TABLE "AdContainer" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  gameId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type AdContainerType NOT NULL,
  position JSONB NOT NULL,
  status AdContainerStatus DEFAULT 'ACTIVE',
  currentAdId TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

CREATE TABLE "AdEngagement" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  containerId TEXT NOT NULL,
  adId TEXT,
  eventType TEXT NOT NULL,
  data JSONB NOT NULL,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Container Types and States
CREATE TYPE AdContainerType AS ENUM ('DISPLAY', 'NPC', 'MINIGAME');
CREATE TYPE AdContainerStatus AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
```

##### Playlist and Scheduling Tables
```sql
CREATE TABLE "Playlist" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  createdBy TEXT,
  metadata JSONB,
  brandUserId TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

CREATE TABLE "PlaylistSchedule" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  playlistId TEXT NOT NULL,
  gameAdId TEXT NOT NULL,
  startDate TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT DEFAULT 'scheduled',
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

CREATE TABLE "GameDeployment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduleId TEXT NOT NULL,
  gameId TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

CREATE TABLE "GameMetricData" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  gameId TEXT NOT NULL,
  metricType MetricType NOT NULL,
  date TIMESTAMP NOT NULL,
  value FLOAT NOT NULL,
  category TEXT,
  breakdown TEXT DEFAULT 'Total',
  series TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);

-- Metric Types
CREATE TYPE MetricType AS ENUM (
  'd1_retention', 'd7_retention', 'd1_stickiness', 'd7_stickiness',
  'daily_active_users', 'average_play_time_minutes', 'average_session_length_minutes',
  'monthly_active_users_by_day', 'demographics_gender', 'demographics_country',
  'demographics_language', 'demographics_age_group'
);
```

## API Endpoints

### Game Integration API (v1)

#### Container Content
```
GET /api/v1/containers/{containerId}/ad
Headers: X-API-Key: RBXG-{hash}

Response:
{
  hasAd: boolean,
  adType: "DISPLAY" | "NPC" | "MINIGAME",
  position: {x: number, y: number, z: number},
  assets: Array<{
    type: string,
    robloxAssetId: string,
    properties: object
  }>,
  config: object
}
```

#### Engagement Tracking
```
POST /api/v1/containers/{containerId}/engagement
Headers: X-API-Key: RBXG-{hash}
Body: {
  eventType: "view" | "interaction" | "completion",
  data: {
    timestamp: string,
    playerId?: string,
    metadata?: object
  }
}
```

### Game Owner API

#### Authentication
```
POST /api/game-owner/auth/login
POST /api/game-owner/auth/register
GET /api/game-owner/auth/me
```

#### Game Management
```
GET /api/games
POST /api/games/{id}  // Generate API key
PUT /api/games/{id}
DELETE /api/games/{id}
```

#### Container Management
```
GET /api/game-owner/containers
POST /api/game-owner/containers
PUT /api/game-owner/containers
DELETE /api/game-owner/containers?id={containerId}
```

### Game Advertising Portal (GAP) API

#### Brand User Authentication
```
POST /api/gap/auth/login
POST /api/gap/auth/register
GET /api/gap/auth/me
```

#### Campaign Management
```
GET /api/gap/ads
POST /api/gap/ads
PUT /api/gap/ads/{id}
DELETE /api/gap/ads/{id}
```

#### Playlist Management
```
GET /api/gap/playlists
POST /api/gap/playlists
PUT /api/gap/playlists/{id}
DELETE /api/gap/playlists/{id}
```

### Platform Administration API

#### User Management
```
GET /api/platform-admin/users
POST /api/platform-admin/users
PUT /api/platform-admin/users/{id}
DELETE /api/platform-admin/users/{id}
```

### Asset Management API

#### Asset Operations
```
GET /api/assets
POST /api/assets
PUT /api/assets/{id}
DELETE /api/assets/{id}
POST /api/roblox/upload-asset
```

## Security Measures

### Authentication Systems
1. **API Key Authentication** (Roblox Games):
   - Format: `RBXG-{32-character-hash}`
   - Scoped to specific games
   - Rate limited (100 requests/minute)
   - Automatic expiration and rotation capabilities

2. **JWT Authentication** (Web Users):
   - Game owners, brand users, platform administrators
   - HTTP-only cookies for session management
   - 7-day expiration with automatic refresh
   - Role-based access control

3. **Session Management**:
   - Secure HTTP-only cookies
   - SameSite protection against CSRF
   - Automatic session cleanup
   - Multi-device session support

### Data Protection
1. **Input Validation**:
   - Zod schema validation on all endpoints
   - File type and size restrictions
   - Position and configuration constraints
   - SQL injection prevention

2. **Access Control**:
   - Game ownership verification
   - Container access restrictions
   - Brand user subscription limits
   - Platform admin role verification

3. **Rate Limiting**:
   - Per-API key limits (100 req/min)
   - Burst allowance and graceful degradation
   - Progressive throttling for abuse detection
   - Service-specific rate limits

## MCP Integration Architecture

### Cross-VM Development Environment
```
┌─────────────────┐    SSH     ┌──────────────────┐    HTTP:44755    ┌──────────────────┐
│     Cursor      │ ◄────────► │   Azure VM       │ ◄──────────────► │  Roblox Studio   │
│   (Local Dev)   │            │  (MCP Server)    │                  │     (Mac)        │
└─────────────────┘            └──────────────────┘                  └──────────────────┘
                                        │
                                        ▼
                                ┌──────────────────┐
                                │   MML API        │
                                │   PostgreSQL     │
                                └──────────────────┘
```

### MCP Tools Available
- **`insert_model`**: Insert marketplace models directly into Roblox Studio
- **`run_code`**: Execute Lua scripts in Studio for testing and setup
- **Real-time testing**: Live ad container testing and validation
- **Cross-platform development**: Seamless development across multiple environments

## User Types and Capabilities

### Game Owners
- **Access**: Game Owner Portal
- **Capabilities**:
  - Register and manage multiple games
  - Generate and manage API keys
  - Create and configure ad containers
  - View basic analytics and engagement data
  - Test ad integration in their games

### Brand Users (GAP)
- **Access**: Game Advertising Portal
- **Subscription Tiers**:
  - **Free Trial**: 5 ads, 1 playlist, basic analytics
  - **Starter**: 25 ads, 5 playlists, advanced analytics
  - **Professional**: 100 ads, unlimited playlists, premium analytics, A/B testing
  - **Enterprise**: Custom limits, dedicated support, white-label options
- **Capabilities**:
  - Create and manage ad campaigns
  - Design multi-media advertisements
  - Schedule and deploy playlists
  - Access detailed performance analytics
  - Target specific games and demographics

### Platform Administrators
- **Access**: Platform Administration interface
- **Capabilities**:
  - Manage all users and accounts
  - System-wide monitoring and analytics
  - Content moderation and approval
  - Platform configuration and maintenance
  - User support and issue resolution

## Performance Considerations

### Caching Strategy
1. **Client-Side Caching**:
   - Asset caching in Roblox games (5-minute TTL)
   - Session storage for dashboard data
   - Browser caching for static assets
   - Optimized asset delivery

2. **Server-Side Caching**:
   - API response caching with Redis
   - Database query optimization with indexes
   - Connection pooling for database efficiency
   - CDN integration for global asset delivery

3. **Real-Time Updates**:
   - Container content polling (configurable intervals)
   - Live dashboard updates via WebSocket
   - Efficient data synchronization
   - Minimal bandwidth usage

### Scalability Features
1. **Database Optimization**:
   - Indexed queries for performance
   - Partitioned tables for large datasets
   - Read replicas for analytics workloads
   - Automated backup and recovery

2. **API Performance**:
   - Rate limiting and throttling
   - Request/response compression
   - Efficient serialization/deserialization
   - Connection pooling and keepalive

## Integration Points

### Roblox Platform Integration
1. **Cloud API Services**:
   - Asset publishing and management
   - Universe and place data retrieval
   - Analytics data collection
   - Economy and monetization features

2. **Studio Integration**:
   - MCP protocol for live development
   - Real-time testing capabilities
   - Asset insertion and manipulation
   - Script execution and debugging

### External Services
1. **Development Tools**:
   - GitHub integration for code management
   - Cursor MCP server for cross-VM development
   - Automated testing and deployment

2. **Analytics and Monitoring**:
   - Performance tracking and alerting
   - User behavior analytics
   - Business intelligence reporting
   - System health monitoring

## Future Considerations

### Planned Features
1. **Enhanced Analytics**:
   - Machine learning-powered insights
   - Predictive performance modeling
   - Advanced demographic analysis
   - Custom reporting and dashboards

2. **Extended Platform Support**:
   - Additional game engines beyond Roblox
   - Mobile app integration
   - VR/AR advertising capabilities
   - Cross-platform campaign management

3. **Advanced Automation**:
   - AI-powered ad optimization
   - Automated A/B testing
   - Dynamic pricing and bidding
   - Smart content recommendation

### Technical Improvements
1. **Microservices Architecture**:
   - Service decomposition for better scalability
   - Independent deployment and scaling
   - Improved fault tolerance
   - Better development team organization

2. **Real-Time Features**:
   - WebSocket-based live updates
   - Real-time collaboration tools
   - Live chat and support integration
   - Instant performance notifications

3. **Security Enhancements**:
   - Enhanced encryption standards
   - Advanced threat detection
   - Compliance with privacy regulations
   - Improved audit logging

## Deployment Architecture

### Current Infrastructure
- **Azure VM**: Primary application server with database
- **Cross-VM Development**: MCP integration for distributed development
- **HTTP Services**: RESTful API with CORS support
- **Database**: PostgreSQL with full ACID compliance

### Monitoring and Maintenance
- **Health Checks**: Automated system monitoring
- **Performance Metrics**: Real-time performance tracking
- **Error Logging**: Comprehensive error tracking and alerting
- **Backup Systems**: Automated data backup and recovery procedures

This specification reflects the current state of the MML Game Network system as of the latest development cycle, incorporating all major features and architectural decisions implemented in the codebase. 