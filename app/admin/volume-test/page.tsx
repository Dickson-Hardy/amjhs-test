"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen, 
  Database,
  Plus,
  RotateCcw as Refresh,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface VolumeInfo {
  id: string
  number: string
  year: number
  title?: string
  status: string
  createdAt: string
  updatedAt: string
}

interface DatabaseCheck {
  volumes: VolumeInfo[]
  summary: {
    total: number
    byStatus: Record<string, number>
  }
}

export default function VolumeTestPage() {
  const [dbCheck, setDbCheck] = useState<DatabaseCheck | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  
  const [volumeForm, setVolumeForm] = useState({
    number: '1',
    year: 2025,
    title: 'Inaugural Volume',
    description: 'The first volume of AMHSJ featuring pioneering research in medicine and health sciences.'
  })

  useEffect(() => {
    checkDatabase()
  }, [])

  async function checkDatabase() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/volumes/check')
      const data = await response.json()

      if (data.success) {
        setDbCheck(data)
      } else {
        throw new Error(data.error || 'Failed to check database')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to check database: ${(error as Error).message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function createVolume() {
    try {
      setCreating(true)
      const response = await fetch('/api/admin/volumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(volumeForm)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || `Volume ${volumeForm.number} created successfully`,
          variant: "default"
        })
        
        // Refresh database check
        await checkDatabase()
        
        // Clear form
        setVolumeForm({
          number: '',
          year: new Date().getFullYear(),
          title: '',
          description: ''
        })
      } else {
        // Handle different types of errors
        if (response.status === 409 && data.existingVolume) {
          toast({
            title: "Volume Exists",
            description: `Volume ${data.existingVolume.number} (${data.existingVolume.year}) already exists with status: ${data.existingVolume.status}`,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Error",
            description: data.error || 'Failed to create volume',
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create volume: ${(error as Error).message}`,
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Volume Management Test</h1>
          <p className="text-gray-600">Check database status and test volume creation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Status
                  </CardTitle>
                  <CardDescription>Current volumes in the database</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkDatabase}
                  disabled={loading}
                >
                  <Refresh className="h-4 w-4 mr-2" />
                  {loading ? 'Checking...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dbCheck ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{dbCheck.summary.total}</p>
                      <p className="text-sm text-blue-800">Total Volumes</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {dbCheck.summary.byStatus?.published || 0}
                      </p>
                      <p className="text-sm text-green-800">Published</p>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div>
                    <h4 className="font-medium mb-2">By Status:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(dbCheck.summary.byStatus || {}).map(([status, count]) => (
                        <Badge key={status} variant="outline">
                          {status}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Volume List */}
                  <div>
                    <h4 className="font-medium mb-2">Existing Volumes:</h4>
                    {dbCheck.volumes.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No volumes found in database</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dbCheck.volumes.map((volume) => (
                          <div key={volume.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">
                                  Volume {volume.number} ({volume.year})
                                </h5>
                                {volume.title && (
                                  <p className="text-sm text-gray-600">{volume.title}</p>
                                )}
                              </div>
                              <Badge 
                                variant={volume.status === 'published' ? 'default' : 'secondary'}
                              >
                                {volume.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Created: {new Date(volume.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Click refresh to check database</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Volume */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Volume
              </CardTitle>
              <CardDescription>Test volume creation with your parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number">Volume Number</Label>
                    <Input
                      id="number"
                      value={volumeForm.number}
                      onChange={(e) => setVolumeForm(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="e.g., 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={volumeForm.year}
                      onChange={(e) => setVolumeForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      placeholder="e.g., 2025"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={volumeForm.title}
                    onChange={(e) => setVolumeForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Inaugural Volume"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={volumeForm.description}
                    onChange={(e) => setVolumeForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the volume"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={createVolume} 
                  disabled={creating || !volumeForm.number || !volumeForm.year}
                  className="w-full"
                >
                  {creating ? 'Creating...' : 'Create Volume'}
                </Button>

                {/* Info Box */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Smart Creation:</p>
                      <ul className="text-xs space-y-1">
                        <li>• If volume exists as draft, it will be updated</li>
                        <li>• If volume exists as published, you'll get an error</li>
                        <li>• New volumes are created as "draft" status</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => window.open('/admin/volume-management', '_blank')}>
              <BookOpen className="h-4 w-4 mr-2" />
              Open Volume Management
            </Button>
            <Button variant="outline" onClick={() => window.open('/archive', '_blank')}>
              <Database className="h-4 w-4 mr-2" />
              View Public Archive
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}