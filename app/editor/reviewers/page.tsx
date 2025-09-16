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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Star,
  Mail,
  Filter,
  Search,
  MoreHorizontal,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  Eye,
  UserPlus,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react"

interface Reviewer {
  id: string
  name: string
  email: string
  affiliation?: string
  expertise: string[]
  currentLoad: number
  maxLoad: number
  averageRating: number
  onTimeRate: number
  completedReviews: number
  pendingReviews: number
  lastActive: string
  status: "active" | "inactive" | "unavailable" | "on_leave"
  responseTime: number // in days
  qualityScore: number
  orcid?: string
  languages?: string[]
  availability: "available" | "limited" | "unavailable"
}

interface ReviewerStats {
  totalReviewers: number
  activeReviewers: number
  availableReviewers: number
  overloadedReviewers: number
  averageResponseTime: number
  averageQualityScore: number
}

export default function ReviewersPage() {
  const { data: session } = useSession()
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [filteredReviewers, setFilteredReviewers] = useState<Reviewer[]>([])
  const [stats, setStats] = useState<ReviewerStats>({
    totalReviewers: 0,
    activeReviewers: 0,
    availableReviewers: 0,
    overloadedReviewers: 0,
    averageResponseTime: 0,
    averageQualityScore: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [expertiseFilter, setExpertiseFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviewers()
    fetchStats()
  }, [])

  useEffect(() => {
    filterReviewers()
  }, [reviewers, searchTerm, statusFilter, availabilityFilter, expertiseFilter])

  const fetchReviewers = async () => {
    try {
      const response = await fetch('/api/editor/reviewers')
      if (response.ok) {
        const data = await response.json()
        setReviewers(data.reviewers || [])
      } else {
        console.error('Failed to fetch reviewers')
        setReviewers([])
      }
    } catch (error) {
      console.error("Error fetching reviewers:", error)
      setReviewers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/editor/reviewers/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      } else {
        console.error('Failed to fetch reviewer stats')
      }
    } catch (error) {
      console.error("Error fetching reviewer stats:", error)
    }
  }

  const filterReviewers = () => {
    let filtered = reviewers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reviewer =>
        reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.affiliation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(reviewer => reviewer.status === statusFilter)
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      filtered = filtered.filter(reviewer => reviewer.availability === availabilityFilter)
    }

    // Expertise filter
    if (expertiseFilter !== "all") {
      filtered = filtered.filter(reviewer => 
        reviewer.expertise.some(exp => exp.toLowerCase().includes(expertiseFilter.toLowerCase()))
      )
    }

    setFilteredReviewers(filtered)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      unavailable: "bg-red-100 text-red-800",
      on_leave: "bg-yellow-100 text-yellow-800"
    }
    return variants[status as keyof typeof variants] || variants.inactive
  }

  const getAvailabilityBadge = (availability: string) => {
    const variants = {
      available: "bg-green-100 text-green-800",
      limited: "bg-yellow-100 text-yellow-800",
      unavailable: "bg-red-100 text-red-800"
    }
    return variants[availability as keyof typeof variants] || variants.unavailable
  }

  const getWorkloadColor = (currentLoad: number, maxLoad: number) => {
    const percentage = (currentLoad / maxLoad) * 100
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-green-600"
  }

  const getQualityStars = (score: number) => {
    const stars = []
    const fullStars = Math.floor(score)
    const hasHalfStar = score % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-200 text-yellow-400" />)
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />)
      }
    }
    return stars
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
              <h1 className="text-2xl font-bold text-gray-900">Reviewer Management</h1>
              <p className="text-gray-600">Manage reviewer pool and track performance</p>
            </div>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Reviewer
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Reviewers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReviewers}</div>
                <div className="text-sm text-gray-500">All reviewers</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activeReviewers}</div>
                <div className="text-sm text-gray-500">Currently active</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.availableReviewers}</div>
                <div className="text-sm text-gray-500">Ready for assignment</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Overloaded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overloadedReviewers}</div>
                <div className="text-sm text-gray-500">At capacity</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageResponseTime}d</div>
                <div className="text-sm text-gray-500">Response time</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageQualityScore}</div>
                <div className="text-sm text-gray-500">Quality score</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Reviewers</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="busy">Busy</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search reviewers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Availability</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reviewers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviewer Directory</CardTitle>
                  <CardDescription>
                    Complete list of reviewers with their specialties and availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Expertise</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Workload</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviewers.map((reviewer) => (
                        <TableRow key={reviewer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{reviewer.name}</div>
                              <div className="text-sm text-gray-500">{reviewer.email}</div>
                              {reviewer.affiliation && (
                                <div className="text-sm text-gray-500">{reviewer.affiliation}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {reviewer.expertise.slice(0, 3).map((exp, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {exp}
                                </Badge>
                              ))}
                              {reviewer.expertise.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{reviewer.expertise.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getStatusBadge(reviewer.status)}>
                                {reviewer.status.replace("_", " ")}
                              </Badge>
                              <Badge className={getAvailabilityBadge(reviewer.availability)}>
                                {reviewer.availability}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={(reviewer.currentLoad / reviewer.maxLoad) * 100} 
                                  className="w-16"
                                />
                                <span className={`text-sm font-medium ${getWorkloadColor(reviewer.currentLoad, reviewer.maxLoad)}`}>
                                  {reviewer.currentLoad}/{reviewer.maxLoad}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {reviewer.pendingReviews} pending
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {reviewer.onTimeRate}% on-time
                              </div>
                              <div className="text-xs text-gray-500">
                                {reviewer.completedReviews} completed
                              </div>
                              <div className="text-xs text-gray-500">
                                ~{reviewer.responseTime}d response
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                {getQualityStars(reviewer.qualityScore)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {reviewer.qualityScore}/5.0
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="available" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Reviewers</CardTitle>
                  <CardDescription>
                    Reviewers currently available for new assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredReviewers
                      .filter(r => r.availability === "available" && r.currentLoad < r.maxLoad)
                      .map((reviewer) => (
                        <Card key={reviewer.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <div className="font-medium">{reviewer.name}</div>
                                <div className="text-sm text-gray-500">{reviewer.affiliation}</div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1">
                                {reviewer.expertise.slice(0, 2).map((exp, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {exp}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                  {reviewer.currentLoad}/{reviewer.maxLoad} load
                                </div>
                                <div className="flex items-center gap-1">
                                  {getQualityStars(reviewer.qualityScore).slice(0, 5)}
                                </div>
                              </div>

                              <Button size="sm" className="w-full">
                                <UserCheck className="w-4 h-4 mr-2" />
                                Assign Review
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="busy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Busy Reviewers</CardTitle>
                  <CardDescription>
                    Reviewers currently at or near capacity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Current Load</TableHead>
                        <TableHead>Pending Reviews</TableHead>
                        <TableHead>Expected Availability</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviewers
                        .filter(r => r.currentLoad >= r.maxLoad * 0.8)
                        .map((reviewer) => (
                          <TableRow key={reviewer.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{reviewer.name}</div>
                                <div className="text-sm text-gray-500">{reviewer.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={(reviewer.currentLoad / reviewer.maxLoad) * 100} 
                                  className="w-20"
                                />
                                <span className={`text-sm font-medium ${getWorkloadColor(reviewer.currentLoad, reviewer.maxLoad)}`}>
                                  {reviewer.currentLoad}/{reviewer.maxLoad}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {reviewer.pendingReviews} pending
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                ~{Math.ceil(reviewer.responseTime * reviewer.pendingReviews)} days
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredReviewers
                        .sort((a, b) => b.qualityScore - a.qualityScore)
                        .slice(0, 5)
                        .map((reviewer, index) => (
                          <div key={reviewer.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{reviewer.name}</div>
                                <div className="text-xs text-gray-500">{reviewer.completedReviews} reviews</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{reviewer.qualityScore}</div>
                              <div className="text-xs text-gray-500">{reviewer.onTimeRate}% on-time</div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Fastest Responders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredReviewers
                        .sort((a, b) => a.responseTime - b.responseTime)
                        .slice(0, 5)
                        .map((reviewer) => (
                          <div key={reviewer.id} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{reviewer.name}</div>
                              <div className="text-xs text-gray-500">{reviewer.completedReviews} reviews</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{reviewer.responseTime}d</div>
                              <div className="text-xs text-gray-500">avg response</div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Need Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredReviewers
                        .filter(r => r.onTimeRate < 80 || r.qualityScore < 3.5)
                        .slice(0, 5)
                        .map((reviewer) => (
                          <div key={reviewer.id} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{reviewer.name}</div>
                              <div className="text-xs text-red-500">
                                {reviewer.onTimeRate < 80 ? 'Low on-time rate' : 'Low quality score'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-red-600">
                                {reviewer.onTimeRate < 80 ? `${reviewer.onTimeRate}%` : reviewer.qualityScore}
                              </div>
                            </div>
                          </div>
                        ))
                      }
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