import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

interface MetricsImportProps {
  gameId: string;
}

export function MetricsImport({ gameId }: MetricsImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setSummary(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch(`/api/game-owner/games/${gameId}/metrics/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gameOwnerSessionToken')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import metrics');
      }

      setSuccess(true);
      setSummary(data.summary);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import metrics');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Metrics</CardTitle>
        <CardDescription>
          Import your game metrics from Roblox CSV files. Download these files from your Roblox Developer Dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-[150px]"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Import Files'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && !summary && (
            <Alert>
              <AlertDescription>Metrics imported successfully!</AlertDescription>
            </Alert>
          )}

          {summary && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Import Summary:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Files: {summary.processedFiles} processed, {summary.skippedFiles} skipped</li>
                      <li>Records: {summary.newRecords} new, {summary.updatedRecords} updated, {summary.skippedRecords} skipped</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {summary.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>Errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {summary.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">File Details:</h4>
                <div className="space-y-2">
                  {summary.fileDetails.map((file, index) => (
                    <div key={index} className="p-2 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{file.filename}</span>
                        <span className={`text-sm ${file.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {file.status === 'success' ? `${file.recordsProcessed} records` : 'Error'}
                        </span>
                      </div>
                      {file.error && (
                        <p className="text-sm text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 