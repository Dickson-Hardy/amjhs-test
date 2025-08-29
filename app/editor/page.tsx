"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import EditorLayout from "@/components/layouts/editor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ReviewerAssignmentPanel } from "@/components/editor/reviewer-assignment-panel"
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  MessageSquare,
  Send,
  UserPlus,
  Filter,
  BarChart3,
  BookOpen,
  Award,
  Target,
  Settings,
  Zap,
  Shield,
  Bell,
} from "lucide-react"

interface Manuscript {
  id: string
  title: string
  authors: string[]
  category: string
  submittedDate: string
  status: "submitted" | "technical_check" | "under_review" | "revision_requested" | "accepted" | "rejected" | "published"
  priority: "low" | "medium" | "high" | "urgent"
  reviewers: { id: string; name: string; status: string }[]
  deadline: string
  wordCount: number
  abstract: string
}

interface EditorStats {
  totalManuscripts: number
  underReview: number
  pendingDecision: number
  publishedThisMonth: number
  averageReviewTime: number
  acceptanceRate: number
}

interface Reviewer {
  id: string
  name: string
  email: string
  expertise: string[]
  currentLoad: number
  averageRating: number
  onTimeRate: number
  lastActive: string
}

export default function EditorDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<EditorStats>({
    totalManuscripts: 0,
    underReview: 0,
    pendingDecision: 0,
    publishedThisMonth: 0,
    averageReviewTime: 0,
    acceptanceRate: 0,
  })
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript | null>(null)
  const [assignmentDialog, setAssignmentDialog] = useState(false)
  const [decisionDialog, setDecisionDialog] = useState(false)
  const [decision, setDecision] = useState("")
  const [decisionComments, setDecisionComments] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEditorData() {
      if (!session?.user?.id) return

      try {
        const [statsRes, manuscriptsRes, reviewersRes] = await Promise.all([
          fetch(`/api/editors/${session.user.id}/stats`),
          fetch(`/api/editors/${session.user.id}/manuscripts`),
          fetch(`/api/editors/reviewers`),
        ])

        const statsData = await statsRes.json()
        const manuscriptsData = await manuscriptsRes.json()
        const reviewersData = await reviewersRes.json()

        if (statsData.success) setStats(statsData.stats)
        if (manuscriptsData.success) setManuscripts(manuscriptsData.manuscripts)
        if (reviewersData.success) setReviewers(reviewersData.reviewers)
      } catch (error) {
        logger.error("Error fetching editor data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEditorData()
  }, [session])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "technical_check":
        return "bg-purple-100 text-purple-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "revision_requested":
        return "bg-orange-100 text-orange-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "published":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  const handleAssignReviewer = async (manuscriptId: string, reviewerId: string) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/assign-reviewer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId }),
      })
      if (response.ok) {
        // Refresh data
        window.location.reload()
      }
    } catch (error) {
      logger.error("Error assigning reviewer:", error)
    }
  }

  const handleEditorialDecision = async () => {
    if (!selectedManuscript) return

    try {
      const response = await fetch(`/api/manuscripts/${selectedManuscript.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          comments: decisionComments,
        }),
      })
      if (response.ok) {
        setDecisionDialog(false)
        setSelectedManuscript(null)
        setDecision("")
        setDecisionComments("")
        // Refresh data
        window.location.reload()
      }
    } catch (error) {
      logger.error("Error making editorial decision:", error)
    }
  }

  const editorStats = [
    {
      title: "Total Manuscripts",
      value: stats.totalManuscripts.toString(),
      icon: FileText,
      change: `${stats.underReview} under review`,
      color: "text-blue-600",
    },
    {
      title: "Pending Decisions",
      value: stats.pendingDecision.toString(),
      icon: Clock,
      change: "Awaiting your decision",
      color: "text-orange-600",
    },
    {
      title: "Published This Month",
      value: stats.publishedThisMonth.toString(),
      icon: BookOpen,
      change: `${stats.acceptanceRate}% acceptance rate`,
      color: "text-green-600",
    },
    {
      title: "Avg Review Time",
      value: `${stats.averageReviewTime} days`,
      icon: Target,
      change: "Processing efficiency",
      color: "text-purple-600",
    },
  ]

  return (
    <RouteGuard allowedRoles={["editor", "admin"]}>
      <EditorLayout>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {editorStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="workflow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="workflow">Editorial Workflow</TabsTrigger>
            <TabsTrigger value="enhanced-assignments">Enhanced Assignments</TabsTrigger>
            <TabsTrigger value="assignments">Reviewer Assignment</TabsTrigger>
            <TabsTrigger value="decisions">Decision Making</TabsTrigger>
            <TabsTrigger value="schedule">Publication Schedule</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="coi">COI Management</TabsTrigger>
            <TabsTrigger value="time-limits">Time Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Manuscript Pipeline</h2>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="technical_check">Technical Check</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="revision_requested">Revision Requested</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {manuscripts.map((manuscript) => (
                <Card key={manuscript.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{manuscript.title}</CardTitle>
                          <Badge className={getPriorityColor(manuscript.priority)}>
                            {manuscript.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(manuscript.status)}>
                            {manuscript.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <Badge variant="secondary">{manuscript.category}</Badge>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Submitted: {new Date(manuscript.submittedDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {manuscript.reviewers.length} reviewers
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          Authors: {manuscript.authors.join(", ")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {manuscript.reviewers.map((reviewer, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {reviewer.name} ({reviewer.status})
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Dialog open={assignmentDialog} onOpenChange={setAssignmentDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedManuscript(manuscript)}
                              className="text-blue-600"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign Reviewer
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-600" />
                                Enhanced Reviewer Assignment
                              </DialogTitle>
                              <DialogDescription>
                                Intelligent assignment combining author recommendations with system candidates for "{selectedManuscript?.title}"
                              </DialogDescription>
                            </DialogHeader>
                            {selectedManuscript && (
                              <ReviewerAssignmentPanel
                                articleId={selectedManuscript.id}
                                articleTitle={selectedManuscript.title}
                                onAssignmentComplete={(result) => {
                                  setAssignmentDialog(false)
                                  setSelectedManuscript(null)
                                  // Refresh data
                                  window.location.reload()
                                }}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        {(manuscript.status === "technical_check" || manuscript.status === "under_review") && (
                          <Dialog open={decisionDialog} onOpenChange={setDecisionDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedManuscript(manuscript)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Make Decision
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Editorial Decision</DialogTitle>
                                <DialogDescription>
                                  Make a decision for "{manuscript.title}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">Decision</label>
                                  <Select value={decision} onValueChange={setDecision}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select decision" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="accept">Accept</SelectItem>
                                      <SelectItem value="minor_revision">Minor Revision</SelectItem>
                                      <SelectItem value="major_revision">Major Revision</SelectItem>
                                      <SelectItem value="reject">Reject</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">Comments for Author</label>
                                  <Textarea 
                                    value={decisionComments}
                                    onChange={(e) => setDecisionComments(e.target.value)}
                                    placeholder="Provide detailed feedback for the author..."
                                    rows={6}
                                  />
                                </div>
                                <div className="flex justify-end gap-3">
                                  <Button variant="outline" onClick={() => setDecisionDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleEditorialDecision} className="bg-green-600 hover:bg-green-700">
                                    <Send className="h-4 w-4 mr-1" />
                                    Send Decision
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="enhanced-assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-600" />
                Enhanced Reviewer Assignment
              </h2>
              <div className="text-sm text-muted-foreground">
                Intelligent assignment combining author recommendations with system intelligence
              </div>
            </div>

            <div className="space-y-6">
              {manuscripts
                .filter(m => ["submitted", "technical_check"].includes(m.status))
                .map((manuscript) => (
                <Card key={manuscript.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{manuscript.title}</CardTitle>
                          <Badge className={getPriorityColor(manuscript.priority)}>
                            {manuscript.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(manuscript.status)}>
                            {manuscript.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <Badge variant="secondary">{manuscript.category}</Badge>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Submitted: {new Date(manuscript.submittedDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {manuscript.reviewers.length} reviewers assigned
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Authors: {manuscript.authors.join(", ")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ReviewerAssignmentPanel
                      articleId={manuscript.id}
                      articleTitle={manuscript.title}
                      onAssignmentComplete={(result) => {
                        logger.info('Assignment completed:', result)
                        // Optionally refresh the data or show success message
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
              
              {manuscripts.filter(m => ["submitted", "technical_check"].includes(m.status)).length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      No manuscripts ready for assignment
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manuscripts in submitted or technical check status will appear here for enhanced reviewer assignment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Traditional Reviewer Assignment</h2>
              <div className="text-sm text-muted-foreground">
                Standard reviewer assignment workflow
              </div>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Traditional Assignment Available
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use the "Enhanced Assignments" tab for the new intelligent reviewer assignment system.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decisions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Editorial Decisions</h2>
              <div className="text-sm text-muted-foreground">
                Make final decisions on manuscripts
              </div>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Decision Making Interface
                </h3>
                <p className="text-sm text-muted-foreground">
                  Decision making interface will be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Publication Schedule</h2>
              <div className="text-sm text-muted-foreground">
                Manage publication timeline
              </div>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Publication Schedule
                </h3>
                <p className="text-sm text-muted-foreground">
                  Publication scheduling interface will be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Editorial Analytics</h2>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Editorial Performance
                  </CardTitle>
                  <CardDescription>Your editorial workflow metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Review Time</span>
                    <span className="font-semibold text-2xl text-green-600">
                      {stats.averageReviewTime} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Acceptance Rate</span>
                    <span className="font-semibold text-xl text-blue-600">{stats.acceptanceRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Manuscripts Processed</span>
                    <span className="font-semibold text-xl text-purple-600">{stats.totalManuscripts}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Reviewer Network
                  </CardTitle>
                  <CardDescription>Your reviewer management stats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Reviewers</span>
                    <span className="font-semibold text-2xl text-blue-600">{reviewers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Response Rate</span>
                    <span className="font-semibold text-xl text-green-600">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">On-Time Reviews</span>
                    <span className="font-semibold text-xl text-purple-600">92%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coi" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Conflict of Interest Management</h2>
              <Button>
                <Shield className="h-4 w-4 mr-2" />
                COI Overview
              </Button>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Conflict of Interest Management
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Monitor and manage conflict of interest declarations from associate editors and reviewers.
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => router.push('/editor/coi/overview')}>
                    <Shield className="h-4 w-4 mr-2" />
                    View COI Overview
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/editor/coi/reports')}>
                    <FileText className="h-4 w-4 mr-2" />
                    COI Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time-limits" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Time Limit Enforcement</h2>
              <Button>
                <Clock className="h-4 w-4 mr-2" />
                Configure Limits
              </Button>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Time Limit Management
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure and monitor workflow stage deadlines and automated reminders.
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => router.push('/editor/time-limits/configure')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Time Limits
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/editor/time-limits/monitoring')}>
                    <Bell className="h-4 w-4 mr-2" />
                    Monitor Deadlines
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </EditorLayout>
    </RouteGuard>
  )
}
