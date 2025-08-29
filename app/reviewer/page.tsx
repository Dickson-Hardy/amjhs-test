"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Calendar,
  Star,
  Download,
  Edit,
  Send,
  BookOpen,
  TrendingUp,
  Award,
  Target,
  Shield,
  Settings,
} from "lucide-react"

interface ReviewAssignment {
  id: string
  articleId: string
  title: string
  category: string
  submittedDate: string
  deadline: string
  status: "pending" | "in_progress" | "completed" | "declined"
  priority: "low" | "medium" | "high" | "urgent"
  wordCount: number
  authors: string[]
  abstract: string
  files: { url: string; type: string; name: string }[]
}

interface ReviewStats {
  totalReviews: number
  completedReviews: number
  pendingReviews: number
  averageRating: number
  onTimeCompletion: number
  currentStreak: number
}

export default function ReviewerDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    completedReviews: 0,
    pendingReviews: 0,
    averageRating: 0,
    onTimeCompletion: 0,
    currentStreak: 0,
  })
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([])
  const [selectedReview, setSelectedReview] = useState<ReviewAssignment | null>(null)
  const [reviewForm, setReviewForm] = useState({
    recommendation: "",
    comments: "",
    confidentialComments: "",
    rating: 0,
    strengths: "",
    weaknesses: "",
    suggestions: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviewerData() {
      if (!session?.user?.id) return

      try {
        const [statsRes, assignmentsRes] = await Promise.all([
          fetch(`/api/reviewers/${session.user.id}/stats`),
          fetch(`/api/reviewers/${session.user.id}/assignments`),
        ])

        const statsData = await statsRes.json()
        const assignmentsData = await assignmentsRes.json()

        if (statsData.success) {
          setStats(statsData.stats)
        }

        if (assignmentsData.success) {
          setAssignments(assignmentsData.assignments)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching reviewer data:", error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchReviewerData()
  }, [session])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleAcceptReview = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/reviews/${assignmentId}/accept`, {
        method: "POST",
      })
      if (response.ok) {
        // Refresh assignments
        window.location.reload()
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error accepting review:", error)
      }
    }
  }

  const handleDeclineReview = async (assignmentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/reviews/${assignmentId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (response.ok) {
        // Refresh assignments
        window.location.reload()
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error declining review:", error)
      }
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedReview) return

    try {
      const response = await fetch(`/api/reviews/${selectedReview.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      })
      if (response.ok) {
        setSelectedReview(null)
        setReviewForm({
          recommendation: "",
          comments: "",
          confidentialComments: "",
          rating: 0,
          strengths: "",
          weaknesses: "",
          suggestions: "",
        })
        // Refresh assignments
        window.location.reload()
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error submitting review:", error)
      }
    }
  }

  const reviewerStats = [
    {
      title: "Total Reviews",
      value: stats.totalReviews.toString(),
      icon: FileText,
      change: `${stats.completedReviews} completed`,
      color: "text-blue-600",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingReviews.toString(),
      icon: Clock,
      change: "Active assignments",
      color: "text-orange-600",
    },
    {
      title: "On-Time Rate",
      value: `${stats.onTimeCompletion}%`,
      icon: Target,
      change: "Deadline performance",
      color: "text-green-600",
    },
    {
      title: "Current Streak",
      value: stats.currentStreak.toString(),
      icon: Award,
      change: "Reviews on time",
      color: "text-purple-600",
    },
  ]

  return (
    <RouteGuard allowedRoles={["reviewer", "editor", "admin"]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Reviewer Dashboard</h1>
                <p className="text-gray-600">Manage your peer review assignments and contributions</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {reviewerStats.map((stat, index) => (
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
          <Tabs defaultValue="assignments" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="assignments">Review Queue</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="expertise">Expertise</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="coi">COI Declaration</TabsTrigger>
              <TabsTrigger value="time-limits">Time Limits</TabsTrigger>
            </TabsList>

            <TabsContent value="assignments" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Pending Review Assignments</h2>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                {assignments
                  .filter(assignment => assignment.status === "pending")
                  .map((assignment) => {
                    const daysLeft = getDaysUntilDeadline(assignment.deadline)
                    return (
                      <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                                <Badge className={getPriorityColor(assignment.priority)}>
                                  {assignment.priority.toUpperCase()}
                                </Badge>
                                {daysLeft <= 3 && (
                                  <Badge className="bg-red-100 text-red-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {daysLeft} days left
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <Badge variant="secondary">{assignment.category}</Badge>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Due: {new Date(assignment.deadline).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" />
                                  {assignment.wordCount.toLocaleString()} words
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {assignment.abstract}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              Authors: {assignment.authors.join(", ")}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAcceptReview(assignment.id)}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeclineReview(assignment.id, "Conflict of interest")}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Reviews In Progress</h2>
              </div>

              <div className="grid gap-6">
                {assignments
                  .filter(assignment => assignment.status === "in_progress")
                  .map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{assignment.title}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <Badge variant="secondary">{assignment.category}</Badge>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due: {new Date(assignment.deadline).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => setSelectedReview(assignment)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Continue Review
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>60%</span>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Review Performance</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Review Quality
                    </CardTitle>
                    <CardDescription>Your review ratings and feedback</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="font-semibold text-xl text-green-600">
                          {stats.averageRating.toFixed(1)}/5.0
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed Reviews</span>
                      <span className="font-semibold text-xl text-blue-600">{stats.completedReviews}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Response Rate</span>
                      <span className="font-semibold text-xl text-purple-600">95%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Award className="h-5 w-5 mr-2 text-purple-600" />
                      Achievements
                    </CardTitle>
                    <CardDescription>Recognition for your contributions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gold-100 p-2 rounded-full">
                        <Award className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium">Top Reviewer 2024</div>
                        <div className="text-sm text-gray-500">50+ quality reviews</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Punctuality Expert</div>
                        <div className="text-sm text-gray-500">95% on-time completion</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="coi" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Conflict of Interest Declaration</h2>
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  Complete COI
                </Button>
              </div>
              
              <Card>
                <CardContent className="text-center py-12">
                  <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Conflict of Interest Declaration
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Complete your conflict of interest declaration for assigned manuscripts.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button onClick={() => router.push('/reviewer/coi/declare')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Complete Declaration
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/reviewer/coi/history')}>
                      <FileText className="h-4 w-4 mr-2" />
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="time-limits" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Time Limit Monitoring</h2>
                <Button>
                  <Clock className="h-4 w-4 mr-2" />
                  View Deadlines
                </Button>
              </div>
              
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Time Limit Management
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Monitor your review deadlines and time limits.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button onClick={() => router.push('/reviewer/time-limits/overview')}>
                      <Clock className="h-4 w-4 mr-2" />
                      View Deadlines
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/reviewer/time-limits/settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Time Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Review Form Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Review: {selectedReview.title}</h2>
                <Button variant="outline" onClick={() => setSelectedReview(null)}>
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Recommendation</label>
                  <Select value={reviewForm.recommendation} onValueChange={(value) => 
                    setReviewForm({...reviewForm, recommendation: value})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommendation" />
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
                  <label className="block text-sm font-medium mb-2">Overall Rating</label>
                  <Select value={reviewForm.rating.toString()} onValueChange={(value) => 
                    setReviewForm({...reviewForm, rating: parseInt(value)})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Rate the manuscript" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="2">2 - Poor</SelectItem>
                      <SelectItem value="1">1 - Very Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Strengths</label>
                  <Textarea 
                    value={reviewForm.strengths}
                    onChange={(e) => setReviewForm({...reviewForm, strengths: e.target.value})}
                    placeholder="What are the main strengths of this manuscript?"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Weaknesses</label>
                  <Textarea 
                    value={reviewForm.weaknesses}
                    onChange={(e) => setReviewForm({...reviewForm, weaknesses: e.target.value})}
                    placeholder="What are the main weaknesses that need to be addressed?"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Comments for Author</label>
                  <Textarea 
                    value={reviewForm.comments}
                    onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})}
                    placeholder="Detailed comments and suggestions for the author..."
                    rows={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confidential Comments for Editor</label>
                  <Textarea 
                    value={reviewForm.confidentialComments}
                    onChange={(e) => setReviewForm({...reviewForm, confidentialComments: e.target.value})}
                    placeholder="Private comments for the editor only..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedReview(null)}>
                    Save Draft
                  </Button>
                  <Button onClick={handleSubmitReview} className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-1" />
                    Submit Review
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  )
}
