import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Roblox Open Cloud API endpoints for testing permissions
const ROBLOX_ENDPOINTS = {
  // Asset endpoints
  ASSETS: 'https://apis.roblox.com/assets/v1',
  // Data store endpoints  
  DATASTORES: 'https://apis.roblox.com/datastores/v1',
  // Universes endpoints
  UNIVERSES: 'https://apis.roblox.com/universes/v1',
  // Messaging endpoints
  MESSAGING: 'https://apis.roblox.com/messaging-service/v1',
  // Places endpoints
  PLACES: 'https://apis.roblox.com/universes/v1',
  // Analytics endpoints (if available)
  ANALYTICS: 'https://apis.roblox.com/analytics/v1'
};

interface RobloxApiCapability {
  feature: string;
  permission: string;
  accessible: boolean;
  error?: string;
  details?: any;
}

interface RobloxApiVerificationResult {
  isValid: boolean;
  apiKey: string;
  universeId?: string;
  capabilities: RobloxApiCapability[];
  summary: {
    totalPermissions: number;
    accessiblePermissions: number;
    restrictedPermissions: number;
  };
  error?: string;
}

// Test different API endpoints to determine permissions
async function testApiKeyPermissions(apiKey: string, universeId?: string): Promise<RobloxApiCapability[]> {
  const capabilities: RobloxApiCapability[] = [];
  
  // Test 1: Basic API key validation (try to access universes)
  try {
    const response = await fetch(`${ROBLOX_ENDPOINTS.UNIVERSES}/universes`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    capabilities.push({
      feature: 'Universes',
      permission: 'universe:read',
      accessible: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      details: response.ok ? await response.json().catch(() => null) : null
    });
  } catch (error) {
    capabilities.push({
      feature: 'Universes',
      permission: 'universe:read',
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 2: Asset management permissions
  try {
    const response = await fetch(`${ROBLOX_ENDPOINTS.ASSETS}/assets`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    capabilities.push({
      feature: 'Assets',
      permission: 'asset:read',
      accessible: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    });
  } catch (error) {
    capabilities.push({
      feature: 'Assets',
      permission: 'asset:read',
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 3: Data store permissions (if universeId provided)
  if (universeId) {
    try {
      const response = await fetch(`${ROBLOX_ENDPOINTS.DATASTORES}/universes/${universeId}/standard-datastores`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      capabilities.push({
        feature: 'DataStores',
        permission: 'universe.datastore:read',
        accessible: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      });
    } catch (error) {
      capabilities.push({
        feature: 'DataStores',
        permission: 'universe.datastore:read',
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Messaging service permissions
    try {
      // Note: We can't actually test messaging without sending a message, 
      // so we'll try to access the endpoint and see if we get permission errors
      const response = await fetch(`${ROBLOX_ENDPOINTS.MESSAGING}/universes/${universeId}/topics/test-topic/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'test-verification-message'
        })
      });
      
      // Even if the message fails, we can determine if we have permission based on the error
      const accessible = response.status !== 401 && response.status !== 403;
      
      capabilities.push({
        feature: 'Messaging',
        permission: 'universe.messaging-service:publish',
        accessible,
        error: accessible ? undefined : `HTTP ${response.status}: ${response.statusText}`
      });
    } catch (error) {
      capabilities.push({
        feature: 'Messaging',
        permission: 'universe.messaging-service:publish',
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Place publishing permissions
    try {
      const response = await fetch(`${ROBLOX_ENDPOINTS.PLACES}/universes/${universeId}/places`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      capabilities.push({
        feature: 'Places',
        permission: 'universe.place:read',
        accessible: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      });
    } catch (error) {
      capabilities.push({
        feature: 'Places',
        permission: 'universe.place:read',
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return capabilities;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { apiKey, universeId } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key is required' 
      }, { status: 400 });
    }

    // Validate API key format (Roblox API keys typically start with specific patterns)
    if (!apiKey.match(/^[a-zA-Z0-9_-]+$/)) {
      return NextResponse.json({ 
        error: 'Invalid API key format' 
      }, { status: 400 });
    }

    // Test the API key permissions
    const capabilities = await testApiKeyPermissions(apiKey, universeId);
    
    // Determine if the API key is valid based on at least one successful permission
    const isValid = capabilities.some(cap => cap.accessible);
    
    // Calculate summary
    const summary = {
      totalPermissions: capabilities.length,
      accessiblePermissions: capabilities.filter(cap => cap.accessible).length,
      restrictedPermissions: capabilities.filter(cap => !cap.accessible).length
    };

    const result: RobloxApiVerificationResult = {
      isValid,
      apiKey: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4), // Mask the API key
      universeId,
      capabilities,
      summary
    };

    if (isValid) {
      // Update the game record with the verified Roblox API key
      await prisma.game.update({
        where: { id: params.id },
        data: {
          robloxAuthorization: {
            type: 'api_key',
            apiKey: apiKey, // Store the full API key securely
            lastVerified: new Date().toISOString(),
            status: 'active',
            universeId,
            verifiedAt: new Date().toISOString(),
            capabilities: capabilities.map(cap => ({
              feature: cap.feature,
              permission: cap.permission,
              accessible: cap.accessible
            }))
          },
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying Roblox API key:', error);
    return NextResponse.json({ 
      error: 'Failed to verify API key',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 