"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import EditorLayout from "@/components/layouts/editor-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Eye,
  Search,
  Filter,
  UserCheck,
  Calendar,
  Download,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  BookOpen,
  Award,
  Zap
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import RoleSwitcher from "@/components/role-switcher"

interface Submission {
  id: string
  articleId: string
  status: string
  title: string
  abstract: string
  category: string
  keywords: string[]
  author: {
    id: string
    name: string
    email: string
    affiliation: string
    orcid?: string
  }
  coAuthorsCount: number
  editorId?: string
  isAssignedToCurrentUser: boolean
  reviewerCount: number
  hasFiles: boolean
  fileCount: number
  views: number
  downloads: number
  citations: number
  submittedAt: string
  createdAt: string
  availableActions: string[]
  priority: "low" | "medium" | "high" | "urgent"
  daysSinceSubmission: number
  doi?: string
  hasDoi: boolean
}

interface EditorStats {
  totalAssigned: number
  underReview: number
  awaitingDecision: number
  pendingAssignment: number
  recentlyCompleted: number
}

export default function EditorSubmissionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<EditorStats>({
    totalAssigned: 0,
    underReview: 0,
    awaitingDecision: 0,
    pendingAssignment: 0,
    recentlyCompleted: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [activeFilter, setActiveFilter] = useState(searchParams.get("filter") || "assigned_to_me")

  useEffect(() => {
    fetchSubmissions()
  }, [activeFilter, statusFilter, categoryFilter, searchTerm])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        filter: activeFilter,
        limit: "50",
        offset: "0"
      })
      
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/editor/submissions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "submitted": { color: "bg-blue-100 text-blue-800", label: "New Submission" },
      "editorial_assistant_review": { color: "bg-yellow-100 text-yellow-800", label: "Initial Review" },
      "associate_editor_assignment": { color: "bg-orange-100 text-orange-800", label: "Awaiting Assignment" },
      "associate_editor_review": { color: "bg-purple-100 text-purple-800", label: "Editor Review" },
      "reviewer_assignment": { color: "bg-indigo-100 text-indigo-800", label: "Assigning Reviewers" },
      "under_review": { color: "bg-blue-100 text-blue-800", label: "Under Review" },
      "revision_requested": { color: "bg-amber-100 text-amber-800", label: "Revision Requested" },
      "revision_submitted": { color: "bg-green-100 text-green-800", label: "Revision Submitted" },
      "accepted": { color: "bg-emerald-100 text-emerald-800", label: "Accepted" },
      "rejected": { color: "bg-red-100 text-red-800", label: "Rejected" },
      "published": { color: "bg-green-100 text-green-800", label: "Published" },
      "withdrawn": { color: "bg-gray-100 text-gray-800", label: "Withdrawn" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Zap className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const handleAction = (action: string, submissionId: string) => {
    switch (action) {
      case "assign_to_me":
        // Implement assignment logic
        router.push(`/editor/assignments/${submissionId}`)
        break
      case "review":
        router.push(`/editor/review/${submissionId}`)
        break
      case "view_details":
        router.push(`/editor/submissions/${submissionId}`)
        break
      case "assign_reviewers":
        router.push(`/editor/assign-reviewers/${submissionId}`)
        break
      case "view_reviews":
        router.push(`/editor/reviews/${submissionId}`)
        break
      case "make_decision":
        router.push(`/editor/decision/${submissionId}`)
        break
      default:
        console.log(`Action ${action} not implemented yet`)
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["editor", "chief-editor", "associate-editor", "section-editor", "managing-editor", "editor-in-chief", "admin"]}>
        <EditorLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editor", "chief-editor", "associate-editor", "section-editor", "managing-editor", "editor-in-chief", "admin"]}>
      <EditorLayout>
        <div className="space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Editorial Submissions Management
            </h1>
            <p className="text-gray-600">
              Manage and review manuscript submissions across the editorial workflow
            </p>
          </div>

          {/* Role Switcher */}
          <div className="mb-8">
            <RoleSwitcher onRoleChange={(newRole) => {
              window.location.reload()
            }} />
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned to Me</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAssigned}</div>
                <p className="text-xs text-muted-foreground">
                  Active assignments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.underReview}</div>
                <p className="text-xs text-muted-foreground">
                  Peer review in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Awaiting Decision</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.awaitingDecision}</div>
                <p className="text-xs text-muted-foreground">
                  Reviews completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Assignment</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingAssignment}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting editor assignment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recently Completed</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentlyCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  Accepted & published
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submission Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by title, author, or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">New Submission</SelectItem>
                    <SelectItem value="associate_editor_review">Editor Review</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="revision_requested">Revision Requested</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="bioengineering">Bioengineering</SelectItem>
                    <SelectItem value="biomedical-engineering">Biomedical Engineering</SelectItem>
                    <SelectItem value="biotechnology">Biotechnology</SelectItem>
                    <SelectItem value="computational-biology">Computational Biology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tab Filters */}
              <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="assigned_to_me">My Assignments</TabsTrigger>
                  <TabsTrigger value="pending_assignment">Unassigned</TabsTrigger>
                  <TabsTrigger value="under_review">Under Review</TabsTrigger>
                  <TabsTrigger value="ready_for_decision">Ready for Decision</TabsTrigger>
                  <TabsTrigger value="recently_submitted">Recent</TabsTrigger>
                  <TabsTrigger value="all">All Submissions</TabsTrigger>
                </TabsList>

                <TabsContent value={activeFilter} className="mt-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Priority</TableHead>
                          <TableHead>Title & Author</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Metrics</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getPriorityIcon(submission.priority)}
                                <span className="text-xs text-gray-500">
                                  {submission.daysSinceSubmission}d
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{submission.title}</div>
                                <div className="text-sm text-gray-500">
                                  {submission.author.name} • {submission.author.affiliation}
                                </div>
                                {submission.coAuthorsCount > 0 && (
                                  <div className="text-xs text-gray-400">
                                    +{submission.coAuthorsCount} co-authors
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{submission.category}</Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(submission.status)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {submission.daysSinceSubmission} days ago
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {submission.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {submission.downloads}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {submission.reviewerCount}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {submission.availableActions.slice(0, 2).map((action) => (
                                  <Button
                                    key={action}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAction(action, submission.id)}
                                  >
                                    {action === "view_details" && <Eye className="h-3 w-3 mr-1" />}
                                    {action === "assign_to_me" && <UserCheck className="h-3 w-3 mr-1" />}
                                    {action === "review" && <BookOpen className="h-3 w-3 mr-1" />}
                                    {action === "assign_reviewers" && <Users className="h-3 w-3 mr-1" />}
                                    {action.replace(/_/g, " ")}
                                  </Button>
                                ))}
                                {submission.availableActions.length > 2 && (
                                  <Button variant="outline" size="sm">
                                    More...
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {submissions.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
                      <p className="text-gray-600">
                        {activeFilter === "assigned_to_me" 
                          ? "You don't have any submissions assigned to you yet."
                          : "No submissions match your current filters."
                        }
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </EditorLayout>
    </RouteGuard>
  )
}