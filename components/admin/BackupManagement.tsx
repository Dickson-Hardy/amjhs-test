'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  CloudIcon, 
  DatabaseIcon, 
  FolderIcon, 
  DownloadIcon, 
  TrashIcon, 
  ClockIcon, 
  ShieldCheckIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshCwIcon
} from 'lucide-react'

interface BackupItem {
  type: string
  filename: string
  size: string
  created: string
  modified: string
}

interface BackupHistory {
  action: string
  details: string
  createdAt: string
  userId: string
}

interface ScheduleItem {
  id: string
  name: string
  frequency: string
  time: string
  backupType: string
  storage: string
  enabled: boolean
  lastRun: string
  nextRun: string
  status: string
}

export default function BackupManagement() {
  const [activeTab, setActiveTab] = useState('create')
  const [loading, setLoading] = useState(false)
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [availableBackups, setAvailableBackups] = useState<BackupItem[]>([])
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  
  // Create backup form state
  const [backupType, setBackupType] = useState('full')
  const [storageType, setStorageType] = useState('s3')
  const [compression, setCompression] = useState(true)
  const [encryption, setEncryption] = useState(true)
  
  // Schedule form state
  const [scheduleFrequency, setScheduleFrequency] = useState('daily')
  const [scheduleTime, setScheduleTime] = useState('02:00')
  const [scheduleBackupType, setScheduleBackupType] = useState('database')
  const [scheduleStorage, setScheduleStorage] = useState('s3')
  const [scheduleEnabled, setScheduleEnabled] = useState(true)

  useEffect(() => {
    fetchBackupData()
  }, [])

  const fetchBackupData = async () => {
    try {
      const [historyRes, backupsRes, schedulesRes] = await Promise.all([
        fetch('/api/admin/backup/create'),
        fetch('/api/admin/backup/restore'),
        fetch('/api/admin/backup/schedule')
      ])

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setBackupHistory(historyData.backupHistory || [])
      }

      if (backupsRes.ok) {
        const backupsData = await backupsRes.json()
        setAvailableBackups(backupsData.availableBackups || [])
      }

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json()
        setSchedules(schedulesData.schedules || [])
      }
    } catch (error) {
      logger.error('Error fetching backup data:', error)
    }
  }

  const createBackup = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: backupType,
          storage: storageType,
          compression,
          encryption
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Backup created successfully!\nSize: ${result.size}\nLocation: ${result.location}`)
        fetchBackupData() // Refresh data
      } else {
        alert(`Backup failed: ${result.error}`)
      }
    } catch (error) {
      logger.error('Error creating backup:', error)
      alert('Backup creation failed')
    } finally {
      setLoading(false)
    }
  }

  const createSchedule = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/backup/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: scheduleEnabled,
          frequency: scheduleFrequency,
          time: scheduleTime,
          backupType: scheduleBackupType,
          storage: scheduleStorage,
          retention: 7,
          compression: true,
          encryption: true,
          notifyOnSuccess: true,
          notifyOnFailure: true,
          emailNotifications: []
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Backup schedule created successfully!\nNext run: ${result.implementation.nextRun}`)
        fetchBackupData()
      } else {
        alert(`Schedule creation failed: ${result.error}`)
      }
    } catch (error) {
      logger.error('Error creating schedule:', error)
      alert('Schedule creation failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadBackup = (filename: string) => {
    window.open(`/api/admin/backup/download/${filename}`, '_blank')
  }

  const restoreBackup = async (filename: string, type: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupFile: filename,
          restoreType: type,
          confirmRestore: true
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert('Restore completed successfully!')
        fetchBackupData()
      } else {
        alert(`Restore failed: ${result.error}`)
      }
    } catch (error) {
      logger.error('Error restoring backup:', error)
      alert('Restore failed')
    } finally {
      setLoading(false)
    }
  }

  const getBackupIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <DatabaseIcon className="h-4 w-4" />
      case 'files':
        return <FolderIcon className="h-4 w-4" />
      case 'full':
      case 'manifest':
        return <CloudIcon className="h-4 w-4" />
      default:
        return <FolderIcon className="h-4 w-4" />
    }
  }

  const getStorageIcon = (storage: string) => {
    switch (storage) {
      case 's3':
        return <CloudIcon className="h-4 w-4 text-orange-500" />
      case 'cloudinary':
        return <CloudIcon className="h-4 w-4 text-blue-500" />
      case 'local':
        return <FolderIcon className="h-4 w-4 text-gray-500" />
      default:
        return <FolderIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backup Management</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage system backups
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchBackupData} variant="outline" size="sm">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Backup</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Backup</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudIcon className="h-5 w-5" />
                Create New Backup
              </CardTitle>
              <CardDescription>
                Create an immediate backup of your journal system data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backup-type">Backup Type</Label>
                  <Select value={backupType} onValueChange={setBackupType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">Database Only</SelectItem>
                      <SelectItem value="files">Files Only</SelectItem>
                      <SelectItem value="full">Full System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="storage-type">Storage Location</Label>
                  <Select value={storageType} onValueChange={setStorageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="s3">AWS S3 (Recommended)</SelectItem>
                      <SelectItem value="cloudinary">Cloudinary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="compression"
                    checked={compression}
                    onCheckedChange={setCompression}
                  />
                  <Label htmlFor="compression">Enable Compression</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="encryption"
                    checked={encryption}
                    onCheckedChange={setEncryption}
                  />
                  <Label htmlFor="encryption">Enable Encryption</Label>
                </div>
              </div>

              <Button 
                onClick={createBackup} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <CloudIcon className="h-4 w-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Schedule Automatic Backups
              </CardTitle>
              <CardDescription>
                Set up automatic backup schedules for regular data protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="schedule-frequency">Frequency</Label>
                  <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="schedule-backup-type">Backup Type</Label>
                  <Select value={scheduleBackupType} onValueChange={setScheduleBackupType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="files">Files</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule-storage">Storage</Label>
                  <Select value={scheduleStorage} onValueChange={setScheduleStorage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="s3">AWS S3</SelectItem>
                      <SelectItem value="cloudinary">Cloudinary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="schedule-enabled"
                    checked={scheduleEnabled}
                    onCheckedChange={setScheduleEnabled}
                  />
                  <Label htmlFor="schedule-enabled">Enable Schedule</Label>
                </div>
              </div>

              <Button 
                onClick={createSchedule} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    Creating Schedule...
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Create Schedule
                  </>
                )}
              </Button>

              {/* Active Schedules */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Active Schedules</h3>
                <div className="space-y-2">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{schedule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.frequency} at {schedule.time} • Next: {new Date(schedule.nextRun).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={schedule.enabled ? "default" : "secondary"}>
                          {schedule.enabled ? "Active" : "Disabled"}
                        </Badge>
                        {getStorageIcon(schedule.storage)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                Available Backups
              </CardTitle>
              <CardDescription>
                Download or restore from available backup files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableBackups.map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getBackupIcon(backup.type)}
                      <div>
                        <p className="font-medium">{backup.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {backup.size} • Created: {new Date(backup.created).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{backup.type}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadBackup(backup.filename)}
                      >
                        <DownloadIcon className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <ShieldCheckIcon className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will restore data from <strong>{backup.filename}</strong> and may overwrite existing data. 
                              This action cannot be undone. Are you sure you want to continue?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => restoreBackup(backup.filename, backup.type)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Restore
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {availableBackups.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No backup files found. Create your first backup to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Backup History
              </CardTitle>
              <CardDescription>
                View recent backup activities and system logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backupHistory.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-1">
                      {entry.action.includes('Failed') ? (
                        <AlertTriangleIcon className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{entry.action}</p>
                      <p className="text-sm text-muted-foreground">{entry.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {backupHistory.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No backup history available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
