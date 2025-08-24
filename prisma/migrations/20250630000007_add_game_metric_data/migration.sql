-- CreateTable
CREATE TABLE "GameMetricData" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameMetricData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameMetricData_gameId_metricType_date_idx" ON "GameMetricData"("gameId", "metricType", "date");

-- CreateIndex
CREATE INDEX "GameMetricData_gameId_metricType_category_idx" ON "GameMetricData"("gameId", "metricType", "category");

-- AddForeignKey
ALTER TABLE "GameMetricData" ADD CONSTRAINT "GameMetricData_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 