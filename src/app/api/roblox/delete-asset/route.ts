import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ROBLOX_API_URL = 'https://apis.roblox.com/assets/v1';
const ROBLOX_API_KEY = process.env.NEXT_PUBLIC_ROBLOX_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!ROBLOX_API_KEY) {
      console.error('Roblox API key not configured');
      return NextResponse.json(
        { error: 'Roblox API key not configured' },
        { status: 500 }
      );
    }

    const { assetId } = await request.json();

    if (!assetId) {
      return NextResponse.json(
        { error: 'Missing asset ID' },
        { status: 400 }
      );
    }

    // Get the .ROBLOSECURITY cookie
    const cookieStore = cookies();
    const roblosecurity = cookieStore.get('.ROBLOSECURITY');

    if (!roblosecurity) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get CSRF token
    const csrfResponse = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${roblosecurity.value}`,
      },
    });

    const csrfToken = csrfResponse.headers.get('x-csrf-token');

    if (!csrfToken) {
      return NextResponse.json(
        { error: 'Failed to get CSRF token' },
        { status: 401 }
      );
    }

    console.log('Attempting to delete Roblox asset:', {
      assetId,
      hasApiKey: !!ROBLOX_API_KEY,
      hasCsrfToken: !!csrfToken,
      hasRoblosecurity: !!roblosecurity
    });

    // Delete the asset from Roblox
    const response = await fetch(`https://www.roblox.com/asset/delete-asset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `.ROBLOSECURITY=${roblosecurity.value}`,
        'X-CSRF-TOKEN': csrfToken,
      },
      body: JSON.stringify({
        assetId: assetId
      })
    });

    const responseText = await response.text();
    console.log('Roblox delete response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = responseText;
      }
      console.error('Failed to delete asset from Roblox:', {
        status: response.status,
        error: errorData
      });
      return NextResponse.json(
        { error: `Failed to delete asset from Roblox: ${JSON.stringify(errorData)}` },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully from Roblox'
    });
  } catch (error) {
    console.error('Error deleting asset from Roblox:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 