-- Uppercase statuses for PlaylistSchedule and GameDeployment
ALTER TABLE "PlaylistSchedule" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
ALTER TABLE "GameDeployment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
UPDATE "PlaylistSchedule" SET "status" = UPPER("status");
UPDATE "GameDeployment" SET "status" = UPPER("status");
