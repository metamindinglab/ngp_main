-- CreateTable
CREATE TABLE "BrandUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT,
    "companySize" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "industry" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free_trial',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandUserSubscription" (
    "id" TEXT NOT NULL,
    "brandUserId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandUserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandUser_email_key" ON "BrandUser"("email");

-- AddForeignKey
ALTER TABLE "BrandUserSubscription" ADD CONSTRAINT "BrandUserSubscription_brandUserId_fkey" FOREIGN KEY ("brandUserId") REFERENCES "BrandUser"("id") ON DELETE CASCADE ON UPDATE CASCADE; 