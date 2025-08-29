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

  useEffect(() => {
    if (session?.user?.role !== "admin") return
    fetchSubmissionsData()
  }, [session])

  const fetchSubmissionsData = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API calls
      setStats({
        totalSubmissions: 142,
        pendingReview: 18,
        underReview: 25,
        awaitingDecision: 8,
        accepted: 45,
        rejected: 23,
        published: 23,
        averageReviewTime: 21,
      })

      setSubmissions([
        {
          id: "1",
          title: "Advanced Cardiac Surgery Techniques in Pediatric Patients",
          authors: ["Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Lisa Wong"],
          submittedDate: "2024-01-15",
          status: 'under_review',
          category: "Cardiology",
          priority: 'high',
          reviewers: [
            { id: "1", name: "Dr. Robert Kim", status: "reviewing" },
            { id: "2", name: "Dr. Anna Smith", status: "completed" }
          ],
          editor: "Dr. James Wilson",
          wordCount: 4500,
          lastUpdate: "2024-01-20",
        },
        {
          id: "2",
          title: "AI Applications in Medical Diagnosis: A Comprehensive Study",
          authors: ["Prof. Emily Watson", "Dr. David Park"],
          submittedDate: "2024-01-10",
          status: 'revision_requested',
          category: "Technology",
          priority: 'medium',
          reviewers: [
            { id: "3", name: "Dr. Steven Miller", status: "completed" },
            { id: "4", name: "Dr. Rachel Green", status: "completed" }
          ],
          editor: "Dr. Maria Garcia",
          wordCount: 6200,
          lastUpdate: "2024-01-18",
        },
        {
          id: "3",
          title: "Neurological Disorders in Elderly Patients: Prevention and Treatment",
          authors: ["Dr. Jennifer Lee"],
          submittedDate: "2024-01-08",
          status: 'accepted',
          category: "Neurology",
          priority: 'high',
          reviewers: [
            { id: "5", name: "Dr. Alex Johnson", status: "completed" },
            { id: "6", name: "Dr. Sophie Brown", status: "completed" }
          ],
          editor: "Dr. Thomas Anderson",
          wordCount: 5800,
          lastUpdate: "2024-01-22",
          doi: "10.1234/amhsj.2024.003"
        },
        {
          id: "4",
          title: "Mental Health in Healthcare Workers: Post-Pandemic Analysis",
          authors: ["Dr. Mark Davis", "Dr. Susan Taylor", "Dr. Peter White"],
          submittedDate: "2024-01-12",
          status: 'submitted',
          category: "Psychiatry",
          priority: 'medium',
          reviewers: [],
          editor: "Not assigned",
          wordCount: 4200,
          lastUpdate: "2024-01-12",
        },
        {
          id: "5",
          title: "Innovative Surgical Techniques for Minimally Invasive Procedures",
          authors: ["Dr. Catherine Moore", "Dr. Daniel Kim"],
          submittedDate: "2024-01-14",
          status: 'published',
          category: "Surgery",
          priority: 'low',
          reviewers: [
            { id: "7", name: "Dr. Helen Clark", status: "completed" },
            { id: "8", name: "Dr. George Adams", status: "completed" }
          ],
          editor: "Dr. Nancy Wilson",
          wordCount: 5200,
          lastUpdate: "2024-01-25",
          doi: "10.1234/amhsj.2024.005"
        }
      ])
    } catch (error) {
      logger.error('Error fetching submissions data:', error)
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
    const matchesStatus = filterStatus === "all" || submission.status === filterStatus
    const matchesCategory = filterCategory === "all" || submission.category === filterCategory
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         submission.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
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
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
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
