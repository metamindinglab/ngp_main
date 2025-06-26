# Database Migration Bug Fix Report

## 🐛 **Problem Description**

After data migration, the database would show data in the `Asset` table, but the `Game`, `GameAd`, `GameAdPerformance`, and `Playlist` tables would be empty or partially populated. This caused the application to fail when trying to access game-related data.

## 🔍 **Root Cause Analysis**

The issue was in the `scripts/migrate-all-data.ts` migration script:

### **Missing Games Migration**
The script was **missing the Games migration function entirely**. The migration order was:

1. ✅ **Assets** - Migrated successfully (no dependencies)
2. ❌ **Games** - **MISSING FROM MIGRATION** ⚠️ 
3. ❌ **Game Ads** - Failed due to missing Games (foreign key constraint)
4. ❌ **Game Ad Performance** - Failed due to missing Game Ads (foreign key constraint)  
5. ✅ **Playlists** - Partial success (duplicate key conflicts)

### **Foreign Key Constraint Dependencies**
The database schema has these critical dependencies:
- `GameAd.gameId` → `Game.id` (FK constraint)
- `GameAdPerformance.gameAdId` → `GameAd.id` (FK constraint)

Without Games in the database, Game Ads couldn't be created, which cascaded to Game Ad Performance failures.

## 🔧 **The Fix**

### **1. Added Missing Games Migration**
Added the `migrateGames()` function to `scripts/migrate-all-data.ts`:

```typescript
async function migrateGames() {
  console.log('🎮 Migrating Games...')
  
  try {
    const gamesPath = join(process.cwd(), 'data/games.json')
    const content = await readFile(gamesPath, 'utf8')
    const data: GamesDatabase = JSON.parse(content)
    
    let migrated = 0
    for (const game of data.games) {
      await prisma.game.upsert({
        where: { id: game.id },
        update: { /* game data */ },
        create: { /* game data */ }
      })
      migrated++
    }
    
    console.log(`✅ Successfully migrated ${migrated} games`)
  } catch (error) {
    console.error('❌ Error migrating games:', error)
  }
}
```

### **2. Fixed Migration Order**
Updated the migration sequence to respect foreign key dependencies:

```typescript
async function migrateAllData() {
  try {
    // CRITICAL: Run migrations in sequence to respect foreign key dependencies
    // 1. Games first (no dependencies)
    await migrateGames()
    
    // 2. Assets (no dependencies)
    await migrateAssets()
    
    // 3. Game Ads (depends on Games)
    await migrateGameAds()
    
    // 4. Game Ad Performance (depends on Game Ads)
    await migrateGameAdPerformance()
    
    // 5. Playlists (no dependencies)
    await migratePlaylists()
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}
```

### **3. Added Error Handling & Upsert Logic**
- Changed from `create()` to `upsert()` to handle duplicate records gracefully
- Added try-catch blocks around individual record migrations
- Added comprehensive error logging

### **4. Created Comprehensive Migration Script**
Created `scripts/migrate-comprehensive.ts` with:
- Data clearing functionality
- Migration verification
- Foreign key relationship validation  
- Expected vs actual data count comparison

## ✅ **Verification Results**

After the fix, the migration now works correctly:

```
📊 Migration Results:
   Games: 6 ✅
   Assets: 34 ✅  
   Game Ads: 3 ✅
   Game Ad Performance: 1 ✅
   Playlists: 1 ✅

🔗 Foreign Key Relationships:
   ✓ All GameAds have valid Game references
   ✓ All GameAdPerformance records have valid GameAd references
```

## 🚀 **How to Run the Fixed Migration**

### **Option 1: Use the Fixed Original Script**
```bash
npx ts-node scripts/migrate-all-data.ts
```

### **Option 2: Use the Comprehensive Migration (Recommended)**
```bash
npx ts-node scripts/migrate-comprehensive.ts
```

### **Option 3: Verify Migration Results**
```bash
npx ts-node scripts/check-migration.ts
```

## 🛡️ **Prevention Measures**

### **1. Migration Dependency Mapping**
Always document and respect foreign key dependencies:

```
Dependencies Graph:
Game (no deps) → GameAd → GameAdPerformance  
Asset (no deps)
Playlist (no deps)
```

### **2. Pre-Migration Validation**
Before running migrations, verify:
- All required JSON data files exist
- Foreign key relationships are understood
- Migration order respects dependencies

### **3. Post-Migration Verification**
Always run verification after migration:
- Check record counts match expectations
- Verify foreign key relationships
- Test critical application paths

### **4. Use Upsert Instead of Create**
```typescript
// ❌ Bad: Will fail on duplicates
await prisma.game.create({ data: gameData })

// ✅ Good: Handles duplicates gracefully  
await prisma.game.upsert({
  where: { id: game.id },
  update: gameData,
  create: gameData
})
```

### **5. Migration Testing Protocol**
1. **Clear database** (`scripts/migrate-comprehensive.ts` does this)
2. **Run migration**
3. **Verify results** 
4. **Test application functionality**

## 🔄 **Database Schema Notes**

### **Foreign Key Constraints**
```sql
-- GameAd depends on Game
ALTER TABLE "GameAd" ADD CONSTRAINT "GameAd_gameId_fkey" 
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT;

-- GameAdPerformance depends on GameAd  
ALTER TABLE "GameAdPerformance" ADD CONSTRAINT "GameAdPerformance_gameAdId_fkey"
  FOREIGN KEY ("gameAdId") REFERENCES "GameAd"("id") ON DELETE RESTRICT;
```

### **Migration Order Requirements**
1. **Games** - No dependencies, migrate first
2. **Assets** - No dependencies, can migrate anytime
3. **Playlists** - No dependencies, can migrate anytime  
4. **Game Ads** - Requires Games to exist first
5. **Game Ad Performance** - Requires Game Ads to exist first

## 📝 **Files Modified**

1. **`scripts/migrate-all-data.ts`** - Added missing Games migration + fixed order
2. **`scripts/migrate-comprehensive.ts`** - New comprehensive migration script
3. **`docs/DATABASE_MIGRATION_BUG_FIX.md`** - This documentation

## 🎯 **Key Takeaways**

1. **Always migrate parent tables before child tables** due to foreign key constraints
2. **Use `upsert()` instead of `create()`** to handle re-runs gracefully
3. **Add comprehensive error handling** to individual record migrations
4. **Verify migrations with expected data counts** and foreign key relationships
5. **Document migration dependencies** to prevent future issues

The database migration bug has been completely resolved and all data now persists correctly after migration. 