-- Revert Template for Destructive Migration
-- Fill the sections below to undo the corresponding migration safely.
-- IMPORTANT: Test this on staging with prod-like data before running in prod.

BEGIN;

-- 1) Reverse schema changes (add back columns/indexes/tables dropped earlier)
-- Example:
-- ALTER TABLE "TableName" ADD COLUMN IF NOT EXISTS "old_column" TEXT;
-- CREATE INDEX IF NOT EXISTS "idx_old" ON "TableName" ("old_column");

-- 2) Restore data if needed (from backups or preserved shadow columns)
-- Example:
-- UPDATE "TableName" SET "old_column" = "new_column" WHERE "old_column" IS NULL;

-- 3) Optional: disable or re-enable constraints during restore window
-- Example:
-- ALTER TABLE "TableName" DISABLE TRIGGER ALL;
-- ... data fixes ...
-- ALTER TABLE "TableName" ENABLE TRIGGER ALL;

COMMIT;

-- Verification queries (run manually):
-- \d+ "TableName"
-- SELECT COUNT(*) FROM "TableName" WHERE ...;


