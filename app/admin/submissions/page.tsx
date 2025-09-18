"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  BarChart3,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"

interface Submission {
  id: string
  title: string
  authors: string[]
  submittedDate: string
  status: 'submitted' | 'under_review' | 'revision_requested' | 'accepted' | 'rejected' | 'published'
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reviewers: { id: string; name: string; status: string }[]
  editor: string
  wordCount: number
  lastUpdate: string
  doi?: string
}

interface SubmissionStats {
  totalSubmissions: number
  pendingReview: number
  underReview: number
  awaitingDecision: number
  accepted: number
  rejected: number
  published: number
  averageReviewTime: number
}

export default function AdminSubmissionsPage() {
  const { data: session } = useSession()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<SubmissionStats>({
    totalSubmissions: 0,
    pendingReview: 0,
    underReview: 0,
    awaitingDecision: 0,
    accepted: 0,
    rejected: 0,
    published: 0,
    averageReviewTime: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false })

  useEffect(() => {
    if (session?.user?.role !== "admin") return
    fetchSubmissionsData()
  }, [session, page, limit, filterStatus, filterCategory, searchTerm])

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterCategory, searchTerm])

  const fetchSubmissionsData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
  if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus)
  if (filterCategory && filterCategory !== 'all') params.set('category', filterCategory)
  if (searchTerm) params.set('search', searchTerm)
  params.set('page', String(page))
  params.set('limit', String(limit))

      const res = await fetch(`/api/admin/submissions?${params.toString()}`)
      if (!res.ok) {
        throw new Error(`Failed to load submissions (${res.status})`)
      }
      const data = await res.json()

      const apiItems = Array.isArray(data?.data) ? data.data : []
      // Map API to UI model; fill demo-friendly fields
      const mapped: Submission[] = apiItems.map((item: any) => ({
        id: item.id || item.submissionId,
        title: item.title || 'Untitled',
        authors: item.author?.name ? [item.author.name] : [],
        submittedDate: item.submittedDate || new Date().toISOString(),
        status: (item.status || 'submitted') as Submission['status'],
        category: item.category || 'General',
        priority: 'medium',
        reviewers: [],
        editor: item.assignedEditor || 'Not assigned',
        wordCount: 0,
        lastUpdate: item.updatedAt || item.submittedDate || new Date().toISOString(),
        doi: undefined,
      }))

      setSubmissions(mapped)
      if (data?.pagination) {
        setPagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasMore: data.pagination.hasMore,
        })
      } else {
        setPagination({ page, limit, total: mapped.length, totalPages: 1, hasMore: false })
      }

      // Compute lightweight stats from mapped data
      const statsComputed = {
        totalSubmissions: mapped.length,
        pendingReview: mapped.filter(s => s.status === 'submitted').length,
        underReview: mapped.filter(s => s.status === 'under_review').length,
        awaitingDecision: mapped.filter(s => s.status === 'revision_requested').length,
        accepted: mapped.filter(s => s.status === 'accepted').length,
        rejected: mapped.filter(s => s.status === 'rejected').length,
        published: mapped.filter(s => s.status === 'published').length,
        averageReviewTime: 0,
      }
      setStats(statsComputed)
    } catch (error) {
      console.error('Error fetching submissions data:', error)
      setSubmissions([])
      setStats({
        totalSubmissions: 0,
        pendingReview: 0,
        underReview: 0,
        awaitingDecision: 0,
        accepted: 0,
        rejected: 0,
        published: 0,
        averageReviewTime: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "revision_requested":
        return "bg-orange-100 text-orange-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "published":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500 bg-red-50"
      case "high":
        return "border-l-orange-500 bg-orange-50"
      case "medium":
        return "border-l-yellow-500 bg-yellow-50"
      case "low":
        return "border-l-green-500 bg-green-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    // Server-side filters applied; no extra client filtering needed
    return true
  })

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Submission Management</h1>
              <p className="text-gray-600">Monitor and manage all journal submissions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.underReview}</div>
              <p className="text-xs text-muted-foreground">Active reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Decision</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.awaitingDecision}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageReviewTime}d</div>
              <p className="text-xs text-muted-foreground">Processing time</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="revision_requested">Revision Requested</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Cardiology">Cardiology</SelectItem>
              <SelectItem value="Neurology">Neurology</SelectItem>
              <SelectItem value="Surgery">Surgery</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Psychiatry">Psychiatry</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
            <CardDescription>
              Showing {submissions.length} of {pagination.total} submissions · Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="text-sm text-gray-600">Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per page</span>
                <Select value={String(limit)} onValueChange={(v) => setLimit(parseInt(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">Title & Authors</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Category</TableHead>
                    <TableHead className="min-w-[150px]">Editor</TableHead>
                    <TableHead className="min-w-[120px]">Reviewers</TableHead>
                    <TableHead className="min-w-[100px]">Submitted</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} className={`border-l-4 ${getPriorityColor(submission.priority)}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm line-clamp-2">{submission.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {submission.authors.join(", ")}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {submission.wordCount.toLocaleString()} words
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{submission.editor}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {submission.reviewers.length > 0 ? (
                            submission.reviewers.map((reviewer, index) => (
                              <div key={index} className="text-xs">
                                <Badge variant="outline" className="text-xs">
                                  {reviewer.name.split(' ').pop()} - {reviewer.status}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">No reviewers assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(submission.submittedDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => setSelectedSubmission(submission)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Submission Details Dialog */}
        {selectedSubmission && (
          <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedSubmission.title}</DialogTitle>
                <DialogDescription>
                  Submission ID: {selectedSubmission.id} • Category: {selectedSubmission.category}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="authors">Authors</TabsTrigger>
                    <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Badge className={getStatusColor(selectedSubmission.status)}>
                          {selectedSubmission.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Priority</label>
                        <Badge variant="outline">{selectedSubmission.priority}</Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Word Count</label>
                        <p className="text-sm">{selectedSubmission.wordCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Editor</label>
                        <p className="text-sm">{selectedSubmission.editor}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Submitted Date</label>
                        <p className="text-sm">{new Date(selectedSubmission.submittedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Update</label>
                        <p className="text-sm">{new Date(selectedSubmission.lastUpdate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {selectedSubmission.doi && (
                      <div>
                        <label className="text-sm font-medium">DOI</label>
                        <p className="text-sm font-mono">{selectedSubmission.doi}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="authors" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Authors</label>
                      {selectedSubmission.authors.map((author, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <span>{author}</span>
                          {index === 0 && <Badge variant="outline">Corresponding Author</Badge>}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reviewers" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Assigned Reviewers</label>
                      {selectedSubmission.reviewers.length > 0 ? (
                        selectedSubmission.reviewers.map((reviewer, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <span>{reviewer.name}</span>
                            <Badge variant={reviewer.status === 'completed' ? 'default' : 'outline'}>
                              {reviewer.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No reviewers assigned yet</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="timeline" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Submission Received</p>
                          <p className="text-xs text-gray-500">{new Date(selectedSubmission.submittedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {selectedSubmission.reviewers.length > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium">Reviewers Assigned</p>
                            <p className="text-xs text-gray-500">
                              {selectedSubmission.reviewers.length} reviewer(s) assigned
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Current Status</p>
                          <p className="text-xs text-gray-500">
                            {selectedSubmission.status.replace('_', ' ')} - {new Date(selectedSubmission.lastUpdate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        )}
    </div>
  )
}
