# MML Game Network System Specification

## System Overview

The MML Game Network is a comprehensive advertising platform that enables dynamic ad content delivery in Roblox games. The system consists of multiple components working together to provide seamless ad integration, management, and analytics.

## Architecture Components

### 1. Client Layer
- **Web Client**: Browser-based interface for administrators
- **Game Owner Portal**: Dedicated interface for game owners
- **Roblox Games**: Games integrated with the MML Network

### 2. Backend Services

#### API Layer
- **API Gateway**: Central entry point for all requests
- **Authentication & Authorization**: 
  - API key validation for games
  - JWT authentication for game owners
  - Rate limiting and access control
- **JSON Auth Service**: Handles game owner authentication

#### Core Services
- **Game Service**: 
  - Game registration and management
  - API key management
  - Game metadata handling
  
- **Asset Service**:
  - Asset upload and management
  - Asset type validation
  - Asset relationship handling
  
- **Ad Service**:
  - Ad campaign management
  - Ad content delivery
  - Ad scheduling
  
- **Playlist Service**:
  - Playlist creation and management
  - Schedule management
  - Deployment coordination
  
- **Container Service**:
  - Container lifecycle management
  - Content delivery orchestration
  - Position and configuration validation
  
- **Engagement Service**:
  - Interaction tracking
  - Performance monitoring
  - Analytics aggregation
  
- **Game Owner Service**:
  - Game owner profile management
  - Access control
  - Settings management
  
- **Media Service**:
  - Game media management
  - Asset processing
  - Media storage coordination

#### Integration Services
- **Roblox Integration**:
  - Cloud API integration
  - Games API integration
  - Economy API integration
  - Marketplace API integration
  
- **Thumbnail Service**:
  - Thumbnail generation
  - Image processing
  - Cache management
  
- **Analytics Service**:
  - Performance tracking
  - Metrics aggregation
  - Report generation

### 3. Data Layer

#### Database Tables

##### Core Tables
```sql
CREATE TABLE "Game" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  robloxLink VARCHAR(255),
  gameOwnerId UUID NOT NULL,
  serverApiKey VARCHAR(255),
  serverApiKeyStatus VARCHAR(50),
  metrics JSONB,
  owner JSONB,
  dates JSONB,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE TABLE "GameOwner" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  authType VARCHAR(50),
  profile JSONB,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE TABLE "GameMedia" (
  id UUID PRIMARY KEY,
  gameId UUID NOT NULL,
  type VARCHAR(50),
  title VARCHAR(255),
  localPath VARCHAR(255),
  remoteUrl VARCHAR(255),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (gameId) REFERENCES "Game"(id)
);
```

##### Advertisement Tables
```sql
CREATE TABLE "AdContainer" (
  id UUID PRIMARY KEY,
  gameId UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  position JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  currentAdId UUID,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (gameId) REFERENCES "Game"(id)
);

CREATE TABLE "GameAd" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  assets JSONB,
  status VARCHAR(50),
  metadata JSONB,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE TABLE "AdEngagement" (
  id UUID PRIMARY KEY,
  containerId UUID NOT NULL,
  adId UUID,
  eventType VARCHAR(50) NOT NULL,
  data JSONB,
  createdAt TIMESTAMP,
  FOREIGN KEY (containerId) REFERENCES "AdContainer"(id)
);
```

##### Playlist Management Tables
```sql
CREATE TABLE "Playlist" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  createdBy VARCHAR(255),
  metadata JSONB,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE TABLE "PlaylistSchedule" (
  id UUID PRIMARY KEY,
  playlistId UUID NOT NULL,
  gameAdId UUID NOT NULL,
  startDate TIMESTAMP,
  duration INTEGER,
  status VARCHAR(50),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (playlistId) REFERENCES "Playlist"(id),
  FOREIGN KEY (gameAdId) REFERENCES "GameAd"(id)
);

CREATE TABLE "GameDeployment" (
  id UUID PRIMARY KEY,
  scheduleId UUID NOT NULL,
  gameId UUID NOT NULL,
  status VARCHAR(50),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (scheduleId) REFERENCES "PlaylistSchedule"(id),
  FOREIGN KEY (gameId) REFERENCES "Game"(id)
);

CREATE TABLE "RemovableAsset" (
  id UUID PRIMARY KEY,
  assetId VARCHAR(255),
  type VARCHAR(50),
  status VARCHAR(50),
  scheduledDate TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

## API Endpoints

### Game Integration API (v1)

#### Container Content
```
GET /api/v1/containers/{containerId}/ad
Authorization: Bearer {API_KEY}

Response:
{
  hasAd: boolean,
  adType: string,
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
Authorization: Bearer {API_KEY}
Body: {
  eventType: string,
  data: object
}
```

### Game Owner API

#### Container Management
```
GET /api/game-owner/containers
POST /api/game-owner/containers
PUT /api/game-owner/containers
DELETE /api/game-owner/containers?id={containerId}
```

#### Playlist Management
```
GET /api/playlists
POST /api/playlists
PUT /api/playlists/{id}
DELETE /api/playlists/{id}
```

#### Game Management
```
GET /api/games
POST /api/games
PUT /api/games/{id}
DELETE /api/games/{id}
```

## Security Measures

1. **Authentication**:
   - API key-based authentication for games
   - JWT-based authentication for game owners
   - Rate limiting per API key
   - JSON Auth Service for secure token management

2. **Data Validation**:
   - Input validation using Zod schemas
   - Position and size constraints
   - Asset type verification
   - Request sanitization

3. **Access Control**:
   - Game ownership verification
   - Container access restrictions
   - Rate limiting and quota management
   - Role-based access control

## Performance Considerations

1. **Caching Strategy**:
   - Asset caching in Roblox
   - API response caching
   - Database query optimization
   - In-memory cache for frequent requests

2. **Rate Limiting**:
   - Per-game limits
   - Burst allowance
   - Graduated throttling
   - Service-specific limits

3. **Asset Optimization**:
   - Asset size limits
   - Format optimization
   - Lazy loading
   - Compression strategies

## Monitoring and Analytics

1. **System Metrics**:
   - API response times
   - Error rates
   - Resource utilization
   - Cache performance

2. **Business Metrics**:
   - Active containers
   - Engagement rates
   - Asset performance
   - Deployment success rates

3. **Game Metrics**:
   - Container load times
   - Player interactions
   - Asset render performance
   - Network latency

## Integration Points

1. **Roblox APIs**:
   - Cloud API: Asset management
   - Games API: Game data
   - Analytics API: Performance data
   - Economy API: Transaction handling
   - Marketplace API: Asset publishing
   - Thumbnails API: Image processing

2. **External Services**:
   - Authentication providers
   - Storage services
   - CDN integration
   - Analytics platforms

## Future Considerations

1. **Scalability**:
   - Horizontal scaling
   - Load balancing
   - Database sharding
   - Microservices architecture

2. **Features**:
   - Additional container types
   - Advanced analytics
   - A/B testing support
   - Machine learning integration

3. **Integration**:
   - Additional game engines
   - Extended API capabilities
   - Enhanced monitoring
   - Automated deployment 