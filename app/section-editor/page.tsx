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
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  FileText,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  UserPlus,
  Mail,
  Gavel,
  Star,
  Filter,
  Calendar,
  BarChart3,
  Target,
} from "lucide-react"

interface SectionMetrics {
  totalSubmissions: number
  myAssignments: number
  pendingDecisions: number
  acceptanceRate: number
  averageReviewTime: number
  sectionRanking: number
}

interface Submission {
  id: string
  title: string
  author: string
  coAuthors: string[]
  submittedDate: string
  status: string
  priority: 'high' | 'medium' | 'low'
  reviewers: string[]
  daysSinceSubmission: number
  qualityScore: number
  needsDecision: boolean
  abstract: string
}

interface Reviewer {
  id: string
  name: string
  email: string
  expertise: string[]
  availability: 'available' | 'limited' | 'unavailable'
  currentLoad: number
  maxLoad: number
  averageReviewTime: number
  qualityRating: number
  completedReviews: number
  lastActive: string
}

interface SectionScope {
  name: string
  description: string
  keywords: string[]
  guidelines: string
  acceptance_criteria: string[]
}

export default function SectionEditorDashboard() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<SectionMetrics>({
    totalSubmissions: 0,
    myAssignments: 0,
    pendingDecisions: 0,
    acceptanceRate: 0,
    averageReviewTime: 0,
    sectionRanking: 0,
  })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [sectionScope, setSectionScope] = useState<SectionScope | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)

  // Assuming section is derived from user profile or context
  const userSection = "Cardiology" // This would come from session data

  useEffect(() => {
    const allowedRoles = ["section-editor", "managing-editor", "editor-in-chief", "admin"]
    if (!allowedRoles.includes(session?.user?.role || "")) return

    fetchDashboardData()
  }, [session])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from API endpoints
      const [metricsResponse, submissionsResponse, reviewersResponse, scopeResponse] = await Promise.all([
        fetch('/api/section-editor/metrics'),
        fetch('/api/section-editor/submissions'),
        fetch('/api/section-editor/reviewers'),
        fetch('/api/section-editor/scope')
      ])

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData)
      }

      if (reviewersResponse.ok) {
        const reviewersData = await reviewersResponse.json()
        setReviewers(reviewersData)
      }

      if (scopeResponse.ok) {
        const scopeData = await scopeResponse.json()
        setSectionScope(scopeData)
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching section editor dashboard data:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditorialDecision = async (submissionId: string, decision: string, comments: string) => {
    try {
      const response = await fetch('/api/section-editor/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          decision,
          comments,
          editorId: session?.user?.id
        })
      })

      if (response.ok) {
        // Refresh dashboard data after successful decision
        fetchDashboardData()
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to make editorial decision')
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error making editorial decision:', error)
      }
    }
  }

  const handleReviewerAssignment = async (submissionId: string, reviewerId: string) => {
    try {
      const response = await fetch('/api/section-editor/assign-reviewer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          reviewerId,
          assignedBy: session?.user?.id
        })
      })

      if (response.ok) {
        // Refresh dashboard data after successful assignment
        fetchDashboardData()
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to assign reviewer')
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error assigning reviewer:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "technical_check":
        return "bg-purple-100 text-purple-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "reviewer_decision_received":
        return "bg-blue-100 text-blue-800"
      case "revision_submitted":
        return "bg-orange-100 text-orange-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
      <RouteGuard allowedRoles={["section-editor", "admin"]}>
        <EditorLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["section-editor", "admin"]}>
      <EditorLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Section Editor Dashboard</h1>
              <p className="text-gray-600">Managing {userSection} section submissions and reviews</p>
            </div>
          </div>

      {/* Section Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.myAssignments}</div>
            <p className="text-xs text-muted-foreground">Active submissions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Decisions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingDecisions}</div>
            <p className="text-xs text-muted-foreground">Need decisions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">Section average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Section Ranking</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{metrics.sectionRanking}</div>
            <p className="text-xs text-muted-foreground">Among sections</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="scope">Section Scope</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Section Submissions</h2>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="decision">Need Decision</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Search submissions..." className="w-64" />
            </div>
          </div>

          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className={`border-l-4 ${getPriorityColor(submission.priority)}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{submission.title}</CardTitle>
                      <CardDescription>
                        By {submission.author}
                        {submission.coAuthors.length > 0 && ` et al. (${submission.coAuthors.length} co-authors)`} • 
                        Submitted: {new Date(submission.submittedDate).toLocaleDateString()} • 
                        {submission.daysSinceSubmission} days ago
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                      {submission.needsDecision && (
                        <Badge variant="destructive">Decision Required</Badge>
                      )}
                      <Badge variant="outline">Quality: {submission.qualityScore}/10</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{submission.abstract}</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <span className="text-sm text-gray-600">
                          Reviewers: {submission.reviewers.join(", ") || "None assigned"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setSelectedSubmission(submission.id)}
                          variant="outline" 
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Details
                        </Button>
                        
                        {!submission.reviewers.length && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Reviewers
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Reviewers</DialogTitle>
                                <DialogDescription>
                                  Select reviewers for: {submission.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select first reviewer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {reviewers.filter(r => r.availability === 'available').map((reviewer) => (
                                      <SelectItem key={reviewer.id} value={reviewer.id}>
                                        {reviewer.name} - {reviewer.expertise.join(", ")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button onClick={() => handleReviewerAssignment(submission.id, "reviewer1")}>
                                  Assign Reviewers
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {submission.needsDecision && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Gavel className="h-4 w-4 mr-2" />
                                Make Decision
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editorial Decision</DialogTitle>
                                <DialogDescription>
                                  Make decision for: {submission.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Decision comments and feedback to authors..."
                                  className="min-h-32"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => handleEditorialDecision(submission.id, 'accept', '')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accept
                                  </Button>
                                  <Button 
                                    onClick={() => handleEditorialDecision(submission.id, 'reject', '')}
                                    variant="destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button 
                                    onClick={() => handleEditorialDecision(submission.id, 'revision', '')}
                                    variant="outline"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Request Revision
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reviewers Tab */}
        <TabsContent value="reviewers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Section Reviewers</h2>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Reviewer
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Current Load</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewers.map((reviewer) => (
                  <TableRow key={reviewer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reviewer.name}</div>
                        <div className="text-sm text-gray-500">{reviewer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {reviewer.expertise.map((exp, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        reviewer.availability === 'available' ? 'default' : 
                        reviewer.availability === 'limited' ? 'secondary' : 'destructive'
                      }>
                        {reviewer.availability}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(reviewer.currentLoad / reviewer.maxLoad) * 100} 
                          className="w-16"
                        />
                        <span className="text-sm">{reviewer.currentLoad}/{reviewer.maxLoad}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">
                          {reviewer.qualityRating}/10
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {reviewer.completedReviews} reviews
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Editorial Decisions Tab */}
        <TabsContent value="decisions" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Recent Editorial Decisions</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Accepted</span>
                  <Badge className="bg-green-100 text-green-800">8</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Rejected</span>
                  <Badge className="bg-red-100 text-red-800">15</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Revisions</span>
                  <Badge className="bg-yellow-100 text-yellow-800">12</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Decision Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.averageReviewTime}d</div>
                <p className="text-sm text-gray-600">Average decision time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">#{metrics.sectionRanking}</div>
                <p className="text-sm text-gray-600">Ranking among sections</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Section Scope Tab */}
        <TabsContent value="scope" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Section Scope & Guidelines</h2>
          
          {sectionScope && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{sectionScope.name} Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600">{sectionScope.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {sectionScope.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Acceptance Criteria</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {sectionScope.acceptance_criteria.map((criteria, index) => (
                        <li key={index}>{criteria}</li>
                      ))}
                    </ul>
                  </div>

                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Guidelines
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Section Analytics</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>This Month</span>
                    <Badge>15 submissions</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Month</span>
                    <Badge variant="outline">12 submissions</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Growth</span>
                    <Badge className="bg-green-100 text-green-800">+25%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Quality Score</span>
                    <Badge>7.8/10</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Acceptance Rate</span>
                    <Badge>{metrics.acceptanceRate}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Revision Rate</span>
                    <Badge variant="outline">45%</Badge>
                  </div>
                </div>
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
