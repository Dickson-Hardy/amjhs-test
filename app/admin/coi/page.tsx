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
  Shield,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

interface COIDeclaration {
  id: string
  userId: string
  userName: string
  userEmail: string
  submissionId?: string
  submissionTitle?: string
  conflictType: "financial" | "personal" | "professional" | "institutional" | "other"
  description: string
  status: "pending" | "approved" | "rejected" | "under_review"
  severity: "low" | "medium" | "high" | "critical"
  reportedDate: string
  reviewedBy?: string
  reviewedDate?: string
  notes?: string
}

interface COIRule {
  id: string
  name: string
  description: string
  type: "automatic" | "manual"
  criteria: string
  action: "flag" | "block" | "notify"
  isActive: boolean
  createdDate: string
}

interface COIStats {
  totalDeclarations: number
  pendingReview: number
  approvedDeclarations: number
  rejectedDeclarations: number
  criticalCases: number
  autoDetected: number
}

export default function AdminCOIPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [declarations, setDeclarations] = useState<COIDeclaration[]>([])
  const [rules, setRules] = useState<COIRule[]>([])
  const [stats, setStats] = useState<COIStats>({
    totalDeclarations: 0,
    pendingReview: 0,
    approvedDeclarations: 0,
    rejectedDeclarations: 0,
    criticalCases: 0,
    autoDetected: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [selectedDeclaration, setSelectedDeclaration] = useState<COIDeclaration | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [newRule, setNewRule] = useState<Partial<COIRule>>({
    name: "",
    description: "",
    type: "manual",
    criteria: "",
    action: "flag",
    isActive: true
  })

  useEffect(() => {
    fetchCOIData()
  }, [])

  const fetchCOIData = async () => {
    try {
      setLoading(true)
      const [declarationsRes, rulesRes, statsRes] = await Promise.all([
        fetch('/api/admin/coi/declarations'),
        fetch('/api/admin/coi/rules'),
        fetch('/api/admin/coi/stats')
      ])
      
      if (declarationsRes.ok) {
        const declarationsData = await declarationsRes.json()
        setDeclarations(declarationsData.declarations || [])
      }
      
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData.rules || [])
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error fetching COI data:', error)
      toast.error('Failed to fetch COI data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeclarationReview = async (declarationId: string, status: string, notes: string) => {
    try {
      const response = await fetch(`/api/admin/coi/declarations/${declarationId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, reviewedBy: session?.user?.id })
      })
      
      if (response.ok) {
        toast.success('Declaration reviewed successfully')
        fetchCOIData()
        setShowReviewDialog(false)
      } else {
        toast.error('Failed to review declaration')
      }
    } catch (error) {
      console.error('Error reviewing declaration:', error)
      toast.error('Failed to review declaration')
    }
  }

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/admin/coi/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      })
      
      if (response.ok) {
        toast.success('COI rule created successfully')
        fetchCOIData()
        setShowRuleDialog(false)
        setNewRule({
          name: "",
          description: "",
          type: "manual",
          criteria: "",
          action: "flag",
          isActive: true
        })
      } else {
        toast.error('Failed to create rule')
      }
    } catch (error) {
      console.error('Error creating rule:', error)
      toast.error('Failed to create rule')
    }
  }

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/coi/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      
      if (response.ok) {
        toast.success('Rule status updated')
        fetchCOIData()
      } else {
        toast.error('Failed to update rule')
      }
    } catch (error) {
      console.error('Error updating rule:', error)
      toast.error('Failed to update rule')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "under_review": return "bg-blue-100 text-blue-800"
      case "approved": return "bg-green-100 text-green-800"
      case "rejected": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "critical": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const filteredDeclarations = declarations.filter(declaration => {
    const matchesSearch = declaration.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         declaration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || declaration.status === statusFilter
    const matchesSeverity = severityFilter === "all" || declaration.severity === severityFilter
    return matchesSearch && matchesStatus && matchesSeverity
  })

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
            <h1 className="text-3xl font-bold text-slate-900">Conflict of Interest Management</h1>
            <p className="text-slate-600 mt-2">Monitor and manage conflict of interest declarations</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowRuleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalDeclarations}</div>
              <div className="text-sm text-gray-600">Total Declarations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pendingReview}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.approvedDeclarations}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">{stats.rejectedDeclarations}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stats.criticalCases}</div>
              <div className="text-sm text-gray-600">Critical Cases</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{stats.autoDetected}</div>
              <div className="text-sm text-gray-600">Auto-Detected</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search declarations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Declarations Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>COI Declarations ({filteredDeclarations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submission</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeclarations.map((declaration) => (
                  <TableRow key={declaration.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{declaration.userName}</div>
                        <div className="text-sm text-gray-500">{declaration.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {declaration.conflictType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(declaration.severity)} variant="outline">
                        {declaration.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(declaration.status)} variant="outline">
                        {declaration.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {declaration.submissionTitle ? (
                        <div className="text-sm">
                          <div className="font-medium truncate max-w-xs">{declaration.submissionTitle}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">General</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(declaration.reportedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDeclaration(declaration)
                            setShowReviewDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {declaration.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclarationReview(declaration.id, "approved", "")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* COI Rules */}
        <Card>
          <CardHeader>
            <CardTitle>COI Detection Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-gray-500">{rule.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(rule.createdDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Review Declaration Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review COI Declaration</DialogTitle>
              <DialogDescription>
                Review and make a decision on this conflict of interest declaration
              </DialogDescription>
            </DialogHeader>
            {selectedDeclaration && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>User</Label>
                    <div className="font-medium">{selectedDeclaration.userName}</div>
                    <div className="text-sm text-gray-500">{selectedDeclaration.userEmail}</div>
                  </div>
                  <div>
                    <Label>Conflict Type</Label>
                    <Badge variant="outline">{selectedDeclaration.conflictType}</Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                    {selectedDeclaration.description}
                  </div>
                </div>

                {selectedDeclaration.submissionTitle && (
                  <div>
                    <Label>Related Submission</Label>
                    <div className="font-medium">{selectedDeclaration.submissionTitle}</div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => handleDeclarationReview(selectedDeclaration.id, "approved", "")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleDeclarationReview(selectedDeclaration.id, "rejected", "")}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleDeclarationReview(selectedDeclaration.id, "under_review", "")}
                    variant="outline"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mark Under Review
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Rule Dialog */}
        <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create COI Detection Rule</DialogTitle>
              <DialogDescription>
                Create a new rule for automatic conflict of interest detection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
                <Label htmlFor="ruleDescription">Description</Label>
                <Textarea
                  id="ruleDescription"
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule detects"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rule Type</Label>
                  <Select value={newRule.type} onValueChange={(value) => setNewRule(prev => ({ ...prev, type: value as "automatic" | "manual" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Action</Label>
                  <Select value={newRule.action} onValueChange={(value) => setNewRule(prev => ({ ...prev, action: value as "flag" | "block" | "notify" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flag">Flag for Review</SelectItem>
                      <SelectItem value="block">Block Submission</SelectItem>
                      <SelectItem value="notify">Send Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="ruleCriteria">Detection Criteria</Label>
                <Textarea
                  id="ruleCriteria"
                  value={newRule.criteria}
                  onChange={(e) => setNewRule(prev => ({ ...prev, criteria: e.target.value }))}
                  placeholder="Define the criteria for this rule (e.g., keywords, patterns)"
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
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