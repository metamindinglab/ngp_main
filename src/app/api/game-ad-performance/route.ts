import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { GameAdPerformance } from '@/types/gameAdPerformance';

const DATA_FILE = path.join(process.cwd(), 'data', 'game-ad-performance.json');

export async function GET() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading game ad performance data:', error);
    return NextResponse.json(
      { error: 'Failed to read game ad performance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const performanceData: GameAdPerformance = await request.json();
    
    // Read existing data
    const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    
    // Add new performance data
    data.performanceData.push(performanceData);
    data.lastUpdated = new Date().toISOString();
    
    // Write back to file
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, data: performanceData });
  } catch (error) {
    console.error('Error saving game ad performance data:', error);
    return NextResponse.json(
      { error: 'Failed to save game ad performance data' },
      { status: 500 }
    );
  }
} 