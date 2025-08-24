# Roblox Game Asset Management API Specification

**Base URL**: `http://23.96.197.67:3000/api/v1`

## Getting Started

### Step 1: Register Your Game
Ensure your game is added to the system by an admin through the Game Manager dashboard. Each game entry will include owner information and be stored in the Game table.

### Step 2: Generate API Key
1. Log into the Game Manager UI at `/dashboard/games`
2. Find your game in the list
3. Click the "Generate API Key" button in the API Access section
4. Copy the generated API key (format: `RBXG-{random-hash}`)
5. Store this key securely - it will be needed for all API calls

### Step 3: Authenticate Your Requests
**For Roblox Games:** Use your API key directly in the `X-API-Key` header - no Bearer token needed!

### Step 4: Make API Calls
Include your API key in the `X-API-Key` header for all API calls from Roblox games.

## API Key Management

### Generate API Key for Game
**Endpoint:** `POST /api/games/{gameId}`  
**Description:** Generates a new API key for the specified game. This will replace any existing API key.

**Request:**
```bash
curl -X POST "http://23.96.197.67:3000/api/games/game_001" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "apiKey": "RBXG-425076abd22784d8a68292c568b3d844303833a12fe48f4f",
  "apiKeyCreatedAt": "2024-01-15T10:30:00.000Z",
  "apiKeyStatus": "active"
}
```

**Security Note:** 
- API keys should be kept secure and not shared
- Regenerate keys if compromised
- Only game owners (or admins) can generate keys for their games
- Keys are unique and linked to specific games

## Authentication Flow

### Direct API Key Authentication (Recommended for Roblox Games)
**Description:** Use your API key directly in requests - no separate authentication step needed!

**Roblox Example:**
```lua
local HttpService = game:GetService("HttpService")

local response = HttpService:RequestAsync({
    Url = "http://23.96.197.67:3000/api/game-ads",
    Method = "GET",
    Headers = {
        ["X-API-Key"] = "RBXG-your-api-key-here",
        ["Content-Type"] = "application/json"
    }
})
```

## API Endpoints

### Games API

#### List Games
**GET** `/api/games`
- **Authentication:** Optional (public access) or Required (for game-specific data)
- **Headers:** `X-API-Key: RBXG-your-api-key` (optional)

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "id": "game_001",
      "name": "Adopt Me!",
      "description": "Play with friends and adopt pets!",
      "genre": "Social",
      "thumbnail": "https://example.com/thumb.jpg",
      "serverApiKeyStatus": "active",
      "serverApiKeyCreatedAt": "2024-01-15T10:30:00.000Z",
      "owner": {
        "name": "John Doe",
        "email": "john@example.com",
        "country": "USA"
      },
      "metrics": {
        "dau": 1000000,
        "mau": 5000000,
        "day1Retention": 85
      }
    }
  ]
}
```

#### Get Single Game
**GET** `/api/games/{gameId}`
- **Authentication:** Required (Bearer token or API key)

**Response:** Returns detailed game information including API key status (but not the actual key for security).

#### Update Game
**PUT** `/api/games/{gameId}`
- **Authentication:** Required
- **Authorization:** Only game owner or admin

**Request Body:**
```json
{
  "name": "Updated Game Name",
  "description": "Updated description",
  "genre": "Adventure"
}
```

---

### Game Ads API

#### List Game Ads
**GET** `/api/game-ads`
- **Authentication:** Required (Roblox games)
- **Headers:** `X-API-Key: RBXG-your-api-key`
- **Query Parameters:**
  - `page`, `search`, `status` (gameId determined from API key)
- **Rate Limit:** 100 requests/minute

**Response:**
```json
{
  "success": true,
  "gameId": "game_001",
  "gameAds": [
    {
      "id": "ad_001",
      "name": "Summer Campaign",
      "status": "active",
      "assets": [
        {
          "assetType": "image",
          "robloxAssetId": "12345"
        }
      ]
    }
  ]
}
```

#### Create Game Ad
**POST** `/api/game-ads`
- **Authentication:** Required

**Request:**
```json
{
  "name": "Summer Campaign",
  "templateType": "multimedia_display",
  "gameId": "game_001",
  "assets": [
    {
      "assetType": "image",
      "assetId": "asset_001",
      "robloxAssetId": "rbx_12345"
    }
  ]
}
```

---

### Assets API

#### List Assets
**GET** `/api/assets`
- **Authentication:** Required
- **Query Parameters:** `page`, `search`, `type`

#### Upload Asset
**POST** `/api/assets`
- **Authentication:** Required
- **Content-Type:** `multipart/form-data`

---

### Playlists API

#### List Playlists
**GET** `/api/playlists`
- **Authentication:** Required

#### Create Playlist
**POST** `/api/playlists`
- **Authentication:** Required

**Request:**
```json
{
  "name": "Weekly Campaign",
  "description": "Campaign for this week",
  "type": "standard"
}
```

---

## Error Handling

The API uses conventional HTTP response codes:

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (missing or invalid authentication)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **500** - Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

## Rate Limiting

- **Rate Limit:** 100 requests per minute per API key
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Best Practices

1. **API Key Security:**
   - Store API keys securely (environment variables, secure config)
   - Never expose API keys in client-side code
   - Rotate keys regularly
   - Use HTTPS for all API calls

2. **Error Handling:**
   - Always check response status codes
   - Implement proper retry logic for 5xx errors
   - Handle rate limiting gracefully

3. **Data Validation:**
   - Validate all input data before sending
   - Follow the specified data formats
   - Use proper content types

4. **Performance:**
   - Use pagination for large datasets
   - Cache responses when appropriate
   - Use efficient search/filter parameters

## SDK and Code Examples

### JavaScript/Node.js
```javascript
const apiKey = 'RBXG-your-api-key-here';
const baseUrl = 'http://23.96.197.67:3000/api';

// Get games list
async function getGames() {
  const response = await fetch(`${baseUrl}/games`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

// Generate API key (admin/owner only)
async function generateApiKey(gameId) {
  const response = await fetch(`${baseUrl}/games/${gameId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

### Python
```python
import requests

api_key = 'RBXG-your-api-key-here'
base_url = 'http://23.96.197.67:3000/api'

# Authenticate and get token
def authenticate():
    response = requests.post(f'{base_url}/authenticate', 
                           json={'api_key': api_key})
    return response.json()['token']

# Get games list
def get_games():
    token = authenticate()
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{base_url}/games', headers=headers)
    return response.json()
```

## Support

For API support, please contact the development team or refer to the Game Manager UI documentation.