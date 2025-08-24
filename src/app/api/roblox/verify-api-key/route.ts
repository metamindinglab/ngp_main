import { NextRequest, NextResponse } from 'next/server';
import { RobloxDataFetcher } from '@/lib/roblox-data-fetcher';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, universeId } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const fetcher = new RobloxDataFetcher(apiKey, universeId ? parseInt(universeId) : 0);
    const verificationResult = await fetcher.verifyApiKey();

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.error || 'Failed to verify API key' },
        { status: 500 }
      );
    }

    return NextResponse.json(verificationResult.data);
  } catch (error) {
    console.error('Error verifying API key:', error);
    return NextResponse.json(
      { error: 'Failed to verify API key' },
      { status: 500 }
    );
  }
} 