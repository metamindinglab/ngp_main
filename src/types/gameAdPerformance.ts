export interface GamePlayerDemographics {
  gender: 'male' | 'female' | 'other' | 'unknown';
  ageGroup: 'under13' | 'over13' | 'unknown';
  geographicRegion: string;
  language: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'console' | 'unknown';
  platform: 'windows' | 'mac' | 'ios' | 'android' | 'xbox' | 'unknown';
}

export interface GameAdEngagement {
  timestamp: string;
  duration: number; // in seconds
  interactionType: 'click' | 'view' | 'hover' | 'scroll' | 'interact';
  interactionDetails?: {
    buttonClicked?: string;
    timeSpent?: number;
    completionStatus?: 'completed' | 'partial' | 'abandoned';
  };
}

export interface GameAdPerformanceMetrics {
  totalImpressions: number;
  uniqueImpressions: number;
  totalEngagements: number;
  uniqueEngagements: number;
  averageEngagementDuration: number;
  engagementRate: number; // (totalEngagements / totalImpressions) * 100
  completionRate: number; // (completedEngagements / totalEngagements) * 100
  conversionRate: number; // (uniqueEngagements / uniqueImpressions) * 100
}

export interface GameAdPerformance {
  id: string;
  gameAdId: string;
  gameId: string;
  playlistId: string;
  date: string;
  metrics: GameAdPerformanceMetrics;
  demographics: {
    gender: Record<string, number>;
    ageGroup: Record<string, number>;
    geographicRegion: Record<string, number>;
    language: Record<string, number>;
    deviceType: Record<string, number>;
    platform: Record<string, number>;
  };
  engagements: GameAdEngagement[];
  playerDetails: {
    totalPlayers: number;
    uniquePlayers: number;
    returningPlayers: number;
    newPlayers: number;
  };
  timeDistribution: {
    hourOfDay: Record<number, number>;
    dayOfWeek: Record<number, number>;
  };
  performanceTrends: {
    daily: {
      date: string;
      impressions: number;
      engagements: number;
      engagementRate: number;
    }[];
    weekly: {
      weekStart: string;
      impressions: number;
      engagements: number;
      engagementRate: number;
    }[];
  };
} 