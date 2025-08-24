-- CreateTable
CREATE TABLE "GameOwner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameOwner_email_key" ON "GameOwner"("email");

-- Add foreign key to Game table
ALTER TABLE "Game" ADD CONSTRAINT "Game_gameOwnerId_fkey"
    FOREIGN KEY ("gameOwnerId") REFERENCES "GameOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE; 