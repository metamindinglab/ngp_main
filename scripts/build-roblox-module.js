#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const LUA_SOURCE = path.join(PROJECT_ROOT, 'src', 'roblox', 'MMLGameNetwork.lua');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'downloads');
const ROJO_PROJECT = path.join(PROJECT_ROOT, 'roblox-module.project.json');

async function main() {
  console.log('🎮 Building MML Game Network Roblox Module...');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Check if Rojo is available
  try {
    execSync('rojo --version', { stdio: 'pipe' });
    console.log('✅ Rojo found, building .rbxm file...');
    await buildWithRojo();
  } catch (error) {
    console.log('⚠️  Rojo not found, creating instruction file...');
    await createInstructionFile();
  }
}

async function buildWithRojo() {
  try {
    // Create Rojo project file
    const rojoProject = {
      name: "MMLGameNetwork",
      tree: {
        $className: "ModuleScript",
        $properties: {
          Name: "MMLGameNetwork"
        },
        Source: {
          $path: "src/roblox/MMLGameNetwork.lua"
        }
      }
    };
    
    fs.writeFileSync(ROJO_PROJECT, JSON.stringify(rojoProject, null, 2));
    
    // Build with Rojo
    const outputPath = path.join(OUTPUT_DIR, 'MMLGameNetwork.rbxm');
    execSync(`rojo build "${ROJO_PROJECT}" --output "${outputPath}"`, { 
      stdio: 'inherit',
      cwd: PROJECT_ROOT 
    });
    
    console.log(`✅ Successfully built: ${outputPath}`);
    
    // Clean up project file
    fs.unlinkSync(ROJO_PROJECT);
    
    // Update download endpoint info
    updateDownloadInfo();
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function createInstructionFile() {
  try {
    const luaSource = fs.readFileSync(LUA_SOURCE, 'utf-8');
    
    const instructions = `MML Game Network - Roblox Module Setup Instructions
=====================================================

Since Rojo is not available, please follow these manual setup steps:

STEP 1: Create ModuleScript
--------------------------
1. Open your game in Roblox Studio
2. In Explorer, right-click on "ReplicatedStorage"
3. Select "Insert Object" → "ModuleScript"
4. Rename it from "ModuleScript" to "MMLGameNetwork"

STEP 2: Add the Module Code
---------------------------
1. Double-click on the "MMLGameNetwork" module to open it
2. Delete all existing code
3. Copy and paste the following code:

${luaSource}

STEP 3: Save and Test
--------------------
1. Press Ctrl+S to save
2. Create your integration script in ServerScriptService
3. Test in Studio by pressing the Play button

For automated building, install Rojo:
- Visit: https://github.com/rojo-rbx/rojo
- Follow installation instructions
- Re-run this script

Generated: ${new Date().toISOString()}
`;

    const instructionPath = path.join(OUTPUT_DIR, 'MMLGameNetwork-setup.txt');
    fs.writeFileSync(instructionPath, instructions);
    
    console.log(`📝 Created instruction file: ${instructionPath}`);
    
  } catch (error) {
    console.error('❌ Failed to create instruction file:', error.message);
    process.exit(1);
  }
}

function updateDownloadInfo() {
  const infoPath = path.join(OUTPUT_DIR, 'module-info.json');
  const info = {
    fileName: 'MMLGameNetwork.rbxm',
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    buildMethod: 'rojo',
    downloadUrl: '/api/download/roblox-module'
  };
  
  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
  console.log('📋 Updated module info');
}

// Install instructions
function showInstallInstructions() {
  console.log(`
🚀 To install Rojo for automated building:

# Using Cargo (Rust)
cargo install rojo

# Or download from GitHub:
# https://github.com/rojo-rbx/rojo/releases

# Using Aftman (Roblox tool manager)
aftman install rojo-rbx/rojo@7.4.0

Then re-run this script!
`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { buildWithRojo, createInstructionFile }; 