# Roblox Game Asset Management API Specification

**Base URL**: `http://23.96.197.67:3000/api/v1`

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

## Example Roblox Implementation

```lua
local HttpService = game:GetService("HttpService")
local BASE_URL = "http://23.96.197.67:3000/api/v1"
local API_KEY = "RBXG-your-api-key"
local token = nil

-- Authentication function
local function authenticate()
    local response = HttpService:RequestAsync({
        Url = BASE_URL .. "/authenticate",
        Method = "POST",
        Headers = {
            ["Content-Type"] = "application/json"
        },
        Body = HttpService:JSONEncode({
            api_key = API_KEY
        })
    })
    
    if response.Success then
        local data = HttpService:JSONDecode(response.Body)
        token = data.token
        return true
    end
    return false
end

-- Create a display object
local function createDisplayObject(gameId, assetId, assetType, position)
    if not token then
        authenticate()
    end
    
    local response = HttpService:RequestAsync({
        Url = BASE_URL .. "/game/" .. gameId .. "/display",
        Method = "POST",
        Headers = {
            ["Authorization"] = "Bearer " .. token,
            ["Content-Type"] = "application/json"
        },
        Body = HttpService:JSONEncode({
            asset_id = assetId,
            asset_type = assetType,
            position = position or {x = 0, y = 0, z = 0}
        })
    })
    
    if response.Success then
        return HttpService:JSONDecode(response.Body)
    end
    return nil
end

-- Example usage
local success = authenticate()
if success then
    local result = createDisplayObject(
        "game123",
        "asset456",
        "image",
        {x = 10, y = 5, z = 10}
    )
    if result then
        print("Created display object with ID:", result.display_id)
    end
end
```

All endpoints require authentication via Bearer token, which must be obtained through the `/authenticate` endpoint first. Error responses include appropriate HTTP status codes and error messages in the response body.

The server is running on port 3000, and based on the logs, it's using Next.js 14.2.16. All requests should include appropriate headers, especially the `Authorization` header with the Bearer token for authenticated endpoints.

