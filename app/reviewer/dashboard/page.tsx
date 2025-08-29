"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { RouteGuard } from "@/components/route-guard"
import ReviewerLayout from "@/components/layouts/reviewer-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Clock, FileText, Star, CheckCircle, Calendar, Target, TrendingUp, Award, Eye, Download, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ReviewAssignment {
  id: string
  articleId: string
  status: string
  createdAt: string
  dueDate: string
  articleTitle: string
  manuscriptNumber: string
  assignedDate: string
  reviewStatus: string
  completedAt?: string
}

interface DashboardStats {
  totalAssigned: number
  pending: number
  completed: number
  overdue: number
}

export default function ReviewerDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalAssigned: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/reviewer/dashboard")
      if (!response.ok) {
        throw new AppError("Failed to fetch dashboard data")
      }
      const data = await response.json()
      setAssignments(data.assignments || [])
      setStats(data.stats || { totalAssigned: 0, pending: 0, completed: 0, overdue: 0 })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching dashboard data:", error)
      }
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getProgressPercentage = (assignedDate: string, dueDate: string) => {
    const assigned = new Date(assignedDate)
    const due = new Date(dueDate)
    const now = new Date()
    
    const totalTime = due.getTime() - assigned.getTime()
    const elapsedTime = now.getTime() - assigned.getTime()
    
    const percentage = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100))
    return Math.round(percentage)
  }

  const filteredAssignments = assignments.filter(assignment => {
    switch (activeTab) {
      case "pending":
        return assignment.reviewStatus === "pending" || assignment.reviewStatus === "in_progress"
      case "completed":
        return assignment.reviewStatus === "completed"
      case "all":
        return true
      default:
        return true
    }
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login?returnUrl=' + encodeURIComponent('/reviewer/dashboard'))
    }
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access the reviewer portal.
          </p>
          <Button onClick={() => router.push('/auth/login')}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <RouteGuard allowedRoles={["reviewer", "admin"]}>
      <ReviewerLayout>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Assigned</CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{stats.totalAssigned}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-gray-500 mt-1">Reviews finished</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-gray-500 mt-1">Past due date</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Pending Reviews</h2>
              {stats.pending > 0 && (
                <Badge className="bg-orange-100 text-orange-800">
                  {stats.pending} review{stats.pending !== 1 ? 's' : ''} due
                </Badge>
              )}
            </div>

            {filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Reviews</h3>
                  <p className="text-gray-600">
                    You're all caught up! No manuscripts are currently assigned for review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const daysRemaining = getDaysRemaining(assignment.dueDate)
                  const progress = getProgressPercentage(assignment.assignedDate, assignment.dueDate)
                  const isOverdue = daysRemaining < 0
                  
                  return (
                    <Card key={assignment.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{assignment.articleTitle}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    {assignment.manuscriptNumber}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <Badge className={getStatusColor(assignment.reviewStatus)}>
                                {assignment.reviewStatus.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>

                            {/* Progress and Due Date */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Review Progress</span>
                                <span className={`font-medium ${isOverdue ? "text-red-600" : daysRemaining <= 3 ? "text-yellow-600" : "text-green-600"}`}>
                                  {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : 
                                   daysRemaining === 0 ? "Due today" :
                                   `${daysRemaining} days remaining`}
                                </span>
                              </div>
                              <Progress 
                                value={progress} 
                                className={`h-2 ${isOverdue ? "bg-red-100" : ""}`}
                              />
                              <div className="text-xs text-gray-600">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </div>
                            </div>

                            {isOverdue && (
                              <Alert variant="destructive" className="py-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  This review is overdue. Please complete as soon as possible.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/reviewer/manuscript/${assignment.articleId}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Manuscript
                              </Link>
                            </Button>
                            
                            <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700">
                              <Link href={`/reviewer/review/${assignment.id}`}>
                                Submit Review
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Completed Reviews</h2>
            </div>

            {filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Reviews</h3>
                  <p className="text-gray-600">
                    Your completed reviews will appear here once you finish your first review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => (
                  <Card key={assignment.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{assignment.articleTitle}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  {assignment.manuscriptNumber}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Completed: {assignment.completedAt ? new Date(assignment.completedAt).toLocaleDateString() : 'Recently'}
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              COMPLETED
                            </Badge>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/reviewer/review/${assignment.id}/view`}>
                              <Download className="h-4 w-4 mr-2" />
                              View Review
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Resources & Guidelines</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Review Guidelines</CardTitle>
                  <CardDescription>Essential guidelines for high-quality reviews</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/reviewer/guidelines">
                      <FileText className="h-4 w-4 mr-2" />
                      Peer Review Guidelines
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/submission-guidelines">
                      <FileText className="h-4 w-4 mr-2" />
                      Submission Guidelines
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/ethical-guidelines">
                      <Star className="h-4 w-4 mr-2" />
                      Ethical Review Standards
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Manage your reviewer profile and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/reviewer/profile">
                      <Clock className="h-4 w-4 mr-2" />
                      Update Profile & Expertise
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/reviewer/availability">
                      <Calendar className="h-4 w-4 mr-2" />
                      Set Availability
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/reviewer/preferences">
                      <Target className="h-4 w-4 mr-2" />
                      Review Preferences
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Important Notes */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="text-blue-800">
                  <h4 className="font-semibold mb-2">📋 Important Reminders</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Reviews are typically due within 21 days of acceptance</li>
                    <li>• All manuscript materials must remain strictly confidential</li>
                    <li>• Provide constructive feedback to help authors improve their work</li>
                    <li>• Contact the editorial team if you need an extension or have concerns</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </ReviewerLayout>
    </RouteGuard>
  )
}
