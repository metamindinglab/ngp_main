# Roblox Game Asset Management API Specification

**Base URL**: `http://23.96.197.67:3000/api/v1`

## Getting Started

1. **Register Your Game:** Ensure your game is added to the system by an admin or through the dashboard. Each game entry will have an owner and related information in the Game table.
2. **Generate API Key:** Use the API to generate a unique API key for your game (see below).
3. **Authenticate:** Use your API key to obtain a Bearer token for secure access to all endpoints.
4. **Make Authenticated Requests:** Include the Bearer token in the Authorization header for all API calls.

## API Key Generation

To generate (or rotate) an API key for your game, use the following endpoint. Only the game owner (or admin) should be allowed to call this endpoint.

```
POST /games/{game_id}
```

**Description:** Generates a new API key for the specified game. The new key will replace any existing key for that game.

**Response (200 OK):**
```
{
  "apiKey": "RBXG-..."
}
```

**Security Note:**
- Treat your API key like a password. Do not share it publicly or commit it to source control.
- If your key is compromised, generate a new one immediately.

## Authentication

### Authenticate Game
```
POST /authenticate
Content-Type: application/json

Request Body:
{
    "api_key": string  // Format: "RBXG-..." 
}

Response (200 OK):
{
    "token": string    // Bearer token for subsequent requests
}

Response (401 Unauthorized):
{
    "error": "Invalid API key"
}
```

**Instructions:**
- Use the API key generated for your game to authenticate.
- The returned token must be included in the Authorization header for all subsequent requests:
  `Authorization: Bearer {token}`

## Display Objects API

### Create Display Object
```
POST /game/{game_id}/display
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
    "asset_id": string,          // Required: UGC asset ID
    "asset_type": string,        // Required: "image" or "video"
    "position": {                // Optional, defaults to {x:0, y:0, z:0}
        "x": number,
        "y": number,
        "z": number
    }
}

Response (200 OK):
{
    "status": "success",
    "display_id": string
}

Response (400 Bad Request):
{
    "error": "Missing required parameters: asset_id and asset_type"
}
```

### List Display Objects
```
GET /game/{game_id}/display
Authorization: Bearer {token}

Response (200 OK):
{
    "displays": [
        {
            "display_id": string,
            "asset_id": string,
            "asset_type": string,    // "image" or "video"
            "position": {
                "x": number,
                "y": number,
                "z": number
            }
        }
    ]
}
```

### Get Single Display Object
```
GET /game/{game_id}/display/{display_id}
Authorization: Bearer {token}

Response (200 OK):
{
    "display_id": string,
    "asset_id": string,
    "asset_type": string,    // "image" or "video"
    "position": {
        "x": number,
        "y": number,
        "z": number
    }
}

Response (404 Not Found):
{
    "error": "Display object not found"
}
```

### Update Display Object
```
PUT /game/{game_id}/display/{display_id}
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
    "asset_id": string,      // Optional
    "asset_type": string,    // Optional: "image" or "video"
    "position": {            // Optional
        "x": number,
        "y": number,
        "z": number
    }
}

Response (200 OK):
{
    "status": "success"
}

Response (404 Not Found):
{
    "error": "Display object not found"
}
```

### Delete Display Object
```
DELETE /game/{game_id}/display/{display_id}
Authorization: Bearer {token}

Response (200 OK):
{
    "status": "success"
}

Response (404 Not Found):
{
    "error": "Display object not found"
}
```

## Game Ads API

### List Game Ads
```
GET /api/game-ads
Content-Type: application/json

Query Parameters:
{
    "page": number,      // Optional: Page number for pagination (default: 1)
    "search": string,    // Optional: Search term to filter by name
    "status": string,    // Optional: Filter by status
    "gameId": string     // Optional: Filter by game ID
}

Response (200 OK):
{
    "gameAds": [
        {
            "id": string,
            "name": string,
            "templateType": string,
            "gameId": string,
            "status": string,
            "schedule": object | null,
            "targeting": object | null,
            "metrics": object | null,
            "assets": [
                {
                    "assetType": string,
                    "assetId": string,
                    "robloxAssetId": string
                }
            ],
            "createdAt": string,
            "updatedAt": string,
            "game": {
                "id": string,
                "name": string,
                "thumbnail": string | null
            } | null,
            "performance": {
                "impressions": number,
                "clicks": number,
                "conversions": number
            } | null
        }
    ],
    "total": number,
    "page": number,
    "totalPages": number
}

Response (500 Internal Server Error):
{
    "error": "Failed to load game ads"
}
```

### Create Game Ad
```
POST /api/game-ads
Content-Type: application/json

Request Body:
{
    "name": string,              // Required: Name of the game ad
    "templateType": string,      // Required: Type of template to use
    "gameId": string,           // Optional: ID of the game (default: "game_001")
    "status": string,           // Optional: Status of the ad (default: "active")
    "schedule": object | null,  // Optional: Scheduling information
    "targeting": object | null, // Optional: Targeting criteria
    "metrics": object | null,   // Optional: Custom metrics
    "assets": [                 // Required: At least one asset
        {
            "assetType": string,    // Required: Type of asset
            "assetId": string,      // Required: Asset ID
            "robloxAssetId": string // Required: Roblox Asset ID
        }
    ]
}

Response (200 OK):
{
    "id": string,
    "name": string,
    "templateType": string,
    "gameId": string,
    "status": string,
    "schedule": object | null,
    "targeting": object | null,
    "metrics": object | null,
    "assets": array,
    "createdAt": string,
    "updatedAt": string,
    "game": {
        "id": string,
        "name": string,
        "thumbnail": string | null
    } | null
}

Response (400 Bad Request):
{
    "error": "Validation failed",
    "details": array // Validation error details
}

Response (409 Conflict):
{
    "error": "A game ad with this name already exists"
}

Response (500 Internal Server Error):
{
    "error": "Failed to create game ad"
}
```

### Get Game Ad
```
GET /api/game-ads/{id}
Content-Type: application/json

Response (200 OK):
{
    "id": string,
    "name": string,
    "templateType": string,
    "gameId": string,
    "status": string,
    "schedule": object | null,
    "targeting": object | null,
    "metrics": object | null,
    "assets": array,
    "createdAt": string,
    "updatedAt": string,
    "game": {
        "id": string,
        "name": string,
        "thumbnail": string | null
    } | null,
    "performance": {
        "impressions": number,
        "clicks": number,
        "conversions": number
    } | null
}

Response (404 Not Found):
{
    "error": "Game ad not found"
}

Response (500 Internal Server Error):
{
    "error": "Failed to load game ad"
}
```

### Update Game Ad
```
PUT /api/game-ads/{id}
Content-Type: application/json

Request Body:
{
    "name": string,              // Required: Name of the game ad
    "templateType": string,      // Required: Type of template to use
    "status": string,           // Optional: Status of the ad
    "schedule": object | null,  // Optional: Scheduling information
    "targeting": object | null, // Optional: Targeting criteria
    "metrics": object | null,   // Optional: Custom metrics
    "assets": [                 // Required: At least one asset
        {
            "assetType": string,    // Required: Type of asset
            "assetId": string,      // Required: Asset ID
            "robloxAssetId": string // Required: Roblox Asset ID
        }
    ]
}

Response (200 OK):
{
    "id": string,
    "name": string,
    "templateType": string,
    "gameId": string,
    "status": string,
    "schedule": object | null,
    "targeting": object | null,
    "metrics": object | null,
    "assets": array,
    "createdAt": string,
    "updatedAt": string,
    "game": {
        "id": string,
        "name": string,
        "thumbnail": string | null
    } | null,
    "performance": {
        "impressions": number,
        "clicks": number,
        "conversions": number
    } | null
}

Response (400 Bad Request):
{
    "error": "Validation failed",
    "details": array // Validation error details
}

Response (404 Not Found):
{
    "error": "Game ad not found"
}

Response (409 Conflict):
{
    "error": "A game ad with this name already exists"
}

Response (500 Internal Server Error):
{
    "error": "Failed to update game ad"
}
```

### Delete Game Ad
```
DELETE /api/game-ads/{id}
Content-Type: application/json

Response (200 OK):
{
    "success": true
}

Response (404 Not Found):
{
    "error": "Game ad not found"
}

Response (500 Internal Server Error):
{
    "error": "Failed to delete game ad"
}
```

## Example Roblox Implementation

```