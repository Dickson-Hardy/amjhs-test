"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubmissionActionButtons } from "@/components/submission-action-buttons"
import { SectionLoading } from "@/components/modern-loading"
import { handleError } from "@/lib/modern-error-handler"
import { toast } from "@/hooks/use-toast"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  Calendar,
  Plus,
  Filter,
  Search,
  SortDesc,
  Download,
  Edit,
  MoreHorizontal,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Target,
  TrendingUp
} from "lucide-react"

interface Submission {
  id: string
  title: string
  category: string
  submittedDate: string
  reviewers: number
  comments: number
  status: string
  lastUpdate: string
  progress?: number
  priority?: "high" | "medium" | "low"
  actionRequired?: boolean
}

interface SubmissionStats {
  total: number
  pending: number
  underReview: number
  published: number
  rejected: number
}

// Helper functions for status styling and formatting
const getStatusConfig = (status: string) => {
  const configs = {
    submitted: {
      label: "Submitted",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: <Clock className="h-3 w-3" />,
      description: "Under initial review by editorial team"
    },
    technical_check: {
      label: "Technical Check",
      color: "bg-purple-100 text-purple-800 border-purple-300",
      icon: <Eye className="h-3 w-3" />,
      description: "Under technical and editorial assessment"
    },
    under_review: {
      label: "Under Review",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: <Users className="h-3 w-3" />,
      description: "Being evaluated by peer reviewers"
    },
    revision_requested: {
      label: "Revision Requested",
      color: "bg-orange-100 text-orange-800 border-orange-300",
      icon: <Edit className="h-3 w-3" />,
      description: "Action required: Please address reviewer comments"
    },
    accepted: {
      label: "Accepted",
      color: "bg-green-100 text-green-800 border-green-300",
      icon: <CheckCircle className="h-3 w-3" />,
      description: "Congratulations! Your paper has been accepted"
    },
    published: {
      label: "Published",
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: <BookOpen className="h-3 w-3" />,
      description: "Your article is now published and available"
    },
    rejected: {
      label: "Rejected",
      color: "bg-red-100 text-red-800 border-red-300",
      icon: <XCircle className="h-3 w-3" />,
      description: "Unfortunately, your submission was not accepted"
    }
  }
  return configs[status as keyof typeof configs] || configs.submitted
}

const getPriorityColor = (priority: string) => {
  const colors = {
    high: "bg-red-100 text-red-800 border-red-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-green-100 text-green-800 border-green-300"
  }
  return colors[priority as keyof typeof colors] || colors.medium
}

const getSubmissionProgress = (status: string): number => {
  switch (status) {
    case "submitted": return 25
    case "technical_check": return 40
    case "under_review": return 60
    case "revision_requested": return 75
    case "accepted": return 95
    case "published": return 100
    case "rejected": return 100
    default: return 0
  }
}

const getSubmissionPriority = (status: string, submittedDate: string): "high" | "medium" | "low" => {
  const daysSinceSubmission = Math.floor((Date.now() - new Date(submittedDate).getTime()) / (1000 * 60 * 60 * 24))
  
  if (status === "revision_requested") return "high"
  if (status === "technical_check" && daysSinceSubmission > 30) return "high"
  if (status === "under_review" && daysSinceSubmission > 60) return "high"
  if (daysSinceSubmission > 30) return "medium"
  return "low"
}

export default function SubmissionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    pending: 0,
    underReview: 0,
    published: 0,
    rejected: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  // Get filter from URL
  const activeFilter = searchParams.get('filter') || 'all'

  const fetchSubmissions = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      
      const response = await fetch(`/api/users/${session.user.id}/submissions`)
      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Enhance submissions with UX data
        const enhancedSubmissions = data.submissions.map((sub: any) => ({
          ...sub,
          progress: getSubmissionProgress(sub.status),
          priority: getSubmissionPriority(sub.status, sub.submittedDate),
          actionRequired: sub.status === "revision_requested" || sub.status === "technical_check",
        }))
        
        setSubmissions(enhancedSubmissions)
        
        // Calculate stats
        const newStats = {
          total: enhancedSubmissions.length,
          pending: enhancedSubmissions.filter((s: any) => s.status === 'submitted' || s.status === 'technical_check').length,
          underReview: enhancedSubmissions.filter((s: any) => s.status === 'under_review').length,
          published: enhancedSubmissions.filter((s: any) => s.status === 'published').length,
          rejected: enhancedSubmissions.filter((s: any) => s.status === 'rejected').length,
        }
        setStats(newStats)
      } else {
        toast({
          variant: "destructive",
          title: "Failed to load submissions",
          description: data.error || "Please try again later"
        })
      }
    } catch (error) {
      handleError(error, { 
        component: 'submissions-page', 
        action: 'fetch_submissions',
        userId: session?.user?.id 
      })
      toast({
        variant: "destructive",
        title: "Error loading submissions",
        description: "Please refresh the page to try again"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSubmissions()
    setRefreshing(false)
    toast({
      title: "Submissions refreshed",
      description: "Your submission list has been updated"
    })
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubmissions()
    }
  }, [session?.user?.id])

  // Filter submissions based on search and filters
  const filteredSubmissions = submissions.filter(submission => {
    // Search filter
    if (searchQuery && !submission.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending" && !["submitted", "technical_check"].includes(submission.status)) {
        return false
      }
      if (statusFilter === "review" && submission.status !== "under_review") {
        return false
      }
      if (statusFilter === "action" && !submission.actionRequired) {
        return false
      }
      if (statusFilter !== "pending" && statusFilter !== "review" && statusFilter !== "action" && submission.status !== statusFilter) {
        return false
      }
    }
    
    // URL filter
    if (activeFilter !== "all") {
      if (activeFilter === "revisions" && submission.status !== "revision_requested") {
        return false
      }
      if (activeFilter === "published" && !["published", "accepted"].includes(submission.status)) {
        return false
      }
      if (activeFilter !== "revisions" && activeFilter !== "published" && submission.status !== activeFilter) {
        return false
      }
    }
    
    return true
  })

  // Sort submissions
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
      case "oldest":
        return new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime()
      case "title":
        return a.title.localeCompare(b.title)
      case "status":
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <RouteGuard allowedRoles={["author", "reviewer", "editor", "admin"]}>
        <AuthorLayout>
          <SectionLoading text="Loading your submissions..." />
        </AuthorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["author", "reviewer", "editor", "admin"]}>
      <AuthorLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
                <p className="text-gray-600 mt-2">
                  Track and manage your manuscript submissions to AMHSJ
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  onClick={() => router.push('/submit')}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Submission
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Under Review</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.underReview}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Published</p>
                    <p className="text-2xl font-bold text-green-900">{stats.published}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search submissions by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="revision_requested">Needs Revision</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="action">Needs Action</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          {sortedSubmissions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-400 mb-4">
                  <FileText className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchQuery || statusFilter !== "all" ? "No matching submissions" : "No submissions yet"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Start by submitting your first research article to AMHSJ"
                  }
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600"
                    onClick={() => router.push('/submit')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Article
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Action Required Section */}
              {sortedSubmissions.some(s => s.actionRequired) && (
                <Card className="border-l-4 border-l-red-500 bg-red-50/30 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-700">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Action Required ({sortedSubmissions.filter(s => s.actionRequired).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sortedSubmissions.filter(s => s.actionRequired).slice(0, 3).map((submission) => {
                      const statusConfig = getStatusConfig(submission.status)
                      return (
                        <div key={submission.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{submission.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <Badge className={statusConfig.color} variant="outline">
                                {statusConfig.icon}
                                <span className="ml-1">{statusConfig.label}</span>
                              </Badge>
                              <span>{statusConfig.description}</span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                              if (submission.status === 'revision_requested') {
                                router.push(`/submissions/${submission.id}/revise`)
                              } else {
                                router.push(`/submissions/${submission.id}`)
                              }
                            }}
                          >
                            Take Action
                          </Button>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Submissions Grid */}
              {sortedSubmissions.map((submission) => {
                const statusConfig = getStatusConfig(submission.status)
                return (
                  <Card key={submission.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                                onClick={() => router.push(`/submissions/${submission.id}`)}>
                              {submission.title}
                            </h3>
                            {submission.actionRequired && (
                              <Badge className="bg-red-100 text-red-800 animate-pulse">
                                Action Required
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <Badge variant="secondary" className="bg-gray-100">
                              {submission.category}
                            </Badge>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Submitted {new Date(submission.submittedDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {submission.reviewers} reviewers
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">Progress</span>
                              <span className="text-sm text-gray-600">{submission.progress}%</span>
                            </div>
                            <Progress value={submission.progress} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusConfig.color} variant="outline">
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </Badge>
                          {submission.priority && (
                            <Badge className={getPriorityColor(submission.priority)} variant="outline">
                              {submission.priority} priority
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Last updated: {new Date(submission.lastUpdate).toLocaleDateString()}
                        </div>
                        <SubmissionActionButtons submission={submission} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Quick Stats Summary */}
          {sortedSubmissions.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-500">
              Showing {sortedSubmissions.length} of {submissions.length} submissions
              {(searchQuery || statusFilter !== "all") && (
                <span> • <button 
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                  }}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Clear filters
                </button></span>
              )}
            </div>
          )}
        </div>
      </AuthorLayout>
    </RouteGuard>
  )
}