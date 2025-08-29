"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Save,
  RefreshCw,
  Bell,
  Calendar,
  Zap
} from "lucide-react"

interface TimeLimit {
  id?: string
  stage: string
  timeLimitDays: number
  reminderDays: number[]
  escalationDays: number[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

interface TimeLimitManagerProps {
  onSave: (timeLimits: TimeLimit[]) => void
  onCancel: () => void
  isReadOnly?: boolean
}

const DEFAULT_TIME_LIMITS: TimeLimit[] = [
  {
    stage: "editorial-assistant-review",
    timeLimitDays: 3,
    reminderDays: [1, 2],
    escalationDays: [1, 2, 3],
    isActive: true
  },
  {
    stage: "associate-editor-assignment",
    timeLimitDays: 2,
    reminderDays: [1],
    escalationDays: [1, 2],
    isActive: true
  },
  {
    stage: "associate-editor-review",
    timeLimitDays: 7,
    reminderDays: [3, 5],
    escalationDays: [2, 5, 7],
    isActive: true
  },
  {
    stage: "reviewer-assignment",
    timeLimitDays: 5,
    reminderDays: [2, 4],
    escalationDays: [2, 4, 5],
    isActive: true
  },
  {
    stage: "reviewer-review",
    timeLimitDays: 21,
    reminderDays: [7, 14, 18],
    escalationDays: [7, 14, 21, 28],
    isActive: true
  },
  {
    stage: "associate-editor-decision",
    timeLimitDays: 5,
    reminderDays: [2, 4],
    escalationDays: [2, 4, 5],
    isActive: true
  },
  {
    stage: "editor-in-chief-review",
    timeLimitDays: 3,
    reminderDays: [1, 2],
    escalationDays: [1, 2, 3],
    isActive: true
  },
  {
    stage: "production",
    timeLimitDays: 14,
    reminderDays: [7, 10, 12],
    escalationDays: [7, 10, 14, 21],
    isActive: true
  }
]

const STAGE_DISPLAY_NAMES = {
  "editorial-assistant-review": "Editorial Assistant Review",
  "associate-editor-assignment": "Associate Editor Assignment",
  "associate-editor-review": "Associate Editor Review",
  "reviewer-assignment": "Reviewer Assignment",
  "reviewer-review": "Reviewer Review",
  "associate-editor-decision": "Associate Editor Decision",
  "editor-in-chief-review": "Editor-in-Chief Review",
  "production": "Production"
}

const STAGE_DESCRIPTIONS = {
  "editorial-assistant-review": "Initial screening and quality check",
  "associate-editor-assignment": "Selection and assignment of associate editor",
  "associate-editor-review": "Content evaluation and reviewer selection",
  "reviewer-assignment": "Reviewer invitation and acceptance",
  "reviewer-review": "Peer review process",
  "associate-editor-decision": "Decision based on reviewer feedback",
  "editor-in-chief-review": "Final editorial decision",
  "production": "Publication preparation and formatting"
}

export function TimeLimitManager({
  onSave,
  onCancel,
  isReadOnly = false
}: TimeLimitManagerProps) {
  const [timeLimits, setTimeLimits] = useState<TimeLimit[]>(DEFAULT_TIME_LIMITS)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchTimeLimits()
  }, [])

  const fetchTimeLimits = async () => {
    try {
      const response = await fetch('/api/admin/time-limits')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.timeLimits) {
          setTimeLimits(data.timeLimits)
        }
      }
    } catch (error) {
      logger.error('Error fetching time limits:', error)
    }
  }

  const handleTimeLimitChange = (stage: string, field: keyof TimeLimit, value: unknown) => {
    setTimeLimits(prev => prev.map(tl => 
      tl.stage === stage ? { ...tl, [field]: value } : tl
    ))
    setHasChanges(true)
  }

  const handleReminderDaysChange = (stage: string, value: string) => {
    const days = value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
    handleTimeLimitChange(stage, 'reminderDays', days)
  }

  const handleEscalationDaysChange = (stage: string, value: string) => {
    const days = value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
    handleTimeLimitChange(stage, 'escalationDays', days)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/time-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeLimits })
      })

      if (response.ok) {
        onSave(timeLimits)
        setHasChanges(false)
      } else {
        throw new AppError('Failed to save time limits')
      }
    } catch (error) {
      logger.error('Error saving time limits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    setTimeLimits(DEFAULT_TIME_LIMITS)
    setHasChanges(true)
  }

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      "editorial-assistant-review": "bg-blue-100 text-blue-800",
      "associate-editor-assignment": "bg-purple-100 text-purple-800",
      "associate-editor-review": "bg-indigo-100 text-indigo-800",
      "reviewer-assignment": "bg-green-100 text-green-800",
      "reviewer-review": "bg-orange-100 text-orange-800",
      "associate-editor-decision": "bg-red-100 text-red-800",
      "editor-in-chief-review": "bg-yellow-100 text-yellow-800",
      "production": "bg-gray-100 text-gray-800"
    }
    return colors[stage] || "bg-gray-100 text-gray-800"
  }

  const getPriorityLevel = (timeLimit: TimeLimit) => {
    if (timeLimit.timeLimitDays <= 3) return "High"
    if (timeLimit.timeLimitDays <= 7) return "Medium"
    return "Low"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Workflow Time Limit Management
          </CardTitle>
          <CardDescription>
            Configure deadlines and reminder schedules for each workflow stage. This ensures timely manuscript processing and prevents bottlenecks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {timeLimits.filter(tl => tl.isActive).length} Active Stages
              </Badge>
              <Badge variant="outline" className="text-sm">
                {timeLimits.length} Total Stages
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetToDefaults} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button variant="outline" onClick={fetchTimeLimits} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Configuration</TabsTrigger>
              <TabsTrigger value="reminders">Reminder Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeLimits.map((timeLimit) => (
                  <Card key={timeLimit.stage} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium">
                            {STAGE_DISPLAY_NAMES[timeLimit.stage as keyof typeof STAGE_DISPLAY_NAMES]}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {STAGE_DESCRIPTIONS[timeLimit.stage as keyof typeof STAGE_DESCRIPTIONS]}
                          </CardDescription>
                        </div>
                        <Switch
                          checked={timeLimit.isActive}
                          onCheckedChange={(checked) => 
                            handleTimeLimitChange(timeLimit.stage, 'isActive', checked)
                          }
                          disabled={isReadOnly}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Deadline</span>
                          <Badge variant="outline" className="text-xs">
                            {timeLimit.timeLimitDays} days
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Priority</span>
                          <Badge className={`text-xs ${getPriorityColor(getPriorityLevel(timeLimit))}`}>
                            {getPriorityLevel(timeLimit)}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Reminders</span>
                          <Badge variant="secondary" className="text-xs">
                            {timeLimit.reminderDays.length} scheduled
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Escalations</span>
                          <Badge variant="secondary" className="text-xs">
                            {timeLimit.escalationDays.length} levels
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              <div className="space-y-6">
                {timeLimits.map((timeLimit) => (
                  <Card key={timeLimit.stage}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {STAGE_DISPLAY_NAMES[timeLimit.stage as keyof typeof STAGE_DISPLAY_NAMES]}
                          </CardTitle>
                          <CardDescription>
                            {STAGE_DESCRIPTIONS[timeLimit.stage as keyof typeof STAGE_DESCRIPTIONS]}
                          </CardDescription>
                        </div>
                        <Badge className={getStageColor(timeLimit.stage)}>
                          {timeLimit.stage.replace(/-/g, ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`${timeLimit.stage}-days`}>Time Limit (Days)</Label>
                          <Input
                            id={`${timeLimit.stage}-days`}
                            type="number"
                            min="1"
                            max="365"
                            value={timeLimit.timeLimitDays}
                            onChange={(e) => 
                              handleTimeLimitChange(timeLimit.stage, 'timeLimitDays', parseInt(e.target.value))
                            }
                            disabled={isReadOnly}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${timeLimit.stage}-reminders`}>
                            Reminder Days (comma-separated)
                          </Label>
                          <Input
                            id={`${timeLimit.stage}-reminders`}
                            value={timeLimit.reminderDays.join(', ')}
                            onChange={(e) => handleReminderDaysChange(timeLimit.stage, e.target.value)}
                            placeholder="1, 2, 3"
                            disabled={isReadOnly}
                          />
                          <p className="text-xs text-gray-600">
                            Days before deadline to send reminders
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${timeLimit.stage}-escalations`}>
                            Escalation Days (comma-separated)
                          </Label>
                          <Input
                            id={`${timeLimit.stage}-escalations`}
                            value={timeLimit.escalationDays.join(', ')}
                            onChange={(e) => handleEscalationDaysChange(timeLimit.stage, e.target.value)}
                            placeholder="1, 2, 3"
                            disabled={isReadOnly}
                          />
                          <p className="text-xs text-gray-600">
                            Days after deadline to escalate
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${timeLimit.stage}-active`}
                          checked={timeLimit.isActive}
                          onCheckedChange={(checked) => 
                            handleTimeLimitChange(timeLimit.stage, 'isActive', checked)
                          }
                          disabled={isReadOnly}
                        />
                        <Label htmlFor={`${timeLimit.stage}-active`}>
                          Stage is active and time limits are enforced
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reminders" className="space-y-4">
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  Configure automated reminder and escalation schedules for each workflow stage. 
                  Reminders are sent before deadlines, escalations after deadlines are missed.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      Reminder Schedule
                    </CardTitle>
                    <CardDescription>
                      Automated reminders sent before deadlines
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {timeLimits.map((timeLimit) => (
                      <div key={timeLimit.stage} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {STAGE_DISPLAY_NAMES[timeLimit.stage as keyof typeof STAGE_DISPLAY_NAMES]}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {timeLimit.reminderDays.length} reminders
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {timeLimit.reminderDays.map((day, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {day} day{day !== 1 ? 's' : ''} before
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Escalation Schedule
                    </CardTitle>
                    <CardDescription>
                      Automated escalations sent after missed deadlines
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {timeLimits.map((timeLimit) => (
                      <div key={timeLimit.stage} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {STAGE_DISPLAY_NAMES[timeLimit.stage as keyof typeof STAGE_DISPLAY_NAMES]}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {timeLimit.escalationDays.length} levels
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {timeLimit.escalationDays.map((day, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {day} day{day !== 1 ? 's' : ''} overdue
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {!isReadOnly && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !hasChanges}
            className="min-w-24"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
