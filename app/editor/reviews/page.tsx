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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Star,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Filter,
  Search,
  TrendingUp,
  Calendar,
} from "lucide-react"

interface Review {
  id: string
  manuscriptId: string
  manuscriptTitle: string
  reviewerId: string
  reviewerName: string
  assignedDate: string
  dueDate: string
  status: "pending" | "accepted" | "declined" | "in_progress" | "completed" | "overdue"
  score?: number
  completedDate?: string
  timeSpent?: number // in hours
  quality: "excellent" | "good" | "fair" | "poor"
}

interface ReviewMetrics {
  totalReviews: number
  completedReviews: number
  pendingReviews: number
  overdueReviews: number
  averageCompletionTime: number
  averageScore: number
  onTimeRate: number
}

export default function ReviewsPage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [metrics, setMetrics] = useState<ReviewMetrics>({
    totalReviews: 0,
    completedReviews: 0,
    pendingReviews: 0,
    overdueReviews: 0,
    averageCompletionTime: 0,
    averageScore: 0,
    onTimeRate: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("active")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
    fetchMetrics()
  }, [])

  useEffect(() => {
    filterReviews()
  }, [reviews, searchTerm, statusFilter, activeTab])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/editor/reviews')
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      } else {
        console.error('Failed to fetch reviews')
        setReviews([])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/editor/reviews/stats')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics || {
          totalReviews: 0,
          completedReviews: 0,
          pendingReviews: 0,
          overdueReviews: 0,
          averageCompletionTime: 0,
          averageScore: 0,
          onTimeRate: 0
        })
      } else {
        console.error('Failed to fetch metrics')
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    }
  }

  const filterReviews = () => {
    let filtered = reviews

    // Tab filter
    if (activeTab === "active") {
      filtered = filtered.filter(review => 
        ["pending", "accepted", "in_progress"].includes(review.status)
      )
    } else if (activeTab === "completed") {
      filtered = filtered.filter(review => review.status === "completed")
    } else if (activeTab === "overdue") {
      filtered = filtered.filter(review => review.status === "overdue")
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.manuscriptTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(review => review.status === statusFilter)
    }

    setFilteredReviews(filtered)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      declined: "bg-red-100 text-red-800",
      in_progress: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800"
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const getQualityBadge = (quality: string) => {
    const variants = {
      excellent: "bg-green-100 text-green-800",
      good: "bg-blue-100 text-blue-800",
      fair: "bg-yellow-100 text-yellow-800",
      poor: "bg-red-100 text-red-800"
    }
    return variants[quality as keyof typeof variants] || variants.fair
  }

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["editor", "admin"]}>
        <EditorLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editor", "admin"]}>
      <EditorLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Peer Review Management</h1>
              <p className="text-gray-600">Track and manage the peer review process</p>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalReviews}</div>
                <div className="text-sm text-gray-500">All time</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.completedReviews}</div>
                <div className="text-sm text-gray-500">
                  {Math.round((metrics.completedReviews / metrics.totalReviews) * 100)}% completion rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{metrics.pendingReviews}</div>
                <div className="text-sm text-gray-500">Awaiting completion</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.overdueReviews}</div>
                <div className="text-sm text-gray-500">Need attention</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">Active Reviews</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reviews Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Reviews</CardTitle>
                  <CardDescription>
                    Monitor ongoing peer review assignments and their progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manuscript</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviews.map((review) => {
                        const daysRemaining = getDaysRemaining(review.dueDate)
                        return (
                          <TableRow key={review.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{review.manuscriptTitle}</div>
                                <div className="text-sm text-gray-500">ID: {review.manuscriptId}</div>
                              </div>
                            </TableCell>
                            <TableCell>{review.reviewerName}</TableCell>
                            <TableCell>
                              <div>
                                <div>{new Date(review.dueDate).toLocaleDateString()}</div>
                                <div className={`text-sm ${daysRemaining < 0 ? 'text-red-500' : daysRemaining <= 3 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : 
                                   daysRemaining === 0 ? 'Due today' :
                                   `${daysRemaining} days remaining`}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(review.status)}>
                                {review.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getQualityBadge(review.quality)}>
                                {review.quality}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MessageSquare className="w-4 h-4" />
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
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Reviews</CardTitle>
                  <CardDescription>
                    View completed peer reviews and their outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manuscript</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Time Spent</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.filter(r => r.status === "completed").map((review) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{review.manuscriptTitle}</div>
                              <div className="text-sm text-gray-500">ID: {review.manuscriptId}</div>
                            </div>
                          </TableCell>
                          <TableCell>{review.reviewerName}</TableCell>
                          <TableCell>
                            {review.score && (
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="font-medium">{review.score}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {review.completedDate && new Date(review.completedDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {review.timeSpent && `${review.timeSpent}h`}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overdue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overdue Reviews</CardTitle>
                  <CardDescription>
                    Reviews that have passed their deadline and need attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manuscript</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.filter(r => r.status === "overdue").map((review) => {
                        const daysOverdue = Math.abs(getDaysRemaining(review.dueDate))
                        return (
                          <TableRow key={review.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{review.manuscriptTitle}</div>
                                <div className="text-sm text-gray-500">ID: {review.manuscriptId}</div>
                              </div>
                            </TableCell>
                            <TableCell>{review.reviewerName}</TableCell>
                            <TableCell>{new Date(review.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <span className="text-red-600 font-medium">{daysOverdue} days</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  <MessageSquare className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <AlertTriangle className="w-4 h-4" />
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
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Average Completion Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.averageCompletionTime} days</div>
                    <Progress value={65} className="mt-2" />
                    <p className="text-gray-600 text-sm mt-2">Target: 21 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Average Review Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.averageScore}</div>
                    <Progress value={82} className="mt-2" />
                    <p className="text-gray-600 text-sm mt-2">Out of 5.0</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      On-Time Completion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.onTimeRate}%</div>
                    <Progress value={metrics.onTimeRate} className="mt-2" />
                    <p className="text-gray-600 text-sm mt-2">Reviews completed on time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Active Reviewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">18</div>
                    <p className="text-gray-600 text-sm mt-2">Currently assigned</p>
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