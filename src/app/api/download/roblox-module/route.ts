import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // You can either:
    // 1. Serve a pre-built .rbxm file
    // 2. Generate it on-demand using a build script
    
    // Option 1: Serve pre-built file (recommended for production)
    const filePath = join(process.cwd(), 'public', 'downloads', 'MMLNetworkComplete.rbxm')
    
    try {
      const fileBuffer = await readFile(filePath)
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="MMLNetworkComplete.rbxm"',
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    } catch (fileError) {
      console.error('Pre-built file not found, generating on demand...')
      
      // Option 2: Generate on-demand (for development)
      return generateModuleOnDemand()
    }
  } catch (error) {
    console.error('Error serving Roblox module:', error)
    return NextResponse.json(
      { error: 'Failed to download module' },
      { status: 500 }
    )
  }
}

async function generateModuleOnDemand() {
  try {
    // Read the Lua source code
    const luaPath = join(process.cwd(), 'src', 'roblox', 'MMLGameNetwork.lua')
    const luaSource = await readFile(luaPath, 'utf-8')
    
    // Generate a simple text file with instructions for now
    // In production, you'd use Rojo or similar to generate actual .rbxm
    const instructions = `
# MML Game Network Module

## Manual Installation Required
The .rbxm file is not available yet. Please follow these steps:

1. In Roblox Studio, create a ModuleScript in ReplicatedStorage
2. Name it "MMLGameNetwork"
3. Replace the default code with the following:

${luaSource}

## Automated Build Coming Soon
We're working on providing a downloadable .rbxm file. For now, please use the manual method above.
`
    
    return new NextResponse(instructions, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="MMLGameNetwork-setup.txt"',
      },
    })
  } catch (error) {
    console.error('Error generating module:', error)
    return NextResponse.json(
      { error: 'Failed to generate module' },
      { status: 500 }
    )
  }
} 