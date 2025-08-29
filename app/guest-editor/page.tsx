"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  UserCheck,
  FileText,
  Users,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  UserPlus,
  Mail,
  Send,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  MessageSquare,
  Globe,
} from "lucide-react"

interface SpecialIssueMetrics {
  totalSubmissions: number
  acceptedSubmissions: number
  pendingReviews: number
  completedReviews: number
  targetSubmissions: number
  deadlineStatus: 'on_track' | 'at_risk' | 'overdue'
  daysRemaining: number
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
  specialIssueRelevance: number
  keywords: string[]
  abstract: string
  needsGuestDecision: boolean
}

interface SpecialIssue {
  id: string
  title: string
  description: string
  theme: string
  callForPapers: string
  submissionDeadline: string
  publicationTarget: string
  status: 'planning' | 'call_open' | 'review_phase' | 'production' | 'published'
  targetArticles: number
  currentSubmissions: number
  acceptedArticles: number
  guestEditors: string[]
  keywords: string[]
  specialRequirements: string[]
}

interface Reviewer {
  id: string
  name: string
  email: string
  expertise: string[]
  invitationStatus: 'invited' | 'accepted' | 'declined' | 'pending'
  assignedSubmissions: string[]
  specialIssueRelevance: number
  responseTime: number
}

interface CallForPapers {
  id: string
  title: string
  description: string
  deadline: string
  status: 'draft' | 'published' | 'closed'
  distributionChannels: string[]
  responsesReceived: number
}

export default function GuestEditorDashboard() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<SpecialIssueMetrics>({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    pendingReviews: 0,
    completedReviews: 0,
    targetSubmissions: 0,
    deadlineStatus: 'on_track',
    daysRemaining: 0,
  })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [specialIssue, setSpecialIssue] = useState<SpecialIssue | null>(null)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [callForPapers, setCallForPapers] = useState<CallForPapers | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)

  useEffect(() => {
    const allowedRoles = ["guest-editor", "section-editor", "managing-editor", "editor-in-chief", "admin"]
    if (!allowedRoles.includes(session?.user?.role || "")) return

    fetchDashboardData()
  }, [session])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from API endpoints
      const [metricsData, specialIssueData, submissionsData, reviewersData, callForPapersData] = await Promise.all([
        fetch('/api/guest-editor/metrics').then(res => res.json()),
        fetch('/api/guest-editor/special-issue').then(res => res.json()),
        fetch('/api/guest-editor/submissions').then(res => res.json()),
        fetch('/api/guest-editor/reviewers').then(res => res.json()),
        fetch('/api/guest-editor/call-for-papers').then(res => res.json())
      ])

      setMetrics(metricsData)
      setSpecialIssue(specialIssueData)
      setSubmissions(submissionsData)
      setReviewers(reviewersData)
      setCallForPapers(callForPapersData)

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching guest editor dashboard data:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGuestDecision = async (submissionId: string, decision: string, comments: string) => {
    try {
      logger.info(`Guest editor decision: ${decision} for submission ${submissionId}`)
      logger.error(`Comments: ${comments}`)
      fetchDashboardData()
    } catch (error) {
      logger.error('Error making guest editor decision:', error)
    }
  }

  const handleReviewerInvitation = async (reviewerId: string) => {
    try {
      logger.error(`Inviting reviewer ${reviewerId} to special issue`)
      fetchDashboardData()
    } catch (error) {
      logger.error('Error inviting reviewer:', error)
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
      case "revision_requested":
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

  const getDeadlineStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "text-green-600"
      case "at_risk":
        return "text-yellow-600"
      case "overdue":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserCheck className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guest Editor Dashboard</h1>
          <p className="text-gray-600">Managing special issue: {specialIssue?.title}</p>
        </div>
      </div>

      {/* Special Issue Overview */}
      {specialIssue && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{specialIssue.title}</CardTitle>
                <CardDescription className="mt-2">{specialIssue.description}</CardDescription>
              </div>
              <Badge className={getStatusColor(specialIssue.status)}>
                {specialIssue.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{specialIssue.currentSubmissions}</div>
                <p className="text-sm text-gray-600">Current Submissions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{specialIssue.acceptedArticles}</div>
                <p className="text-sm text-gray-600">Accepted Articles</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{specialIssue.targetArticles}</div>
                <p className="text-sm text-gray-600">Target Articles</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getDeadlineStatusColor(metrics.deadlineStatus)}`}>
                  {metrics.daysRemaining}d
                </div>
                <p className="text-sm text-gray-600">Days Remaining</p>
              </div>
            </div>
            
            <Progress 
              value={(specialIssue.currentSubmissions / specialIssue.targetArticles) * 100} 
              className="w-full"
            />
            
            <div className="flex flex-wrap gap-2">
              {specialIssue.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Issue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">For special issue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Awaiting decisions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((metrics.acceptedSubmissions / metrics.totalSubmissions) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Current rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((metrics.totalSubmissions / metrics.targetSubmissions) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Towards target</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
          <TabsTrigger value="call">Call for Papers</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="promotion">Promotion</TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Special Issue Submissions</h2>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="decision">Need Decision</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
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
                        Relevance Score: {submission.specialIssueRelevance}/10
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                      {submission.needsGuestDecision && (
                        <Badge variant="destructive">Guest Decision Required</Badge>
                      )}
                      <Badge variant="outline">
                        <Star className="h-3 w-3 mr-1" />
                        {submission.specialIssueRelevance}/10
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{submission.abstract}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {submission.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    
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

                        {submission.needsGuestDecision && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <UserCheck className="h-4 w-4 mr-2" />
                                Guest Decision
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Guest Editor Decision</DialogTitle>
                                <DialogDescription>
                                  Make special issue decision for: {submission.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Relevance to Special Issue</label>
                                  <p className="text-sm text-gray-600">
                                    Current Score: {submission.specialIssueRelevance}/10
                                  </p>
                                </div>
                                <Textarea
                                  placeholder="Guest editor comments and feedback..."
                                  className="min-h-32"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => handleGuestDecision(submission.id, 'accept', '')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accept for Special Issue
                                  </Button>
                                  <Button 
                                    onClick={() => handleGuestDecision(submission.id, 'reject', '')}
                                    variant="destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button 
                                    onClick={() => handleGuestDecision(submission.id, 'revision', '')}
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
            <h2 className="text-xl font-semibold text-gray-800">Special Issue Reviewers</h2>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Expert Reviewer
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Relevance</TableHead>
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
                        reviewer.invitationStatus === 'accepted' ? 'default' : 
                        reviewer.invitationStatus === 'declined' ? 'destructive' : 'secondary'
                      }>
                        {reviewer.invitationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{reviewer.assignedSubmissions.length} submissions</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{reviewer.specialIssueRelevance}/10</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {reviewer.invitationStatus === 'invited' && (
                          <Button 
                            onClick={() => handleReviewerInvitation(reviewer.id)}
                            size="sm"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Remind
                          </Button>
                        )}
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

        {/* Call for Papers Tab */}
        <TabsContent value="call" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Call for Papers Management</h2>
          
          {callForPapers && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{callForPapers.title}</CardTitle>
                    <CardDescription>{callForPapers.description}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(callForPapers.status)}>
                    {callForPapers.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Submission Deadline</span>
                    <div className="font-medium">{new Date(callForPapers.deadline).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Responses Received</span>
                    <div className="font-medium">{callForPapers.responsesReceived}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status</span>
                    <div className="font-medium capitalize">{callForPapers.status}</div>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Distribution Channels</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {callForPapers.distributionChannels.map((channel, index) => (
                      <Badge key={index} variant="outline">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Call
                  </Button>
                  <Button variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Promote Call
                  </Button>
                  <Button variant="outline">
                    <Globe className="h-4 w-4 mr-2" />
                    View Public Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Special Issue Timeline</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Key Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Call for Papers Published</div>
                      <div className="text-sm text-gray-600">December 1, 2023</div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Submission Deadline</div>
                      <div className="text-sm text-gray-600">March 15, 2024</div>
                    </div>
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Review Completion</div>
                      <div className="text-sm text-gray-600">May 1, 2024</div>
                    </div>
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Publication Target</div>
                      <div className="text-sm text-gray-600">June 1, 2024</div>
                    </div>
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Submissions Progress</span>
                      <span className="text-sm">{metrics.totalSubmissions}/{metrics.targetSubmissions}</span>
                    </div>
                    <Progress value={(metrics.totalSubmissions / metrics.targetSubmissions) * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Review Progress</span>
                      <span className="text-sm">{metrics.completedReviews}/{metrics.totalSubmissions}</span>
                    </div>
                    <Progress value={(metrics.completedReviews / metrics.totalSubmissions) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Promotion Tab */}
        <TabsContent value="promotion" className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Special Issue Promotion</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Promotion Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Social Media Campaign
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email to Researchers
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Conference Announcements
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Professional Networks
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promotion Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Call Page Views</span>
                    <Badge>1,247</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Social Media Reach</span>
                    <Badge>3,456</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Email Open Rate</span>
                    <Badge>68%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Submission Conversion</span>
                    <Badge>14.4%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
