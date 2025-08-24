-- Add endDate to PlaylistSchedule and backfill from startDate+duration (days)
ALTER TABLE "PlaylistSchedule" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMPTZ;
UPDATE "PlaylistSchedule" SET "endDate" = ("startDate" + make_interval(days => "duration")) WHERE "endDate" IS NULL; 