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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  Mail,
  Users,
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  GitBranch,
  Activity,
  AlertTriangle
} from "lucide-react"

interface WorkflowRule {
  id: string
  name: string
  description: string
  trigger: {
    type: "submission_status" | "deadline_approaching" | "review_completed" | "time_elapsed"
    condition: string
    value?: string | number
  }
  actions: Array<{
    type: "send_email" | "assign_reviewer" | "change_status" | "create_reminder" | "escalate"
    config: any
  }>
  isActive: boolean
  executionCount: number
  lastExecuted?: string
  createdDate: string
}

interface WorkflowExecution {
  id: string
  ruleId: string
  ruleName: string
  submissionId: string
  submissionTitle: string
  executedAt: string
  status: "success" | "failed" | "pending"
  result: string
}

interface WorkflowStats {
  totalRules: number
  activeRules: number
  totalExecutions: number
  successRate: number
  recentExecutions: number
  avgExecutionTime: number
}

export default function AdminWorkflowPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [rules, setRules] = useState<WorkflowRule[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [stats, setStats] = useState<WorkflowStats>({
    totalRules: 0,
    activeRules: 0,
    totalExecutions: 0,
    successRate: 0,
    recentExecutions: 0,
    avgExecutionTime: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  const [newRule, setNewRule] = useState<Partial<WorkflowRule>>({
    name: "",
    description: "",
    trigger: {
      type: "submission_status",
      condition: "equals",
      value: ""
    },
    actions: [],
    isActive: true
  })

  useEffect(() => {
    fetchWorkflowData()
  }, [])

  const fetchWorkflowData = async () => {
    try {
      setLoading(true)
      const [rulesRes, executionsRes, statsRes] = await Promise.all([
        fetch('/api/admin/workflow/rules'),
        fetch('/api/admin/workflow/executions'),
        fetch('/api/admin/workflow/stats')
      ])
      
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData.rules || [])
      }
      
      if (executionsRes.ok) {
        const executionsData = await executionsRes.json()
        setExecutions(executionsData.executions || [])
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error fetching workflow data:', error)
      toast.error('Failed to fetch workflow data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/admin/workflow/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      })
      
      if (response.ok) {
        toast.success('Workflow rule created successfully')
        fetchWorkflowData()
        setShowCreateDialog(false)
        setNewRule({
          name: "",
          description: "",
          trigger: {
            type: "submission_status",
            condition: "equals",
            value: ""
          },
          actions: [],
          isActive: true
        })
      } else {
        toast.error('Failed to create workflow rule')
      }
    } catch (error) {
      console.error('Error creating workflow rule:', error)
      toast.error('Failed to create workflow rule')
    }
  }

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/workflow/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      
      if (response.ok) {
        toast.success(`Rule ${isActive ? 'activated' : 'deactivated'} successfully`)
        setRules(prev => prev.map(rule => 
          rule.id === ruleId ? { ...rule, isActive } : rule
        ))
      } else {
        toast.error('Failed to update rule status')
      }
    } catch (error) {
      console.error('Error updating rule:', error)
      toast.error('Failed to update rule status')
    }
  }

  const handleTestRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/admin/workflow/rules/${ruleId}/test`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Rule test completed: ${result.message}`)
      } else {
        toast.error('Failed to test rule')
      }
    } catch (error) {
      console.error('Error testing rule:', error)
      toast.error('Failed to test rule')
    }
  }

  const addAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [
        ...(prev.actions || []),
        {
          type: "send_email",
          config: {
            template: "",
            recipient: "author"
          }
        }
      ]
    }))
  }

  const removeAction = (index: number) => {
    setNewRule(prev => ({
      ...prev,
      actions: prev.actions?.filter((_, i) => i !== index) || []
    }))
  }

  const updateAction = (index: number, updates: any) => {
    setNewRule(prev => ({
      ...prev,
      actions: prev.actions?.map((action, i) => 
        i === index ? { ...action, ...updates } : action
      ) || []
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800"
      case "failed": return "bg-red-100 text-red-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case "submission_status": return FileText
      case "deadline_approaching": return Clock
      case "review_completed": return CheckCircle
      case "time_elapsed": return Clock
      default: return Zap
    }
  }

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
            <h1 className="text-3xl font-bold text-slate-900">Workflow Automation</h1>
            <p className="text-slate-600 mt-2">Automate editorial processes with custom rules and actions</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalRules}</div>
              <div className="text-sm text-gray-600">Total Rules</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.activeRules}</div>
              <div className="text-sm text-gray-600">Active Rules</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{stats.totalExecutions}</div>
              <div className="text-sm text-gray-600">Total Executions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stats.successRate}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-cyan-600 mb-1">{stats.recentExecutions}</div>
              <div className="text-sm text-gray-600">Recent (24h)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-1">{stats.avgExecutionTime}ms</div>
              <div className="text-sm text-gray-600">Avg. Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Rules */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Workflow Rules ({rules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executions</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => {
                  const TriggerIcon = getTriggerIcon(rule.trigger.type)
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-gray-500">{rule.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TriggerIcon className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium capitalize">
                              {rule.trigger.type.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {rule.trigger.condition} {rule.trigger.value}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rule.actions.map((action, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {action.type.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                          />
                          <Badge 
                            variant="outline" 
                            className={rule.isActive ? "text-green-700 bg-green-100" : "text-gray-600 bg-gray-100"}
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{rule.executionCount}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleDateString() : "Never"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRule(rule)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestRule(rule.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Executions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Executions ({executions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Submission</TableHead>
                  <TableHead>Executed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.slice(0, 10).map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell>
                      <div className="font-medium">{execution.ruleName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium truncate max-w-xs">{execution.submissionTitle}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(execution.executedAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(execution.status)} variant="outline">
                        {execution.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {execution.result}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Rule Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Workflow Rule</DialogTitle>
              <DialogDescription>
                Define triggers and actions to automate editorial processes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ruleName">Rule Name</Label>
                  <Input
                    id="ruleName"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      checked={newRule.isActive}
                      onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, isActive: checked }))}
                    />
                    <span className="text-sm">{newRule.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="ruleDescription">Description</Label>
                <Textarea
                  id="ruleDescription"
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule does"
                />
              </div>

              {/* Trigger Configuration */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">Trigger Configuration</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Trigger Type</Label>
                    <Select
                      value={newRule.trigger?.type}
                      onValueChange={(value) => setNewRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger!, type: value as any }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submission_status">Submission Status Change</SelectItem>
                        <SelectItem value="deadline_approaching">Deadline Approaching</SelectItem>
                        <SelectItem value="review_completed">Review Completed</SelectItem>
                        <SelectItem value="time_elapsed">Time Elapsed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Condition</Label>
                    <Select
                      value={newRule.trigger?.condition}
                      onValueChange={(value) => setNewRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger!, condition: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Value</Label>
                    <Input
                      value={newRule.trigger?.value || ""}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger!, value: e.target.value }
                      }))}
                      placeholder="Enter value"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Configuration */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Actions</h3>
                  <Button onClick={addAction} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action
                  </Button>
                </div>
                
                {newRule.actions?.map((action, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">Action {index + 1}</h4>
                      <Button
                        onClick={() => removeAction(index)}
                        size="sm"
                        variant="outline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Action Type</Label>
                        <Select
                          value={action.type}
                          onValueChange={(value) => updateAction(index, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="send_email">Send Email</SelectItem>
                            <SelectItem value="assign_reviewer">Assign Reviewer</SelectItem>
                            <SelectItem value="change_status">Change Status</SelectItem>
                            <SelectItem value="create_reminder">Create Reminder</SelectItem>
                            <SelectItem value="escalate">Escalate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Configuration</Label>
                        <Input
                          value={JSON.stringify(action.config)}
                          onChange={(e) => {
                            try {
                              const config = JSON.parse(e.target.value)
                              updateAction(index, { config })
                            } catch (error) {
                              // Invalid JSON, ignore
                            }
                          }}
                          placeholder="Action configuration (JSON)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule}>
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RouteGuard>
  )
}