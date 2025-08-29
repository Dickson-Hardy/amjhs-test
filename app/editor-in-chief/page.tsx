"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Crown,
  FileText,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Edit,
  Eye,
  Mail,
  Settings,
  BarChart3,
  Calendar,
  Target,
  Award,
  BookOpen,
  Shield,
  Gavel,
  MessageSquare,
  UserPlus,
} from "lucide-react"

interface Submission {
  id: string
  title: string
  author: string
  section: string
  submittedDate: string
  status: string
  priority: 'high' | 'medium' | 'low'
  assignedEditor: string
  conflictOfInterest: boolean
  needsEICDecision: boolean
}

interface Editor {
  id: string
  name: string
  email: string
  role: string
  section: string
  workload: number
  maxWorkload: number
  performance: number
}

interface JournalMetrics {
  totalSubmissions: number
  acceptanceRate: number
  averageReviewTime: number
  impactFactor: number
  citationsThisYear: number
  rejectionsThisMonth: number
}

interface Appeal {
  id: string
  submissionId: string
  submissionTitle: string
  author: string
  appealType: 'decision' | 'reviewer' | 'process'
  status: 'pending' | 'technical_check' | 'under_review' | 'resolved'
  submittedDate: string
  urgency: 'high' | 'medium' | 'low'
}

export default function EditorInChiefDashboard() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<JournalMetrics>({
    totalSubmissions: 0,
    acceptanceRate: 0,
    averageReviewTime: 0,
    impactFactor: 0,
    citationsThisYear: 0,
    rejectionsThisMonth: 0,
  })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [editors, setEditors] = useState<Editor[]>([])
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.role !== "editor-in-chief" && session?.user?.role !== "admin") return

    fetchDashboardData()
  }, [session])

  const refreshDashboard = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from APIs
      const [metricsRes, submissionsRes, editorsRes, appealsRes] = await Promise.all([
        fetch('/api/editor-in-chief/metrics'),
        fetch('/api/editor-in-chief/submissions?priority=high'),
        fetch('/api/editor-in-chief/editors'),
        fetch('/api/editor-in-chief/appeals?status=pending'),
      ])

      // Handle metrics
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        if (metricsData.success) {
          setMetrics(metricsData.metrics)
        }
      } else {
        logger.error('Failed to fetch metrics:', metricsRes.statusText)
      }

      // Handle submissions requiring attention
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        if (submissionsData.success) {
          setSubmissions(submissionsData.submissions)
        }
      } else {
        logger.error('Failed to fetch submissions:', submissionsRes.statusText)
      }

      // Handle editors
      if (editorsRes.ok) {
        const editorsData = await editorsRes.json()
        if (editorsData.success) {
          setEditors(editorsData.editors)
        }
      } else {
        logger.error('Failed to fetch editors:', editorsRes.statusText)
      }

      // Handle appeals
      if (appealsRes.ok) {
        const appealsData = await appealsRes.json()
        if (appealsData.success) {
          setAppeals(appealsData.appeals)
        }
      } else {
        logger.error('Failed to fetch appeals:', appealsRes.statusText)
      }

    } catch (error) {
      logger.error('Error fetching EIC dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFinalDecision = async (submissionId: string, decision: string) => {
    try {
      // API call to make final decision
      const response = await fetch(`/api/submissions/${submissionId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          decidedBy: session?.user?.id,
          role: 'editor-in-chief',
        }),
      })

      if (response.ok) {
        logger.info(`Final decision made: ${decision} for submission ${submissionId}`)
        // Refresh data
        await refreshDashboard()
      } else {
        logger.error('Failed to make decision:', response.statusText)
      }
    } catch (error) {
      logger.error('Error making final decision:', error)
    }
  }

  const handleAppealReview = async (appealId: string, decision: string) => {
    try {
      // API call to handle appeal
      const response = await fetch(`/api/appeals/${appealId}/handle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: decision,
          handledBy: session?.user?.id,
        }),
      })

      if (response.ok) {
        logger.info(`Appeal ${decision}: ${appealId}`)
        // Refresh data
        await refreshDashboard()
      } else {
        logger.error('Failed to handle appeal:', response.statusText)
      }
    } catch (error) {
      logger.error('Error handling appeal:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "appeal_pending":
        return "bg-red-100 text-red-800"
      case "editor_decision_required":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50"
      case "medium":
        return "border-l-yellow-500 bg-yellow-50"
      case "low":
        return "border-l-green-500 bg-green-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["editor-in-chief", "admin"]}>
        <EditorLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editor-in-chief", "admin"]}>
      <EditorLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editor-in-Chief Dashboard</h1>
                <p className="text-gray-600">Ultimate editorial authority and journal leadership</p>
              </div>
            </div>
            <Button 
          onClick={refreshDashboard}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Clock className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">Current year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact Factor</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.impactFactor}</div>
            <p className="text-xs text-muted-foreground">Latest IF</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageReviewTime}d</div>
            <p className="text-xs text-muted-foreground">Average days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="decisions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="decisions">EIC Decisions</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
          <TabsTrigger value="editors">Editorial Board</TabsTrigger>
          <TabsTrigger value="journal">Journal Strategy</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        {/* EIC Decisions Tab */}
        <TabsContent value="decisions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Submissions Requiring EIC Decision</h2>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {submissions.filter(s => s.needsEICDecision).map((submission) => (
              <Card key={submission.id} className={`border-l-4 ${getPriorityColor(submission.priority)}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{submission.title}</CardTitle>
                      <CardDescription>
                        By {submission.author} • Section: {submission.section} • 
                        Submitted: {new Date(submission.submittedDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">{submission.priority} priority</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submission.conflictOfInterest && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Potential conflict of interest flagged
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Assigned Editor: {submission.assignedEditor}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setSelectedSubmission(submission.id)}
                          variant="outline" 
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Details
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Gavel className="h-4 w-4 mr-2" />
                              Make Decision
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editor-in-Chief Final Decision</DialogTitle>
                              <DialogDescription>
                                Make the final editorial decision for: {submission.title}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Decision rationale and feedback to authors..."
                                className="min-h-32"
                              />
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => handleFinalDecision(submission.id, 'accept')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept
                                </Button>
                                <Button 
                                  onClick={() => handleFinalDecision(submission.id, 'reject')}
                                  variant="destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button 
                                  onClick={() => handleFinalDecision(submission.id, 'revision')}
                                  variant="outline"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Request Revision
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Appeals Tab */}
        <TabsContent value="appeals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Appeals & Disputes</h2>
          </div>

          <div className="space-y-4">
            {appeals.map((appeal) => (
              <Card key={appeal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{appeal.submissionTitle}</CardTitle>
                      <CardDescription>
                        Appeal by {appeal.author} • Type: {appeal.appealType} • 
                        Submitted: {new Date(appeal.submittedDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={appeal.urgency === 'high' ? 'destructive' : 'outline'}>
                        {appeal.urgency} urgency
                      </Badge>
                      <Badge>{appeal.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAppealReview(appeal.id, 'uphold')}
                      variant="outline" 
                      size="sm"
                    >
                      Uphold Original Decision
                    </Button>
                    <Button 
                      onClick={() => handleAppealReview(appeal.id, 'overturn')}
                      size="sm"
                    >
                      Overturn Decision
                    </Button>
                    <Button 
                      onClick={() => handleAppealReview(appeal.id, 'review')}
                      variant="outline" 
                      size="sm"
                    >
                      Request Additional Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Editorial Board Tab */}
        <TabsContent value="editors" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Editorial Board Management</h2>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Editor
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Editor</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editors.map((editor) => (
                  <TableRow key={editor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{editor.name}</div>
                        <div className="text-sm text-gray-500">{editor.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{editor.role}</Badge>
                    </TableCell>
                    <TableCell>{editor.section}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              editor.workload > editor.maxWorkload ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((editor.workload / editor.maxWorkload) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">{editor.workload}/{editor.maxWorkload}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={editor.performance >= 90 ? "default" : "secondary"}>
                        {editor.performance}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Journal Strategy Tab */}
        <TabsContent value="journal" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Journal Strategy & Vision</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Articles this year</span>
                  <Badge>156 / 180</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Target Impact Factor</span>
                  <Badge>3.5 (Current: 3.2)</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>International submissions</span>
                  <Badge>65%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Editorial Initiatives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Special Issue Planning
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Scope & Aims Review
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Editorial Board Expansion
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Journal Analytics</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Citation Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.citationsThisYear}</div>
                <p className="text-sm text-gray-600">Citations this year</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rejection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{100 - metrics.acceptanceRate}%</div>
                <p className="text-sm text-gray-600">Current rejection rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Rejections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.rejectionsThisMonth}</div>
                <p className="text-sm text-gray-600">This month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Editorial Policies & Standards</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Editorial Standards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Ethics & Integrity Guidelines
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Manuscript Standards
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Reviewer Guidelines
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </EditorLayout>
    </RouteGuard>
  )
}
