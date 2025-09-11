"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AdminLayout from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  RefreshCw,
  Settings,
  Bell,
  Target,
  TrendingUp,
  BarChart3
} from "lucide-react"

interface TimeLimit {
  id: string
  stage: string
  defaultDays: number
  minDays: number
  maxDays: number
  autoExtend: boolean
  autoExtendDays: number
  reminderDays: number[]
  escalationDays: number
  isActive: boolean
  description: string
}

interface TimeLimitStats {
  totalActive: number
  onTime: number
  extended: number
  overdue: number
  averageCompletionTime: number
  stages: {
    [key: string]: {
      onTime: number
      overdue: number
      average: number
    }
  }
}

interface ActiveDeadline {
  id: string
  submissionId: string
  submissionTitle: string
  stage: string
  assignedTo: string
  assignedToName: string
  deadline: string
  daysRemaining: number
  status: "on_time" | "warning" | "overdue"
  canExtend: boolean
  extensionsUsed: number
  maxExtensions: number
}

export default function AdminTimeLimitsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [timeLimits, setTimeLimits] = useState<TimeLimit[]>([])
  const [stats, setStats] = useState<TimeLimitStats>({
    totalActive: 0,
    onTime: 0,
    extended: 0,
    overdue: 0,
    averageCompletionTime: 0,
    stages: {}
  })
  const [activeDeadlines, setActiveDeadlines] = useState<ActiveDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchTimeLimitData()
  }, [])

  const fetchTimeLimitData = async () => {
    try {
      setLoading(true)
      const [limitsRes, statsRes, deadlinesRes] = await Promise.all([
        fetch('/api/admin/time-limits'),
        fetch('/api/admin/time-limits/stats'),
        fetch('/api/admin/time-limits/active-deadlines')
      ])
      
      if (limitsRes.ok) {
        const limitsData = await limitsRes.json()
        setTimeLimits(limitsData.timeLimits || [])
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
      
      if (deadlinesRes.ok) {
        const deadlinesData = await deadlinesRes.json()
        setActiveDeadlines(deadlinesData.deadlines || [])
      }
    } catch (error) {
      console.error('Error fetching time limit data:', error)
      toast.error('Failed to fetch time limit data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTimeLimit = async (id: string, updates: Partial<TimeLimit>) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/time-limits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        toast.success('Time limit updated successfully')
        setTimeLimits(prev => prev.map(limit => 
          limit.id === id ? { ...limit, ...updates } : limit
        ))
        setEditingId(null)
      } else {
        toast.error('Failed to update time limit')
      }
    } catch (error) {
      console.error('Error updating time limit:', error)
      toast.error('Failed to update time limit')
    } finally {
      setSaving(false)
    }
  }

  const handleExtendDeadline = async (deadlineId: string, extensionDays: number, reason: string) => {
    try {
      const response = await fetch(`/api/admin/time-limits/extend/${deadlineId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionDays, reason })
      })
      
      if (response.ok) {
        toast.success('Deadline extended successfully')
        fetchTimeLimitData()
      } else {
        toast.error('Failed to extend deadline')
      }
    } catch (error) {
      console.error('Error extending deadline:', error)
      toast.error('Failed to extend deadline')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_time": return "bg-green-100 text-green-800"
      case "warning": return "bg-yellow-100 text-yellow-800"
      case "overdue": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const defaultTimeLimits: Partial<TimeLimit>[] = [
    {
      stage: "initial_review",
      defaultDays: 14,
      minDays: 7,
      maxDays: 30,
      description: "Initial editorial review and technical check"
    },
    {
      stage: "peer_review",
      defaultDays: 30,
      minDays: 14,
      maxDays: 60,
      description: "Peer review process"
    },
    {
      stage: "revision",
      defaultDays: 45,
      minDays: 21,
      maxDays: 90,
      description: "Author revision period"
    },
    {
      stage: "final_decision",
      defaultDays: 7,
      minDays: 3,
      maxDays: 14,
      description: "Final editorial decision"
    },
    {
      stage: "copyediting",
      defaultDays: 21,
      minDays: 10,
      maxDays: 42,
      description: "Copyediting and proofreading"
    },
    {
      stage: "production",
      defaultDays: 14,
      minDays: 7,
      maxDays: 28,
      description: "Final production and publishing"
    }
  ]

  if (loading) {
    return (
      <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
        <AdminLayout>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
      <AdminLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Time Limits Management</h1>
            <p className="text-slate-600 mt-2">Configure deadlines and monitor submission timelines</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={fetchTimeLimitData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalActive}</div>
              <div className="text-sm text-gray-600">Active Deadlines</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.onTime}</div>
              <div className="text-sm text-gray-600">On Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.extended}</div>
              <div className="text-sm text-gray-600">Extended</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">{stats.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{stats.averageCompletionTime}</div>
              <div className="text-sm text-gray-600">Avg. Days</div>
            </CardContent>
          </Card>
        </div>

        {/* Time Limits Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Time Limit Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Default Days</TableHead>
                  <TableHead>Min/Max Days</TableHead>
                  <TableHead>Auto Extend</TableHead>
                  <TableHead>Reminders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeLimits.length > 0 ? timeLimits.map((limit) => (
                  <TableRow key={limit.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium capitalize">{limit.stage.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">{limit.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingId === limit.id ? (
                        <Input
                          type="number"
                          value={limit.defaultDays}
                          onChange={(e) => setTimeLimits(prev => prev.map(l => 
                            l.id === limit.id ? { ...l, defaultDays: parseInt(e.target.value) } : l
                          ))}
                          className="w-20"
                        />
                      ) : (
                        <span className="font-medium">{limit.defaultDays} days</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === limit.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={limit.minDays}
                            onChange={(e) => setTimeLimits(prev => prev.map(l => 
                              l.id === limit.id ? { ...l, minDays: parseInt(e.target.value) } : l
                            ))}
                            className="w-16"
                            placeholder="Min"
                          />
                          <Input
                            type="number"
                            value={limit.maxDays}
                            onChange={(e) => setTimeLimits(prev => prev.map(l => 
                              l.id === limit.id ? { ...l, maxDays: parseInt(e.target.value) } : l
                            ))}
                            className="w-16"
                            placeholder="Max"
                          />
                        </div>
                      ) : (
                        <span className="text-sm">{limit.minDays} - {limit.maxDays} days</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={limit.autoExtend}
                          onCheckedChange={(checked) => setTimeLimits(prev => prev.map(l => 
                            l.id === limit.id ? { ...l, autoExtend: checked } : l
                          ))}
                          disabled={editingId !== limit.id}
                        />
                        {limit.autoExtend && (
                          <span className="text-sm text-gray-500">+{limit.autoExtendDays}d</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {limit.reminderDays?.map((day, index) => (
                          <Badge key={index} variant="outline" className="mr-1">
                            {day}d
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={limit.isActive}
                        onCheckedChange={(checked) => handleUpdateTimeLimit(limit.id, { isActive: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingId === limit.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateTimeLimit(limit.id, timeLimits.find(l => l.id === limit.id)!)}
                              disabled={saving}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(null)
                                fetchTimeLimitData()
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(limit.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  defaultTimeLimits.map((limit, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium capitalize">{limit.stage?.replace('_', ' ')}</div>
                          <div className="text-sm text-gray-500">{limit.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{limit.defaultDays} days</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{limit.minDays} - {limit.maxDays} days</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Not Configured</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Not Set</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Inactive</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Active Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Deadlines ({activeDeadlines.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submission</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Extensions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDeadlines.map((deadline) => (
                  <TableRow key={deadline.id}>
                    <TableCell>
                      <div className="font-medium truncate max-w-xs">
                        {deadline.submissionTitle}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {deadline.stage.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{deadline.assignedToName}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(deadline.deadline).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {deadline.daysRemaining > 0 ? `${deadline.daysRemaining} days left` : 
                           deadline.daysRemaining === 0 ? 'Due today' : 
                           `${Math.abs(deadline.daysRemaining)} days overdue`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(deadline.status)} variant="outline">
                        {deadline.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {deadline.extensionsUsed} / {deadline.maxExtensions}
                      </div>
                    </TableCell>
                    <TableCell>
                      {deadline.canExtend && deadline.extensionsUsed < deadline.maxExtensions && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExtendDeadline(deadline.id, 7, "Administrative extension")}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Extend
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AdminLayout>
    </RouteGuard>
  )
}