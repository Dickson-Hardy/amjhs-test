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
import {
  Clock,
  UserPlus,
  Users,
  Star,
  Mail,
  Filter,
  Search,
  MoreHorizontal,
  UserCheck,
  AlertCircle,
  TrendingUp,
} from "lucide-react"

interface Reviewer {
  id: string
  name: string
  email: string
  expertise: string[]
  currentLoad: number
  maxLoad: number
  averageRating: number
  onTimeRate: number
  completedReviews: number
  lastActive: string
  status: "active" | "inactive" | "unavailable"
  responseTime: number // in days
}

interface Assignment {
  id: string
  manuscriptId: string
  manuscriptTitle: string
  reviewerId: string
  reviewerName: string
  assignedDate: string
  dueDate: string
  status: "pending" | "accepted" | "declined" | "completed" | "overdue"
  estimatedCompletion?: string
}

export default function ReviewerAssignmentsPage() {
  const { data: session } = useSession()
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredReviewers, setFilteredReviewers] = useState<Reviewer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expertiseFilter, setExpertiseFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("reviewers")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviewers()
    fetchAssignments()
  }, [])

  useEffect(() => {
    filterReviewers()
  }, [reviewers, searchTerm, statusFilter, expertiseFilter])

  const fetchReviewers = async () => {
    try {
      const response = await fetch('/api/admin/reviewers')
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

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/editor/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      } else {
        console.error('Failed to fetch assignments')
        setAssignments([])
      }
    } catch (error) {
      console.error("Error fetching assignments:", error)
      setAssignments([])
    }
  }

  const filterReviewers = () => {
    let filtered = reviewers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reviewer =>
        reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.expertise.some(exp => 
          exp.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(reviewer => reviewer.status === statusFilter)
    }

    setFilteredReviewers(filtered)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      unavailable: "bg-red-100 text-red-800"
    }
    return variants[status as keyof typeof variants] || variants.inactive
  }

  const getLoadColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage >= 80) return "text-red-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-green-600"
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
              <p className="text-gray-600">Manage reviewer assignments and track performance</p>
            </div>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Reviewer
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
              <TabsTrigger value="assignments">Current Assignments</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="reviewers" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reviewers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviewer Database</CardTitle>
                  <CardDescription>
                    Manage your pool of peer reviewers and track their availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Expertise</TableHead>
                        <TableHead>Current Load</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Status</TableHead>
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
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {reviewer.expertise.slice(0, 2).map((exp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {exp}
                                </Badge>
                              ))}
                              {reviewer.expertise.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{reviewer.expertise.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${getLoadColor(reviewer.currentLoad, reviewer.maxLoad)}`}>
                              {reviewer.currentLoad}/{reviewer.maxLoad}
                            </div>
                            <div className="text-sm text-gray-500">reviews</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{reviewer.averageRating}</span>
                              <span className="text-sm text-gray-500">({reviewer.onTimeRate}% on time)</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(reviewer.status)}>
                              {reviewer.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Review Assignments</CardTitle>
                  <CardDescription>
                    Track active review assignments and their progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manuscript</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div className="font-medium">{assignment.manuscriptTitle}</div>
                            <div className="text-sm text-gray-500">ID: {assignment.manuscriptId}</div>
                          </TableCell>
                          <TableCell>{assignment.reviewerName}</TableCell>
                          <TableCell>{new Date(assignment.assignedDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={assignment.status === "accepted" ? "default" : "secondary"}>
                              {assignment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Mail className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Average Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4.7</div>
                    <p className="text-gray-600 text-sm">Overall reviewer performance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      On-Time Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">91%</div>
                    <p className="text-gray-600 text-sm">Reviews completed on time</p>
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
                    <div className="text-2xl font-bold">{reviewers.filter(r => r.status === 'active').length}</div>
                    <p className="text-gray-600 text-sm">Currently available</p>
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