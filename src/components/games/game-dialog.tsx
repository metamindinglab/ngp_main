'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Upload, Zap, CheckCircle, Edit } from 'lucide-react';
import { Game } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Color scheme for consistent UI
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
};

// Countries list for dropdown
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria',
  'Cambodia', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Czech Republic',
  'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia',
  'Finland', 'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala',
  'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg',
  'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway',
  'Pakistan', 'Panama', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Taiwan', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Venezuela', 'Vietnam'
].sort();

interface GameDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (game: Game) => void;
  initialData: Game;
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

type CreationMode = 'roblox-api' | 'manual';

export function GameDialog({ open, onClose, onSave, initialData }: GameDialogProps) {
  const [game, setGame] = useState<Game>(initialData);
  const [creationMode, setCreationMode] = useState<CreationMode>('roblox-api');
  const [robloxApiKey, setRobloxApiKey] = useState('');
  const [robloxUniverseId, setRobloxUniverseId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRobloxData, setIsFetchingRobloxData] = useState(false);
  const [robloxDataFetched, setRobloxDataFetched] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const { toast } = useToast();

  // Determine if this is a new game (no ID) or editing existing
  const isNewGame = !initialData.id || initialData.id === '';

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      console.log('🔄 Resetting dialog state. initialData:', initialData);
      setGame(initialData);
      setCreationMode('roblox-api');
      setRobloxApiKey('');
      setRobloxUniverseId('');
      setVerificationResult(null);
      setRobloxDataFetched(false);
      setImportSummary(null);
    }
  }, [open]); // Removed initialData from dependencies

  // Debug: Watch for changes in game state
  useEffect(() => {
    // Debug logging removed for cleaner console output
  }, [game]);

  const handleInputChange = (field: keyof Game, value: string) => {
    setGame(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(game);
  };

  const handleFetchRobloxData = async () => {
    console.log('🚀 handleFetchRobloxData called with:', { robloxApiKey: !!robloxApiKey, robloxUniverseId });
    
    if (!robloxApiKey) {
      toast({
        title: "Error",
        description: "Please enter a Roblox API key",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingRobloxData(true);
    try {
      // First verify the API key
      const verifyResponse = await fetch('/api/roblox/verify-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          apiKey: robloxApiKey,
          universeId: robloxUniverseId || undefined
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify Roblox API key');
      }

      const verifyData = await verifyResponse.json();
      console.log('🔍 Verification response:', verifyData);
      setVerificationResult(verifyData);
      
      if (!verifyData.isValid) {
        console.log('❌ API key verification failed');
        toast({
          title: "Verification Failed",
          description: "The API key appears to be invalid or has no accessible permissions.",
          variant: "destructive",
        });
        return;
      }

      // If we have a universe ID, fetch the game data
      console.log('✅ API key verified, proceeding to fetch game data...');
      if (robloxUniverseId) {
        console.log('🎯 Calling fetch-game-data API...');
        const fetchResponse = await fetch('/api/roblox/fetch-game-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            apiKey: robloxApiKey,
            universeId: robloxUniverseId
          }),
        });

        if (!fetchResponse.ok) {
          throw new Error('Failed to fetch game data from Roblox');
        }

        const gameData = await fetchResponse.json();
        console.log('📦 Received game data:', gameData);
        
        // Debug: Log the individual values being set
        console.log('🔧 Setting game fields:', {
          name: gameData.name,
          description: gameData.description,
          genre: gameData.genre,
          thumbnailUrl: gameData.thumbnailUrl,
          universeUrl: gameData.universeUrl
        });
        
        // Update the game with fetched data
        setGame(prev => {
          const updatedGame = {
            ...prev,
            name: gameData.name || prev.name,
            description: gameData.description || prev.description,
            genre: gameData.genre || prev.genre,
            thumbnail: gameData.thumbnailUrl || prev.thumbnail,
            robloxLink: gameData.universeUrl || prev.robloxLink,
            // Update dates with Roblox data
            dates: {
              ...prev.dates,
              created: gameData.dates?.created || prev.dates?.created || '',
              lastUpdated: gameData.dates?.updated || prev.dates?.lastUpdated || new Date().toISOString()
            },
            // Auto-populate owner from Roblox creator data
            owner: {
              ...prev.owner,
              name: gameData.creator?.name || prev.owner?.name || '',
              robloxId: gameData.creator?.id || prev.owner?.robloxId || '',
              email: prev.owner?.email || '',
              discordId: prev.owner?.discordId || '',
              country: prev.owner?.country || ''
            },
            robloxAuthorization: {
              type: 'api_key' as const,
              status: 'active' as const,
              apiKey: robloxApiKey,
              lastVerified: new Date().toISOString()
            },
            robloxInfo: {
              ...gameData,
              // Ensure we include the enhanced data structure
              subgenre: gameData.subgenre,
              subgenre2: gameData.subgenre2,
              isActive: gameData.isActive,
              dates: gameData.dates,
              images: gameData.images
            }
          };
          
          console.log('🎯 Updated game object:', updatedGame);
          return updatedGame;
        });

        setRobloxDataFetched(true);
        toast({
          title: "Success",
          description: "Game data fetched successfully from Roblox!",
        });
      } else {
        console.log('🤔 No Universe ID provided, skipping game data fetch');
        // Just store the API key verification
                 setGame(prev => ({
           ...prev,
           robloxAuthorization: {
             type: 'api_key',
             status: 'active',
             apiKey: robloxApiKey,
             lastVerified: new Date().toISOString()
           }
         }));

        toast({
          title: "Success",
          description: "API key verified successfully! You can now enter game details manually.",
        });
      }
    } catch (error) {
      console.error('Error fetching Roblox data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch Roblox data",
        variant: "destructive",
      });
    } finally {
      setIsFetchingRobloxData(false);
    }
  };

  const handleVerifyApiKey = async () => {
    if (!robloxApiKey) return;

    setIsLoading(true);
    setVerificationResult(null);
    try {
      const response = await fetch('/api/roblox/verify-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          apiKey: robloxApiKey,
          universeId: robloxUniverseId || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify Roblox API key');
      }

      const data = await response.json();
      setVerificationResult(data);
      
      if (data.isValid) {
        setGame(prev => ({
          ...prev,
          robloxAuthorization: {
            type: 'api_key' as const,
            status: 'active' as const,
            apiKey: robloxApiKey,
            lastVerified: new Date().toISOString()
          },
        }));

        toast({
          title: "Success",
          description: `Roblox API key verified successfully! Found ${data.summary.accessiblePermissions} accessible permissions.`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "The API key appears to be invalid or has no accessible permissions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying Roblox API key:', error);
      toast({
        title: "Error",
        description: "Failed to verify Roblox API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if game has an ID (i.e., it's been saved)
    if (!game.id || game.id === '') {
      toast({
        title: "Error",
        description: "Please save the game first before importing metrics",
        variant: "destructive",
      });
      event.target.value = ''; // Clear the file input
      return;
    }

    setIsUploading(true);
    setImportSummary(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch(`/api/games/${game.id}/metrics/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import metrics');
      }

      setImportSummary(data.summary);
      toast({
        title: "Success",
        description: "Metrics imported successfully",
      });

      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing metrics:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to import metrics',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewGame ? 'Add New Game' : 'Edit Game'}
          </DialogTitle>
          <DialogDescription>
            {isNewGame 
              ? 'Create a new game entry with Roblox integration or manual data entry' 
              : 'Edit game information, update Roblox data, and manage metrics'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Creation Mode Selection - Only for new games */}
        {isNewGame && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">How would you like to create this game?</CardTitle>
              <CardDescription>
                Choose your preferred method for adding game information
              </CardDescription>
            </CardHeader>
                         <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div 
                   className={`p-4 border rounded-lg hover:bg-accent/5 cursor-pointer transition-all ${
                     creationMode === 'roblox-api' ? 'border-primary bg-primary/5' : ''
                   }`}
                   onClick={() => setCreationMode('roblox-api')}
                 >
                   <div className="flex items-center gap-2 mb-1">
                     <Zap className="h-4 w-4 text-blue-500" />
                     <span className="font-medium">Option A: Roblox API</span>
                     {creationMode === 'roblox-api' && <CheckCircle className="h-4 w-4 text-primary ml-auto" />}
                   </div>
                   <p className="text-sm text-muted-foreground">
                     Enter your Roblox API key and Universe ID to automatically fetch game data
                   </p>
                 </div>
                 <div 
                   className={`p-4 border rounded-lg hover:bg-accent/5 cursor-pointer transition-all ${
                     creationMode === 'manual' ? 'border-primary bg-primary/5' : ''
                   }`}
                   onClick={() => setCreationMode('manual')}
                 >
                   <div className="flex items-center gap-2 mb-1">
                     <Edit className="h-4 w-4 text-green-500" />
                     <span className="font-medium">Option B: Manual Entry</span>
                     {creationMode === 'manual' && <CheckCircle className="h-4 w-4 text-primary ml-auto" />}
                   </div>
                   <p className="text-sm text-muted-foreground">
                     Manually enter all game information yourself
                   </p>
                 </div>
               </div>
             </CardContent>
          </Card>
        )}

        {/* Roblox API Setup - Only for new games in roblox-api mode */}
        {isNewGame && creationMode === 'roblox-api' && !robloxDataFetched && (
          <Card className="mb-4 border-l-4" style={{ borderLeftColor: COLORS.primary }}>
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Roblox API Setup
              </CardTitle>
              <CardDescription>
                Enter your Roblox API key and Universe ID to automatically fetch game data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="apiKey">Roblox API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your Roblox Open Cloud API key"
                      value={robloxApiKey}
                      onChange={(e) => setRobloxApiKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="universeId">Universe ID *</Label>
                    <Input
                      id="universeId"
                      type="text"
                      placeholder="Enter your game's Universe ID"
                      value={robloxUniverseId}
                      onChange={(e) => setRobloxUniverseId(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleFetchRobloxData}
                    disabled={isFetchingRobloxData || !robloxApiKey || !robloxUniverseId}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isFetchingRobloxData ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Fetching Data...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Fetch Game Data
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    This will verify your API key and fetch game information from Roblox
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success message for fetched data */}
        {robloxDataFetched && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Success!</strong> Game data has been fetched from Roblox. You can review and modify the information below before saving.
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Results Display */}
        {verificationResult && (
          <Card className="mb-4 border-l-4 transition-all duration-300" style={{ borderLeftColor: verificationResult.isValid ? COLORS.secondary : '#ef4444' }}>
            <CardHeader>
              <CardTitle className={verificationResult.isValid ? 'text-green-600' : 'text-red-600'}>
                API Key Verification Results
              </CardTitle>
              <CardDescription>
                Status: {verificationResult.isValid ? 'Valid' : 'Invalid'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-2xl font-bold text-blue-600">{verificationResult.summary.totalPermissions}</div>
                    <div className="text-sm text-blue-600">Total Tested</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-2xl font-bold text-green-600">{verificationResult.summary.accessiblePermissions}</div>
                    <div className="text-sm text-green-600">Accessible</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <div className="text-2xl font-bold text-red-600">{verificationResult.summary.restrictedPermissions}</div>
                    <div className="text-sm text-red-600">Restricted</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="roblox">Roblox Data</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-6">
              {/* Game Information Section */}
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-4">Game Information</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Game Name</Label>
                    <Input
                      id="name"
                      value={game.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter game name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="genre">Genre</Label>
                      <Input
                        id="genre"
                        value={game.genre || ''}
                        onChange={(e) => handleInputChange('genre', e.target.value)}
                        placeholder="Enter game genre"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subgenre">Subgenre 1</Label>
                      <Input
                        id="subgenre"
                        value={game.robloxInfo?.subgenre || ''}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Fetched from Roblox"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subgenre2">Subgenre 2</Label>
                      <Input
                        id="subgenre2"
                        value={game.robloxInfo?.subgenre2 || ''}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Fetched from Roblox"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={game.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter game description"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="createdDate">Created Date</Label>
                      <Input
                        id="createdDate"
                        value={game.robloxInfo?.dates?.created ? new Date(game.robloxInfo.dates.created).toLocaleDateString() : ''}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Fetched from Roblox"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="updatedDate">Last Updated</Label>
                      <Input
                        id="updatedDate"
                        value={game.robloxInfo?.dates?.updated ? new Date(game.robloxInfo.dates.updated).toLocaleDateString() : ''}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Fetched from Roblox"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="robloxLink">Roblox Link</Label>
                    <Input
                      id="robloxLink"
                      value={game.robloxLink || ''}
                      onChange={(e) => handleInputChange('robloxLink', e.target.value)}
                      placeholder="Enter Roblox game URL"
                    />
                  </div>
                </div>
              </Card>

              {/* Roblox Data Section */}
              {game.robloxInfo && (
                <Card className="p-4">
                  <h3 className="font-semibold text-lg mb-4">Roblox Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{game.robloxInfo.stats?.playing || 0}</div>
                      <div className="text-sm text-blue-600">Currently Playing</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{(game.robloxInfo.stats?.visits || 0).toLocaleString()}</div>
                      <div className="text-sm text-green-600">Total Visits</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">{(game.robloxInfo.stats?.favorites || 0).toLocaleString()}</div>
                      <div className="text-sm text-purple-600">Favorites</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">{game.robloxInfo.isActive ? 'Active' : 'Inactive'}</div>
                      <div className="text-sm text-orange-600">Status</div>
                    </div>
                  </div>
                  
                  {game.robloxInfo.dates && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="grid gap-2">
                        <Label>Created Date</Label>
                        <Input
                          value={game.robloxInfo.dates.created ? new Date(game.robloxInfo.dates.created).toLocaleDateString() : 'N/A'}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Last Updated</Label>
                        <Input
                          value={game.robloxInfo.dates.updated ? new Date(game.robloxInfo.dates.updated).toLocaleDateString() : 'N/A'}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Game Owner Section */}
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-4">Game Owner Information</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input
                        id="ownerName"
                        value={game.owner?.name || ''}
                        onChange={(e) => setGame(prev => ({ 
                          ...prev, 
                          owner: { 
                            ...prev.owner,
                            name: e.target.value,
                            email: prev.owner?.email || '',
                            discordId: prev.owner?.discordId || '',
                            country: prev.owner?.country || '',
                            robloxId: prev.owner?.robloxId || ''
                          } 
                        }))}
                        placeholder="Enter owner name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ownerRobloxId">Roblox ID</Label>
                      <Input
                        id="ownerRobloxId"
                        value={game.owner?.robloxId || ''}
                        onChange={(e) => setGame(prev => ({ 
                          ...prev, 
                          owner: { 
                            ...prev.owner,
                            robloxId: e.target.value,
                            name: prev.owner?.name || '',
                            email: prev.owner?.email || '',
                            discordId: prev.owner?.discordId || '',
                            country: prev.owner?.country || ''
                          } 
                        }))}
                        placeholder="Roblox ID (auto-filled from API)"
                        className="bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ownerEmail">Owner Email</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={game.owner?.email || ''}
                        onChange={(e) => setGame(prev => ({ 
                          ...prev, 
                          owner: { 
                            ...prev.owner,
                            email: e.target.value,
                            name: prev.owner?.name || '',
                            discordId: prev.owner?.discordId || '',
                            country: prev.owner?.country || '',
                            robloxId: prev.owner?.robloxId || ''
                          } 
                        }))}
                        placeholder="Enter owner email"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ownerDiscordId">Discord ID</Label>
                      <Input
                        id="ownerDiscordId"
                        value={game.owner?.discordId || ''}
                        onChange={(e) => setGame(prev => ({ 
                          ...prev, 
                          owner: { 
                            ...prev.owner,
                            discordId: e.target.value,
                            name: prev.owner?.name || '',
                            email: prev.owner?.email || '',
                            country: prev.owner?.country || '',
                            robloxId: prev.owner?.robloxId || ''
                          } 
                        }))}
                        placeholder="Enter Discord ID"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ownerCountry">Country</Label>
                      <Select onValueChange={(value) => setGame(prev => ({ 
                        ...prev, 
                        owner: { 
                          ...prev.owner,
                          country: value,
                          name: prev.owner?.name || '',
                          email: prev.owner?.email || '',
                          discordId: prev.owner?.discordId || '',
                          robloxId: prev.owner?.robloxId || ''
                        } 
                      }))} defaultValue={game.owner?.country || ''}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: COLORS.accent }}>
              <CardHeader>
                <CardTitle className="text-primary">Import Metrics</CardTitle>
                <CardDescription>
                  Import your game metrics from Roblox CSV files. Download these files from your Roblox Developer Dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show warning for new games */}
                  {(!game.id || game.id === '') && (
                    <Alert>
                      <AlertDescription>
                        Please save the game first before importing metrics data. CSV import is only available for existing games.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".csv"
                      multiple
                      onChange={handleFileChange}
                      disabled={isUploading || !game.id || game.id === ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                      onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                      disabled={isUploading || !game.id || game.id === ''}
                      className="w-[150px]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : (!game.id || game.id === '') ? 'Save Game First' : 'Import Files'}
                    </Button>
                  </div>

                  {importSummary && (
                    <div className="space-y-4">
                      <Alert>
                        <AlertDescription>
                          <div className="space-y-2">
                            <p>Import Summary:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Files: {importSummary.processedFiles} processed, {importSummary.skippedFiles} skipped</li>
                              <li>Records: {importSummary.newRecords} new, {importSummary.updatedRecords} updated, {importSummary.skippedRecords} skipped</li>
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>

                      {importSummary.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            <div className="space-y-2">
                              <p>Errors:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {importSummary.errors.map((error, index) => (
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
                          {importSummary.fileDetails.map((file, index) => (
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
          </TabsContent>

          <TabsContent value="roblox" className="space-y-4">
            <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: COLORS.primary }}>
              <CardHeader>
                <CardTitle className="text-primary">Roblox API Configuration</CardTitle>
                <CardDescription>
                  Configure your Roblox API key to fetch live game data and verify permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Roblox API Key</label>
                      <Input
                        type="password"
                        placeholder="Enter your Roblox Open Cloud API key"
                        value={robloxApiKey}
                        onChange={(e) => setRobloxApiKey(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Universe ID (Optional)</label>
                      <Input
                        type="text"
                        placeholder="Enter your game's Universe ID"
                        value={robloxUniverseId}
                        onChange={(e) => setRobloxUniverseId(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleVerifyApiKey}
                      disabled={isLoading || !robloxApiKey}
                      className="w-[150px]"
                      variant="outline"
                    >
                      {isLoading ? 'Verifying...' : 'Verify Key'}
                    </Button>
                    {robloxUniverseId && (
                      <Button
                        onClick={handleFetchRobloxData}
                        disabled={isFetchingRobloxData || !robloxApiKey || !robloxUniverseId}
                        className="w-[150px]"
                      >
                        {isFetchingRobloxData ? 'Fetching...' : 'Fetch Game Data'}
                      </Button>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {robloxUniverseId ? 'Verify key first, then fetch game data' : 'This will test your API key permissions'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {verificationResult && (
              <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: verificationResult.isValid ? COLORS.secondary : '#ef4444' }}>
                <CardHeader>
                  <CardTitle className={verificationResult.isValid ? 'text-green-600' : 'text-red-600'}>
                    Verification Results
                  </CardTitle>
                  <CardDescription>
                    API Key: {verificationResult.apiKey} | Status: {verificationResult.isValid ? 'Valid' : 'Invalid'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-2xl font-bold text-blue-600">{verificationResult.summary.totalPermissions}</div>
                        <div className="text-sm text-blue-600">Total Tested</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-2xl font-bold text-green-600">{verificationResult.summary.accessiblePermissions}</div>
                        <div className="text-sm text-green-600">Accessible</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded">
                        <div className="text-2xl font-bold text-red-600">{verificationResult.summary.restrictedPermissions}</div>
                        <div className="text-sm text-red-600">Restricted</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Detailed Permissions:</h4>
                      <div className="space-y-1">
                        {verificationResult.capabilities.map((cap: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${cap.accessible ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="font-medium">{cap.feature}</span>
                              <span className="text-sm text-gray-500">({cap.permission})</span>
                            </div>
                            {!cap.accessible && cap.error && (
                              <span className="text-xs text-red-600 max-w-xs truncate">{cap.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {verificationResult.universeId && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm"><strong>Universe ID:</strong> {verificationResult.universeId}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Universe-specific permissions were tested with this ID
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card className="border-l-4 transition-all duration-300" style={{ borderLeftColor: COLORS.secondary }}>
              <CardHeader>
                <CardTitle className="text-primary">Media Files</CardTitle>
                <CardDescription>
                  Manage your game's media files and view images fetched from Roblox
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Manual Thumbnail Input */}
                  <div className="grid gap-2">
                    <Label htmlFor="thumbnail">Thumbnail URL (Manual)</Label>
                    <Input
                      id="thumbnail"
                      value={game.thumbnail || ''}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                      placeholder="Enter thumbnail URL manually"
                    />
                  </div>

                  {/* Roblox Images Section */}
                  {game.robloxInfo?.images && game.robloxInfo.images.length > 0 && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-lg mb-2">Roblox Images</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Images automatically fetched from Roblox API
                        </p>
                        
                        {/* Group by type */}
                        {['thumbnail', 'icon'].map(imageType => {
                          const imagesOfType = game.robloxInfo?.images?.filter((img: any) => img.type === imageType) || [];
                          if (imagesOfType.length === 0) return null;
                          
                          return (
                            <div key={imageType} className="space-y-3">
                              <h5 className="font-medium capitalize text-md">
                                {imageType}s ({imagesOfType.length})
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {imagesOfType.map((image: any) => (
                                  <div key={image.id} className="rounded-lg border overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                      <img
                                        src={image.url}
                                        alt={image.title || `Game ${imageType}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                        }}
                                      />
                                    </div>
                                    <div className="p-3">
                                      <h6 className="font-medium text-sm">{image.title}</h6>
                                      <div className="flex flex-col gap-1 mt-2">
                                        <p className="text-xs text-muted-foreground">
                                          Type: <span className="font-medium">{image.type}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Status: <span className="font-medium text-green-600">{image.state}</span>
                                        </p>
                                        {image.targetId && (
                                          <p className="text-xs text-muted-foreground">
                                            ID: <span className="font-mono">{image.targetId}</span>
                                          </p>
                                        )}
                                      </div>
                                      <div className="mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setGame(prev => ({ ...prev, thumbnail: image.url }));
                                          }}
                                          className="w-full text-xs"
                                        >
                                          Use as Thumbnail
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Existing Media Files */}
                  {game.media && game.media.length > 0 && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-lg mb-2">Uploaded Media Files</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Media files uploaded manually
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {game.media.map((media) => (
                            <div key={media.id} className="rounded-lg border overflow-hidden">
                              {media.thumbnailUrl && (
                                <img
                                  src={media.thumbnailUrl}
                                  alt={media.title || 'Game media'}
                                  className="w-full h-48 object-cover"
                                />
                              )}
                              <div className="p-4">
                                <h4 className="font-medium">{media.title || 'Untitled'}</h4>
                                <p className="text-sm text-muted-foreground">{media.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Images Message */}
                  {(!game.robloxInfo?.images || game.robloxInfo.images.length === 0) && 
                   (!game.media || game.media.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No media files available.</p>
                      <p className="text-sm mt-1">
                        Fetch game data from Roblox API to automatically load images, or upload files manually.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}