-- Create a function to check deletion count
CREATE OR REPLACE FUNCTION check_deletion_count()
RETURNS TRIGGER AS $$
DECLARE
    deletion_count INTEGER;
    total_count INTEGER;
    threshold INTEGER;
BEGIN
    -- Get the table name from TG_TABLE_NAME
    EXECUTE format('SELECT COUNT(*) FROM %I', TG_TABLE_NAME) INTO total_count;
    
    -- Calculate threshold (50% of total records or 100, whichever is larger)
    threshold := GREATEST(total_count * 0.5, 100);
    
    -- For DELETE operations
    IF TG_OP = 'DELETE' THEN
        -- Count records that would be deleted
        IF TG_LEVEL = 'ROW' THEN
            deletion_count := 1;
        ELSE
            deletion_count := total_count;  -- For TRUNCATE
        END IF;
        
        -- Check if deletion count exceeds threshold
        IF deletion_count > threshold THEN
            RAISE EXCEPTION 'Mass deletion protection: Attempting to delete % records from %. This exceeds the threshold of % records.', 
                deletion_count, TG_TABLE_NAME, threshold;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
CREATE TRIGGER protect_game_deletion
    BEFORE DELETE ON "Game"
    FOR EACH STATEMENT
    EXECUTE FUNCTION check_deletion_count();

CREATE TRIGGER protect_game_ad_deletion
    BEFORE DELETE ON "GameAd"
    FOR EACH STATEMENT
    EXECUTE FUNCTION check_deletion_count();

CREATE TRIGGER protect_game_ad_performance_deletion
    BEFORE DELETE ON "GameAdPerformance"
    FOR EACH STATEMENT
    EXECUTE FUNCTION check_deletion_count();

-- Add foreign key constraints with ON DELETE RESTRICT
ALTER TABLE "GameAd" DROP CONSTRAINT IF EXISTS "GameAd_gameId_fkey";
ALTER TABLE "GameAd" ADD CONSTRAINT "GameAd_gameId_fkey" 
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GameAdPerformance" DROP CONSTRAINT IF EXISTS "GameAdPerformance_gameAdId_fkey";
ALTER TABLE "GameAdPerformance" ADD CONSTRAINT "GameAdPerformance_gameAdId_fkey" 
  FOREIGN KEY ("gameAdId") REFERENCES "GameAd"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 