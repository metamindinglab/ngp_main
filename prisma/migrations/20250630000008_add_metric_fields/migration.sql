-- Create MetricType enum
CREATE TYPE "MetricType" AS ENUM (
  'd1_retention',
  'd7_retention',
  'd1_stickiness',
  'd7_stickiness',
  'daily_active_users',
  'average_play_time_minutes',
  'average_session_length_minutes',
  'monthly_active_users_by_day',
  'demographics_gender',
  'demographics_country',
  'demographics_language',
  'demographics_age_group'
);

-- Add new columns to GameMetricData table
ALTER TABLE "GameMetricData" 
  ADD COLUMN "breakdown" TEXT NOT NULL DEFAULT 'Total',
  ADD COLUMN "series" TEXT;

-- Convert metricType to enum in GameMetricData table
ALTER TABLE "GameMetricData" 
  ALTER COLUMN "metricType" TYPE "MetricType" USING (
    CASE 
      WHEN "metricType" = 'd1Retention' THEN 'd1_retention'::"MetricType"
      WHEN "metricType" = 'd7Retention' THEN 'd7_retention'::"MetricType"
      WHEN "metricType" = 'd1Stickiness' THEN 'd1_stickiness'::"MetricType"
      WHEN "metricType" = 'd7Stickiness' THEN 'd7_stickiness'::"MetricType"
      WHEN "metricType" = 'dailyActiveUsers' THEN 'daily_active_users'::"MetricType"
      WHEN "metricType" = 'averagePlayTime' THEN 'average_play_time_minutes'::"MetricType"
      WHEN "metricType" = 'averageSessionTime' THEN 'average_session_length_minutes'::"MetricType"
      WHEN "metricType" = 'monthlyActiveUsers' THEN 'monthly_active_users_by_day'::"MetricType"
      WHEN "metricType" LIKE 'demographics_gender%' THEN 'demographics_gender'::"MetricType"
      WHEN "metricType" LIKE 'demographics_country%' THEN 'demographics_country'::"MetricType"
      WHEN "metricType" LIKE 'demographics_language%' THEN 'demographics_language'::"MetricType"
      WHEN "metricType" LIKE 'demographics_age%' THEN 'demographics_age_group'::"MetricType"
    END
  );

-- Add new index for latest demographic snapshots
CREATE INDEX "GameMetricData_gameId_metricType_idx" ON "GameMetricData"("gameId", "metricType"); 