-- Add missing columns to GameMedia table
ALTER TABLE "GameMedia" 
ADD COLUMN IF NOT EXISTS "width" INTEGER,
ADD COLUMN IF NOT EXISTS "height" INTEGER,
ADD COLUMN IF NOT EXISTS "duration" INTEGER; 