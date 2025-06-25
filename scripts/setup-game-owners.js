const path = require('path')
const fs = require('fs')

function extractGameOwners() {
  const gamesDataPath = path.join(process.cwd(), 'data/games.json')
  
  if (!fs.existsSync(gamesDataPath)) {
    throw new Error('games.json not found')
  }

  const gamesData = JSON.parse(fs.readFileSync(gamesDataPath, 'utf8'))
  const ownerMap = new Map()
  const incompleteMap = new Map()
  let ownerId = 1

  gamesData.games.forEach((game) => {
    if (game.owner) {
      const { name, email, country, discordId } = game.owner
      
      // Check if owner has complete data (at minimum: name and email)
      if (email && email.trim() && name && name.trim()) {
        // Complete owner
        if (!ownerMap.has(email)) {
          ownerMap.set(email, {
            id: `owner_${ownerId.toString().padStart(3, '0')}`,
            email: email.trim(),
            name: name.trim(),
            country: country?.trim() || '',
            discordId: discordId?.trim() || '',
            games: [],
            status: 'complete'
          })
          ownerId++
        }
        ownerMap.get(email).games.push(game.id)
      } else if (name && name.trim()) {
        // Incomplete owner (has name but no email)
        const key = name.trim()
        if (!incompleteMap.has(key)) {
          incompleteMap.set(key, {
            id: `incomplete_${ownerId.toString().padStart(3, '0')}`,
            email: '',
            name: name.trim(),
            country: country?.trim() || '',
            discordId: discordId?.trim() || '',
            games: [],
            status: 'incomplete'
          })
          ownerId++
        }
        incompleteMap.get(key).games.push(game.id)
      }
    }
  })

  const validOwners = Array.from(ownerMap.values())
  const incompleteOwners = Array.from(incompleteMap.values())
  
  return {
    validOwners,
    incompleteOwners,
    stats: {
      totalGames: gamesData.games.length,
      gamesWithOwners: validOwners.reduce((sum, owner) => sum + owner.games.length, 0),
      gamesWithoutOwners: gamesData.games.length - validOwners.reduce((sum, owner) => sum + owner.games.length, 0) - incompleteOwners.reduce((sum, owner) => sum + owner.games.length, 0),
      uniqueOwners: validOwners.length
    }
  }
}

async function setupGameOwners() {
  try {
    console.log('🎮 Setting up Game Owner Portal...\n')
    
    // Extract game owners from games.json
    const result = extractGameOwners()
    
    console.log('📊 Extraction Results:')
    console.log(`- Total games: ${result.stats.totalGames}`)
    console.log(`- Games with owners: ${result.stats.gamesWithOwners}`)
    console.log(`- Games without owners: ${result.stats.gamesWithoutOwners}`)
    console.log(`- Unique owners: ${result.stats.uniqueOwners}\n`)
    
    console.log('✅ Valid Game Owners (with email):')
    result.validOwners.forEach(owner => {
      console.log(`- ${owner.name} (${owner.email})`)
      console.log(`  Country: ${owner.country || 'Not specified'}`)
      console.log(`  Discord: ${owner.discordId || 'Not specified'}`)
      console.log(`  Games: ${owner.games.join(', ')}`)
      console.log('')
    })
    
    if (result.incompleteOwners.length > 0) {
      console.log('⚠️  Incomplete Owners (missing email):')
      result.incompleteOwners.forEach(owner => {
        console.log(`- ${owner.name}`)
        console.log(`  Games: ${owner.games.join(', ')}`)
        console.log('')
      })
    }
    
    console.log('🔐 Test Accounts for Development:')
    console.log('You can register/login with these emails using any password:')
    result.validOwners.forEach(owner => {
      console.log(`- Email: ${owner.email}`)
      console.log(`  Name: ${owner.name}`)
      console.log(`  Password: Use any password (e.g., "password123")`)
      console.log('')
    })
    
    console.log('🚀 Next Steps:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Go to: http://localhost:3000/game-owner/login')
    console.log('3. Register with one of the emails above')
    console.log('4. Explore your game owner dashboard')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

if (require.main === module) {
  setupGameOwners()
}

module.exports = setupGameOwners 