import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Game } from '@/types/game'

interface GameManagerProps {
  games: Game[]
}

export function GameManager({ games }: GameManagerProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleThumbnailChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setThumbnailFile(file)
  }

  const handleSetThumbnail = async () => {
    if (!selectedGame || !thumbnailFile) return

    const formData = new FormData()
    formData.append('thumbnail', thumbnailFile)

    try {
      const response = await fetch(
        `/api/game-owner/games/${selectedGame.id}/thumbnail`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Game thumbnail updated successfully',
        })
      } else {
        throw new Error(data.error || 'Failed to update thumbnail')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update thumbnail',
        variant: 'destructive',
      })
    }
  }

  const handleViewInRoblox = (gameId: string) => {
    window.open(`https://www.roblox.com/games/${gameId}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Manager</CardTitle>
          <CardDescription>
            Manage your Roblox games and their settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    <img
                      src={game.thumbnail || '/placeholder.svg'}
                      alt={game.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell>{game.description}</TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGame(game)}
                      >
                        Set Thumbnail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInRoblox(game.id)}
                      >
                        View in Roblox
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedGame && (
        <Card>
          <CardHeader>
            <CardTitle>Update Thumbnail - {selectedGame.name}</CardTitle>
            <CardDescription>
              Upload a new thumbnail for your game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="thumbnail">Thumbnail Image</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </div>
              <Button onClick={handleSetThumbnail} disabled={!thumbnailFile}>
                Upload Thumbnail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 