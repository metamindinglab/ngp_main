'use client';

import { MetricsImport } from '../components/MetricsImport';
import { MetricsOverview } from '../components/MetricsOverview';

interface MetricsPageProps {
  params: {
    gameId: string;
  };
}

export default function MetricsPage({ params }: MetricsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Import Metrics</h3>
        <p className="text-sm text-muted-foreground">
          Import your game metrics from Roblox CSV files. Download these files from your Roblox Developer Dashboard.
        </p>
      </div>

      <MetricsImport gameId={params.gameId} />

      <div>
        <h3 className="text-lg font-medium">Metrics Overview</h3>
        <p className="text-sm text-muted-foreground">
          View your imported game metrics and analytics
        </p>
      </div>

      <MetricsOverview gameId={params.gameId} />
    </div>
  );
} 