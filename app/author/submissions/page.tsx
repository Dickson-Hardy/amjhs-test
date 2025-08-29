"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Download
} from "lucide-react"

interface Submission {
  id: string
  title: string
  status: string
  submittedAt: string
  lastUpdated: string
  category: string
  authors: string[]
  manuscriptFile: string
}

export default function SubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSubmissions: Submission[] = [
        {
          id: "1",
          title: "Impact of Telemedicine on Rural Healthcare Access",
          status: "under_review",
          submittedAt: "2024-01-15",
          lastUpdated: "2024-01-20",
          category: "Original Research",
          authors: ["Dr. Sarah Johnson", "Dr. Michael Chen"],
          manuscriptFile: "manuscript_v1.docx"
        },
        {
          id: "2",
          title: "Machine Learning in Medical Diagnosis: A Systematic Review",
          status: "revision_requested",
          submittedAt: "2024-01-10",
          lastUpdated: "2024-01-18",
          category: "Review Article",
          authors: ["Dr. Emily Rodriguez", "Dr. David Kim"],
          manuscriptFile: "ml_review_v2.docx"
        },
        {
          id: "3",
          title: "Novel Approach to Diabetes Management in Elderly Patients",
          status: "accepted",
          submittedAt: "2023-12-20",
          lastUpdated: "2024-01-05",
          category: "Original Research",
          authors: ["Dr. Robert Smith", "Dr. Lisa Wang"],
          manuscriptFile: "diabetes_management.docx"
        }
      ]
      setSubmissions(mockSubmissions)
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary">Submitted</Badge>
      case "under_review":
        return <Badge variant="default">Under Review</Badge>
      case "revision_requested":
        return <Badge variant="destructive">Revision Required</Badge>
      case "accepted":
        return <Badge variant="default" className="bg-green-600">Accepted</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "under_review":
        return <Eye className="h-4 w-4 text-yellow-600" />
      case "revision_requested":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter
    const matchesCategory = categoryFilter === "all" || submission.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleViewSubmission = (submissionId: string) => {
    router.push(`/author/submissions/${submissionId}`)
  }

  const handleEditSubmission = (submissionId: string) => {
    router.push(`/author/submissions/${submissionId}/edit`)
  }

  const handleNewSubmission = () => {
    router.push("/author/submit")
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["author"]}>
        <AuthorLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["author"]}>
      <AuthorLayout>
        <div className="space-y-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Submissions
                </h1>
                <p className="text-gray-600">
                  Track and manage your manuscript submissions
                </p>
              </div>
              <Button onClick={handleNewSubmission} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Submission
              </Button>
            </div>
          </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.status === "under_review").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently being reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revision Required</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter(s => s.status === "revision_requested").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need your attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === "accepted").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully published
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title or author..."
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
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="revision_requested">Revision Required</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Original Research">Original Research</SelectItem>
                <SelectItem value="Review Article">Review Article</SelectItem>
                <SelectItem value="Case Report">Case Report</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submissions ({filteredSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "You haven't submitted any manuscripts yet."}
              </p>
              {!searchTerm && statusFilter === "all" && categoryFilter === "all" && (
                <Button onClick={handleNewSubmission}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Manuscript
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(submission.status)}
                        <h3 className="font-semibold text-lg">{submission.title}</h3>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-gray-600 mb-2">
                        <strong>Authors:</strong> {submission.authors.join(", ")}
                      </p>
                      <p className="text-gray-600 mb-2">
                        <strong>Category:</strong> {submission.category}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(submission.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewSubmission(submission.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {submission.status === "revision_requested" && (
                        <Button
                          onClick={() => handleEditSubmission(submission.id)}
                          className="bg-yellow-600 hover:bg-yellow-700"
                          size="sm"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Revise
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </AuthorLayout>
    </RouteGuard>
  )
}
