"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AdminLayout from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  HardDrive,
  Cloud,
  Server,
  BarChart3
} from "lucide-react"

interface BackupRecord {
  id: string
  type: 'full' | 'incremental' | 'manual'
  status: 'completed' | 'in_progress' | 'failed'
  size: string
  createdAt: string
  completedAt?: string
  downloadUrl?: string
}

interface BackupSettings {
  autoBackup: boolean
  backupFrequency: string
  retentionDays: number
  includeFiles: boolean
  compressionEnabled: boolean
}

export default function BackupPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    includeFiles: true,
    compressionEnabled: true
  })
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBackups()
    fetchSettings()
  }, [])

  const fetchBackups = async () => {
    try {
      // Mock data - replace with actual API call
      const mockBackups: BackupRecord[] = [
        {
          id: "1",
          type: "full",
          status: "completed",
          size: "2.4 GB",
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          completedAt: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
          downloadUrl: "#"
        },
        {
          id: "2",
          type: "incremental",
          status: "completed",
          size: "156 MB",
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          completedAt: new Date(Date.now() - 169200000).toISOString(), // 47 hours ago
          downloadUrl: "#"
        },
        {
          id: "3",
          type: "manual",
          status: "in_progress",
          size: "0 MB",
          createdAt: new Date().toISOString()
        }
      ]
      setBackups(mockBackups)
    } catch (error) {
      toast.error("Failed to load backup records")
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      // Mock settings - replace with actual API call
      // Using the current settings state as default
    } catch (error) {
      console.error('Failed to load backup settings:', error)
    }
  }

  const handleCreateBackup = async (type: 'full' | 'incremental' | 'manual') => {
    setCreatingBackup(true)
    try {
      // Mock backup creation - replace with actual API call
      console.log('Creating backup:', { type, user: session?.user?.email })

      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000))

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} backup created successfully!`)

      // Refresh backup list
      fetchBackups()

    } catch (error) {
      toast.error("Failed to create backup")
      console.error('Error creating backup:', error)
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleDownloadBackup = (backupId: string) => {
    // Mock download - replace with actual download logic
    toast.success("Backup download started")
  }

  const handleRestoreBackup = async (backupId: string) => {
    setRestoringBackup(true)
    try {
      // Mock restore process - replace with actual API call
      console.log('Restoring backup:', backupId)

      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 5000))

      toast.success("Backup restored successfully!")

    } catch (error) {
      toast.error("Failed to restore backup")
      console.error('Error restoring backup:', error)
    } finally {
      setRestoringBackup(false)
    }
  }

  const handleUpdateSettings = async () => {
    try {
      // Mock settings update - replace with actual API call
      console.log('Updating backup settings:', settings)

      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success("Backup settings updated successfully!")

    } catch (error) {
      toast.error("Failed to update settings")
      console.error('Error updating settings:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'full':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Full</Badge>
      case 'incremental':
        return <Badge variant="outline" className="border-green-500 text-green-700">Incremental</Badge>
      case 'manual':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">Manual</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  return (
    <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Database Backup</h1>
              <p className="text-gray-600">Manage database backups and restore operations</p>
            </div>
            <Button onClick={() => router.push('/admin/dashboard')}>
              <Database className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-blue-600" />
                  Create Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleCreateBackup('full')}
                  disabled={creatingBackup}
                  className="w-full"
                  variant="default"
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  {creatingBackup ? 'Creating...' : 'Full Backup'}
                </Button>

                <Button
                  onClick={() => handleCreateBackup('incremental')}
                  disabled={creatingBackup}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Incremental Backup
                </Button>

                <Button
                  onClick={() => handleCreateBackup('manual')}
                  disabled={creatingBackup}
                  className="w-full"
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manual Backup
                </Button>

                {creatingBackup && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Creating backup...</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Backup Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                  Backup Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {backups.filter(b => b.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Total Backups</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {backups.filter(b => b.status === 'completed').length > 0 ? '100%' : '0%'}
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Used</span>
                    <span>2.4 GB</span>
                  </div>
                  <Progress value={75} />
                  <div className="text-xs text-gray-500">75% of allocated space</div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-600">Last Backup</div>
                  <div className="font-medium">
                    {backups.length > 0 ? new Date(backups[0].createdAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Backup Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Backup Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoBackup">Auto Backup</Label>
                  <Switch
                    id="autoBackup"
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                  />
                </div>

                <div>
                  <Label htmlFor="frequency">Backup Frequency</Label>
                  <Select
                    value={settings.backupFrequency}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, backupFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compression">Compression</Label>
                  <Switch
                    id="compression"
                    checked={settings.compressionEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, compressionEnabled: checked }))}
                  />
                </div>

                <Button onClick={handleUpdateSettings} className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Update Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-600" />
                Backup History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading backup history...</div>
              ) : (
                <div className="space-y-4">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {backup.status === 'completed' ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          ) : backup.status === 'in_progress' ? (
                            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                          ) : (
                            <XCircle className="h-8 w-8 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">
                              {backup.type.charAt(0).toUpperCase() + backup.type.slice(1)} Backup
                            </h4>
                            {getTypeBadge(backup.type)}
                            {getStatusBadge(backup.status)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(backup.createdAt).toLocaleString()}
                            {backup.completedAt && ` • Completed: ${new Date(backup.completedAt).toLocaleString()}`}
                          </p>
                          <p className="text-sm text-gray-500">Size: {backup.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {backup.status === 'completed' && backup.downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        {backup.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={restoringBackup}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {restoringBackup ? 'Restoring...' : 'Restore'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}