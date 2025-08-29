"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Download,
  Eye,
  Edit,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  File,
  Mail,
  History,
  UserPlus,
  Send,
  Archive,
  Flag,
  MoreHorizontal,
  ArrowLeft,
  ExternalLink,
  Upload,
  Trash2,
  Settings,
  Star,
  FileImage,
  FileSpreadsheet
} from "lucide-react"

interface SubmissionDetail {
  id: string
  title: string
  abstract: string
  category: string
  status: string
  authorId: string
  authorName: string
  authorEmail: string
  authorAffiliation: string
  submittedDate: string
  updatedAt: string
  reviewers: Array<{
    id: string
    name: string
    email: string
    status: string
    assignedDate: string
    completedDate?: string
    recommendation?: string
  }>
  files: Array<{
    id: string
    name: string
    type: string
    size: number
    category: string
    uploadedAt: string
    url: string
  }>
  timeline: Array<{
    id: string
    action: string
    description: string
    performedBy: string
    performedByRole: string
    timestamp: string
    metadata?: unknown
  }>
  reviews: Array<{
    id: string
    reviewerId: string
    reviewerName: string
    status: string
    recommendation: string
    comments: string
    confidentialComments: string
    submittedAt: string
    rating: number
  }>
  versions: Array<{
    id: string
    versionNumber: number
    title: string
    abstract: string
    files: unknown[]
    changeLog: string
    createdAt: string
  }>
  communications: Array<{
    id: string
    type: string
    subject: string
    content: string
    sentBy: string
    sentTo: string[]
    sentAt: string
    status: string
  }>
}

interface AdminSubmissionManagementProps {
  submissionId: string
  onClose: () => void
}

export default function AdminSubmissionManagement({ submissionId, onClose }: AdminSubmissionManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [reviewerSearchQuery, setReviewerSearchQuery] = useState("")
  const [availableReviewers, setAvailableReviewers] = useState<any[]>([])
  const [newStatus, setNewStatus] = useState("")
  const [statusNotes, setStatusNotes] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [isAssigningReviewer, setIsAssigningReviewer] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  useEffect(() => {
    fetchSubmissionDetails()
    fetchAvailableReviewers()
  }, [submissionId])

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/submissions/${submissionId}`)
      if (response.ok) {
        const data = await response.json()
        setSubmission(data.submission)
        setNewStatus(data.submission.status)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load submission details"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load submission details"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableReviewers = async () => {
    try {
      const response = await fetch(`/api/admin/reviewers/available?category=${submission?.category}&query=${reviewerSearchQuery}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableReviewers(data.reviewers)
      }
    } catch (error) {
      logger.error("Failed to fetch reviewers:", error)
    }
  }

  const handleStatusUpdate = async () => {
    if (!submission || !newStatus) return

    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes,
          notifyAuthor: true
        })
      })

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: "Submission status has been updated successfully"
        })
        fetchSubmissionDetails()
        setStatusNotes("")
      } else {
        throw new AppError("Failed to update status")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update submission status"
      })
    }
  }

  const handleAssignReviewer = async (reviewerId: string) => {
    try {
      setIsAssigningReviewer(true)
      const response = await fetch(`/api/admin/submissions/${submissionId}/reviewers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId })
      })

      if (response.ok) {
        toast({
          title: "Reviewer Assigned",
          description: "Reviewer has been assigned successfully"
        })
        fetchSubmissionDetails()
      } else {
        throw new AppError("Failed to assign reviewer")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign reviewer"
      })
    } finally {
      setIsAssigningReviewer(false)
    }
  }

  const handleSendEmail = async () => {
    if (!emailSubject || !emailContent) return

    try {
      setIsSendingEmail(true)
      const response = await fetch(`/api/admin/submissions/${submissionId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailSubject,
          content: emailContent,
          recipients: [submission?.authorEmail]
        })
      })

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "Email has been sent successfully"
        })
        setEmailSubject("")
        setEmailContent("")
        fetchSubmissionDetails()
      } else {
        throw new AppError("Failed to send email")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send email"
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-100 text-blue-800"
      case "technical_check": return "bg-purple-100 text-purple-800"
      case "under_review": return "bg-yellow-100 text-yellow-800"
      case "revision_requested": return "bg-orange-100 text-orange-800"
      case "accepted": return "bg-green-100 text-green-800"
      case "published": return "bg-emerald-100 text-emerald-800"
      case "rejected": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return FileImage
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet
    return FileText
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission details...</p>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Not Found</h3>
        <p className="text-gray-600 mb-4">The requested submission could not be loaded.</p>
        <Button onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{submission.title}</h1>
            <p className="text-gray-600">Submission ID: {submission.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(submission.status)}>
            {submission.status.replace("_", " ").toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Days in Review</p>
                <p className="text-lg font-bold text-blue-600">
                  {Math.ceil((new Date().getTime() - new Date(submission.submittedDate).getTime()) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Reviewers</p>
                <p className="text-lg font-bold text-green-600">{submission.reviewers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <File className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Files</p>
                <p className="text-lg font-bold text-purple-600">{submission.files.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Communications</p>
                <p className="text-lg font-bold text-orange-600">{submission.communications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">Files & Versions</TabsTrigger>
          <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Submission Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Abstract</Label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">{submission.abstract}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Category</Label>
                      <Badge variant="secondary" className="mt-1">{submission.category}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Submitted</Label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(submission.submittedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {submission.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {submission.reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{review.reviewerName}</p>
                              <p className="text-sm text-gray-600">Submitted {new Date(review.submittedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={review.recommendation === 'accept' ? 'bg-green-100 text-green-800' : 
                                review.recommendation === 'reject' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {review.recommendation}
                              </Badge>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{review.comments}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No reviews submitted yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Author Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Author Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{submission.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{submission.authorName}</p>
                      <p className="text-sm text-gray-600">{submission.authorEmail}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Affiliation</Label>
                    <p className="mt-1 text-sm text-gray-900">{submission.authorAffiliation}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Update Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="technical_check">Technical Check</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="revision_requested">Revision Requested</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Add notes about this status change..."
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleStatusUpdate} className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Files</CardTitle>
              <CardDescription>
                All files associated with this submission organized by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['manuscript', 'figures', 'tables', 'supplementary', 'ethics', 'copyright'].map((category) => {
                  const categoryFiles = submission.files.filter(file => file.category === category)
                  if (categoryFiles.length === 0) return null

                  return (
                    <div key={category}>
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">{category} Files</h4>
                      <div className="grid gap-3">
                        {categoryFiles.map((file) => {
                          const FileIcon = getFileIcon(file.type)
                          return (
                            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileIcon className="h-5 w-5 text-gray-500" />
                                <div>
                                  <p className="font-medium text-sm">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Version History */}
          {submission.versions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submission.versions.map((version) => (
                    <div key={version.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Version {version.versionNumber}</p>
                          <p className="text-sm text-gray-600">{new Date(version.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                      {version.changeLog && (
                        <p className="text-sm text-gray-700 mt-2">{version.changeLog}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reviewers Tab */}
        <TabsContent value="reviewers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Reviewers */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Reviewers</CardTitle>
              </CardHeader>
              <CardContent>
                {submission.reviewers.length > 0 ? (
                  <div className="space-y-4">
                    {submission.reviewers.map((reviewer) => (
                      <div key={reviewer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{reviewer.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{reviewer.name}</p>
                            <p className="text-sm text-gray-600">{reviewer.email}</p>
                            <p className="text-xs text-gray-500">
                              Assigned {new Date(reviewer.assignedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={reviewer.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {reviewer.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No reviewers assigned yet</p>
                )}
              </CardContent>
            </Card>

            {/* Available Reviewers */}
            <Card>
              <CardHeader>
                <CardTitle>Assign New Reviewer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Search reviewers by name or expertise..."
                    value={reviewerSearchQuery}
                    onChange={(e) => setReviewerSearchQuery(e.target.value)}
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {availableReviewers.map((reviewer) => (
                      <div key={reviewer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{reviewer.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{reviewer.name}</p>
                            <p className="text-xs text-gray-600">{reviewer.affiliation}</p>
                            <p className="text-xs text-gray-500">
                              {reviewer.completedReviews} reviews • {reviewer.averageTime} days avg
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAssignReviewer(reviewer.id)}
                          disabled={isAssigningReviewer}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Timeline</CardTitle>
              <CardDescription>
                Complete history of all actions and events for this submission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submission.timeline.map((event, index) => (
                  <div key={event.id} className="flex space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      {index < submission.timeline.length - 1 && (
                        <div className="mt-2 h-8 w-px bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{event.action}</p>
                        <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        by {event.performedBy} ({event.performedByRole})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email History */}
            <Card>
              <CardHeader>
                <CardTitle>Email History</CardTitle>
              </CardHeader>
              <CardContent>
                {submission.communications.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {submission.communications.map((email) => (
                      <div key={email.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{email.subject}</p>
                            <p className="text-xs text-gray-500">
                              From: {email.sentBy} • To: {email.sentTo.join(', ')}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(email.sentAt).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm text-gray-700">{email.content.substring(0, 150)}...</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No communications yet</p>
                )}
              </CardContent>
            </Card>

            {/* Send New Email */}
            <Card>
              <CardHeader>
                <CardTitle>Send Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject..."
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Type your message..."
                    rows={6}
                  />
                </div>
                <Button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !emailSubject || !emailContent}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSendingEmail ? "Sending..." : "Send Email"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Publishing Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept for Publication
                </Button>
                <Button className="w-full" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Request Revisions
                </Button>
                <Button className="w-full" variant="outline">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Submission
                </Button>
                <Button className="w-full" variant="outline">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Submission
                </Button>
              </CardContent>
            </Card>

            {/* Administrative Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Administrative Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Page
                </Button>
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
                </Button>
                <Button className="w-full" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Submission
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
