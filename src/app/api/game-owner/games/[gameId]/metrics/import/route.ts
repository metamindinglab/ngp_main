import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { parse } from 'csv-parse/sync';

// Define metric types
enum MetricType {
  // Time Series Metrics
  d1Retention = "d1_retention",
  d7Retention = "d7_retention",
  d1Stickiness = "d1_stickiness",
  d7Stickiness = "d7_stickiness",
  dailyActiveUsers = "daily_active_users",
  averagePlayTimeMinutes = "average_play_time_minutes",
  averageSessionLengthMinutes = "average_session_length_minutes",
  monthlyActiveUsersByDay = "monthly_active_users_by_day",
  
  // Demographic Metrics
  demographicsGender = "demographics_gender",
  demographicsCountry = "demographics_country",
  demographicsLanguage = "demographics_language",
  demographicsAgeGroup = "demographics_age_group"
}

const METRIC_FILE_PATTERNS = {
  [MetricType.d1Retention]: /Day 1 retention- D1Retention/i,
  [MetricType.d7Retention]: /Day 7 retention- D7Retention/i,
  [MetricType.d1Stickiness]: /Day 1 stickiness- D1Stickiness/i,
  [MetricType.d7Stickiness]: /Day 7 stickiness- D7Stickiness/i,
  [MetricType.dailyActiveUsers]: /Daily active users- DailyActiveUsers/i,
  [MetricType.averagePlayTimeMinutes]: /Average playtime- AveragePlayTimeMinutesPerDAU/i,
  [MetricType.averageSessionLengthMinutes]: /Average session time- AverageSessionLengthMinutes/i,
  [MetricType.monthlyActiveUsersByDay]: /Monthly active users by day- MonthlyActiveUsers/i,
  [MetricType.demographicsGender]: /MonthlyActiveUsers, Gender/i,
  [MetricType.demographicsCountry]: /MonthlyActiveUsers, Country/i,
  [MetricType.demographicsLanguage]: /MonthlyActiveUsers, Language/i,
  [MetricType.demographicsAgeGroup]: /MonthlyActiveUsers, Age Group/i,
};

function detectMetricType(filename: string, firstRow: string[]): MetricType | null {
  // First try to detect from filename
  for (const [type, pattern] of Object.entries(METRIC_FILE_PATTERNS)) {
    if (pattern.test(filename)) {
      return type as MetricType;
    }
  }

  // If not found in filename, try to detect from content
  if (firstRow.includes('Age Group')) {
    return MetricType.demographicsAgeGroup;
  } else if (firstRow.includes('Country')) {
    return MetricType.demographicsCountry;
  } else if (firstRow.includes('Language')) {
    return MetricType.demographicsLanguage;
  } else if (firstRow.includes('Gender')) {
    return MetricType.demographicsGender;
  }

  return null;
}

interface TimeSeriesData {
  date: Date;
  value: number;
  category?: string; // Optional to maintain backward compatibility
  id: string;  // Add id field to interface
}

interface DemographicData {
  category: string;
  value: number;
}

function parseDemographicCSV(content: string): DemographicData[] {
  // Parse without column headers to see the raw data
  const rawRecords = parse(content, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  if (rawRecords.length < 2) {
    throw new Error('Invalid demographic data format: Not enough rows');
  }

  const data: DemographicData[] = [];
  let headerFound = false;

  // Process each row
  for (let i = 0; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    if (row.length < 2) continue; // Skip rows without enough columns

    // Skip header rows
    if (!headerFound && (row.includes('Series') || row.includes('Monthly Active Users'))) {
      headerFound = true;
      continue;
    }

    // For demographic data, we expect either:
    // ["Category", "Value"] or
    // ["Category", "Series", "Value"]
    const category = row[0];
    const value = parseFloat(row[row.length - 1]);

    if (!category || isNaN(value)) {
      console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
      continue;
    }

    data.push({
      category,
      value,
    });
  }

  if (data.length === 0) {
    throw new Error('No valid data found in the CSV file');
  }

  return data;
}

function parseTimeSeriesCSV(content: string, params: { gameId: string }): TimeSeriesData[] {
  // Parse without column headers to see the raw data
  const rawRecords = parse(content, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  if (rawRecords.length < 2) {
    throw new Error('Invalid time series data format: Not enough rows');
  }

  const data: TimeSeriesData[] = [];
  let headerFound = false;

  // Process each row
  for (let i = 0; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    if (row.length < 2) continue; // Skip rows without enough columns

    // Skip header rows
    if (!headerFound && (row.includes('Date') || row.includes('Value'))) {
      headerFound = true;
      continue;
    }

    // For time series data, we expect either:
    // ["Date", "Value"] or
    // ["Series Name", "Date", "Value"]
    const dateStr = row.length === 2 ? row[0] : row[1];
    const valueStr = row[row.length - 1];
    const seriesName = row.length > 2 ? row[0] : null;

    const date = new Date(dateStr);
    const value = parseFloat(valueStr);

    if (isNaN(date.getTime()) || isNaN(value)) {
      console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
      continue;
    }

    // Generate a unique ID that includes the category if present
    const uniqueId = seriesName 
      ? `${params.gameId}_${MetricType.averagePlayTimeMinutes}_${seriesName}_${date.toISOString()}`
      : `${params.gameId}_${MetricType.averagePlayTimeMinutes}_${date.toISOString()}`;

    data.push({
      date,
      value,
      category: seriesName || undefined,
      id: uniqueId,  // Add the ID to the data object
    });
  }

  if (data.length === 0) {
    throw new Error('No valid data found in the CSV file');
  }

  return data;
}

interface ImportSummary {
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  errors: string[];
  fileDetails: {
    filename: string;
    metricType: string;
    recordsProcessed: number;
    status: 'success' | 'error';
    error?: string;
  }[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      include: {
        gameOwner: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.gameOwner?.id !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const summary: ImportSummary = {
      totalFiles: files.length,
      processedFiles: 0,
      skippedFiles: 0,
      totalRecords: 0,
      newRecords: 0,
      updatedRecords: 0,
      skippedRecords: 0,
      errors: [],
      fileDetails: [],
    };

    const metricEntries = [];

    for (const file of files) {
      try {
        const content = await file.text();
        const rawRecords = parse(content, {
          columns: false,
          skip_empty_lines: true,
          relax_column_count: true,
        });

        if (rawRecords.length === 0) {
          summary.skippedFiles++;
          summary.fileDetails.push({
            filename: file.name,
            metricType: 'unknown',
            recordsProcessed: 0,
            status: 'error',
            error: 'Empty file',
          });
          continue;
        }

        const metricType = detectMetricType(file.name, rawRecords[0]);
        if (!metricType) {
          summary.skippedFiles++;
          summary.fileDetails.push({
            filename: file.name,
            metricType: 'unknown',
            recordsProcessed: 0,
            status: 'error',
            error: 'Unrecognized metric type',
          });
          continue;
        }

        const isDemographic = [
          MetricType.demographicsCountry,
          MetricType.demographicsGender,
          MetricType.demographicsLanguage,
          MetricType.demographicsAgeGroup,
        ].includes(metricType);

        let processedRecords = 0;

        if (isDemographic) {
          const data = parseDemographicCSV(content);
          for (const item of data) {
            metricEntries.push({
              id: `${params.gameId}_${metricType}_${item.category}`,
              gameId: params.gameId,
              metricType,
              date: new Date(),
              value: item.value,
              category: item.category,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            processedRecords++;
          }
        } else {
          const data = parseTimeSeriesCSV(content, params);
          for (const item of data) {
            metricEntries.push({
              id: item.id,
              gameId: params.gameId,
              metricType,
              date: item.date,
              value: item.value,
              category: item.category,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            processedRecords++;
          }
        }

        summary.processedFiles++;
        summary.totalRecords += processedRecords;
        summary.fileDetails.push({
          filename: file.name,
          metricType: metricType,
          recordsProcessed: processedRecords,
          status: 'success',
        });

      } catch (error: any) {
        console.error(`Error processing file ${file.name}:`, error);
        summary.errors.push(`Error processing ${file.name}: ${error.message || 'Unknown error'}`);
        summary.fileDetails.push({
          filename: file.name,
          metricType: 'unknown',
          recordsProcessed: 0,
          status: 'error',
          error: error.message || 'Unknown error',
        });
        summary.skippedFiles++;
      }
    }

    if (metricEntries.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in any of the files', summary },
        { status: 400 }
      );
    }

    // Update the metrics data using upsert with verification
    const results = await Promise.all(
      metricEntries.map(async entry => {
        const result = await prisma.$executeRaw`
          INSERT INTO "GameMetricData" (
            "id", "gameId", "metricType", "date", "value", 
            "category", "createdAt", "updatedAt"
          )
          VALUES (
            ${entry.id}, 
            ${entry.gameId}, 
            (${entry.metricType})::text::"MetricType", 
            ${entry.date}, 
            ${entry.value}, 
            ${entry.category}, 
            ${entry.createdAt}, 
            ${entry.updatedAt}
          )
          ON CONFLICT ("id") DO UPDATE SET
            "value" = CASE 
              WHEN "GameMetricData"."value" = EXCLUDED."value" AND 
                   COALESCE("GameMetricData"."category", '') = COALESCE(EXCLUDED."category", '') 
              THEN "GameMetricData"."value"  -- Keep existing value if identical
              ELSE EXCLUDED."value"
            END,
            "category" = CASE 
              WHEN "GameMetricData"."value" = EXCLUDED."value" AND 
                   COALESCE("GameMetricData"."category", '') = COALESCE(EXCLUDED."category", '')
              THEN "GameMetricData"."category"  -- Keep existing category if identical
              ELSE EXCLUDED."category"
            END,
            "updatedAt" = CASE 
              WHEN "GameMetricData"."value" = EXCLUDED."value" AND 
                   COALESCE("GameMetricData"."category", '') = COALESCE(EXCLUDED."category", '')
              THEN "GameMetricData"."updatedAt"  -- Keep existing timestamp if identical
              ELSE EXCLUDED."updatedAt"
            END
          WHERE 
            "GameMetricData"."value" != EXCLUDED."value" OR 
            COALESCE("GameMetricData"."category", '') != COALESCE(EXCLUDED."category", '')
          RETURNING 
            CASE 
              WHEN xmax::text::int > 0 THEN 'updated'::text
              ELSE 'inserted'::text
            END as operation
        `;
        return result as unknown as Array<{ operation: 'inserted' | 'updated' }>;
      })
    );

    // Update summary with database operation results
    results.forEach(result => {
      const operation = result[0]?.operation;
      if (operation === 'inserted') {
        summary.newRecords++;
      } else if (operation === 'updated') {
        summary.updatedRecords++;
      } else {
        summary.skippedRecords++;
      }
    });

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error('Error importing metrics:', error);
    return NextResponse.json(
      { error: 'Failed to import metrics', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 