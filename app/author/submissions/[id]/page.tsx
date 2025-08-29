"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  MessageSquare,
  Download,
  Eye,
  Edit,
  Send
} from "lucide-react"

interface Submission {
  id: string
  title: string
  status: string
  submittedAt: string
  lastUpdated: string
  manuscriptFile: string
  coverLetter: string
  authors: string[]
  category: string
  abstract: string
}

interface Review {
  id: string
  reviewerName: string
  status: string
  submittedAt: string
  comments: string
  decision: string
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const submissionId = params.id as string
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    // Fetch submission details
    if (session?.user?.id && submissionId) {
      fetchSubmissionDetails()
      fetchReviews()
    }
  }, [submissionId, session?.user?.id])

  const fetchSubmissionDetails = async () => {
    try {
      // Try to fetch from the user's submissions and find the matching one
      const response = await fetch(`/api/users/${session?.user?.id}/submissions`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const foundSubmission = data.submissions.find((sub: any) => sub.id === submissionId)
          if (foundSubmission) {
            const transformedSubmission: Submission = {
              id: foundSubmission.id,
              title: foundSubmission.title || 'Untitled',
              status: foundSubmission.status || 'submitted',
              submittedAt: foundSubmission.submittedDate || foundSubmission.createdAt || new Date().toISOString(),
              lastUpdated: foundSubmission.lastUpdate || foundSubmission.createdAt || new Date().toISOString(),
              manuscriptFile: 'manuscript.docx', // Placeholder
              coverLetter: 'cover_letter.pdf', // Placeholder
              authors: [session?.user?.name || 'Author'], // Single author for now
              category: foundSubmission.category || 'Original Research',
              abstract: foundSubmission.abstract || 'Abstract not available'
            }
            setSubmission(transformedSubmission)
          } else {
            console.error("Submission not found")
          }
        }
      }
    } catch (error) {
      console.error("Error fetching submission:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      // Fetch reviews for this submission from the database
      const response = await fetch(`/api/articles/${submissionId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setReviews(data.reviews || [])
        }
      } else {
        console.log("No reviews found or endpoint not available")
        setReviews([])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setReviews([])
    }
  }

  // Button handler functions
  const handleEditSubmission = () => {
    // Check if submission can be edited (only certain statuses allow editing)
    const editableStatuses = ['submitted', 'revision_requested']
    if (submission && editableStatuses.includes(submission.status)) {
      // Navigate to edit page - we can reuse the submit page with edit mode
      router.push(`/author/submit?edit=${submissionId}`)
    } else {
      alert(`Submissions with status "${submission?.status}" cannot be edited. Contact the editor if you need to make changes.`)
    }
  }

  const handleContactEditor = () => {
    // Navigate to messages page to start a conversation with the editor
    const subject = encodeURIComponent(`Regarding submission: ${submission?.title || 'Manuscript'}`)
    const submissionRef = encodeURIComponent(submissionId)
    router.push(`/author/messages?new=true&type=editorial&submissionId=${submissionRef}&subject=${subject}`)
  }

  const handleDownloadAllFiles = async () => {
    try {
      if (!submission || !session?.user?.id) return
      
      setDownloading(true)
      
      // Fetch the full article data including files
      const response = await fetch(`/api/articles/${submissionId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.article?.files && data.article.files.length > 0) {
          // Download each file
          let downloadCount = 0
          data.article.files.forEach((file: any, index: number) => {
            setTimeout(() => {
              const link = document.createElement('a')
              link.href = file.url
              link.download = file.name || `submission-file-${index + 1}`
              link.target = '_blank'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              downloadCount++
              
              // Update user when all downloads are initiated
              if (downloadCount === data.article.files.length) {
                alert(`Initiated download of ${data.article.files.length} files`)
                setDownloading(false)
              }
            }, index * 500) // Stagger downloads by 500ms
          })
        } else {
          alert("No files found for this submission")
          setDownloading(false)
        }
      } else {
        throw new Error("Failed to fetch submission files")
      }
    } catch (error) {
      console.error("Error downloading files:", error)
      alert("Failed to download files. Please try again.")
      setDownloading(false)
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

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "accept":
        return <Badge variant="default" className="bg-green-600">Accept</Badge>
      case "minor_revision":
        return <Badge variant="default" className="bg-yellow-600">Minor Revision</Badge>
      case "major_revision":
        return <Badge variant="destructive">Major Revision</Badge>
      case "reject":
        return <Badge variant="destructive">Reject</Badge>
      default:
        return <Badge variant="secondary">{decision}</Badge>
    }
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

  if (!submission) {
    return (
      <RouteGuard allowedRoles={["author"]}>
        <AuthorLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Submission Not Found</h1>
              <p className="text-gray-600">The requested submission could not be found.</p>
            </div>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["author"]}>
      <AuthorLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {submission.title}
            </h1>
            <p className="text-gray-600">
              Submission ID: {submission.id} | Category: {submission.category}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(submission.status)}
          </div>
        </div>
      </div>

      {/* Submission Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submission Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Authors</h3>
              <ul className="space-y-1">
                {submission.authors.map((author, index) => (
                  <li key={index} className="text-gray-600">{author}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{new Date(submission.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Abstract</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{submission.abstract}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Current Status</span>
                  {getStatusBadge(submission.status)}
                </div>
                <div className="text-sm text-gray-600">
                  <p>Your manuscript is currently being reviewed by our editorial team and peer reviewers.</p>
                  <p className="mt-2">You will be notified of any updates or decisions via email.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Peer Reviews</h3>
            <Badge variant="outline">{reviews.length} reviews completed</Badge>
          </div>
          
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{review.reviewerName}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getDecisionBadge(review.decision)}
                        <Badge variant="outline">
                          {new Date(review.submittedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{review.comments}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Review
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Respond
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Reviews in Progress</h3>
                <p className="text-gray-600">
                  Your manuscript is currently being reviewed. You will see review results here once they are completed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{submission.manuscriptFile}</p>
                      <p className="text-sm text-gray-600">Main manuscript file</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{submission.coverLetter}</p>
                      <p className="text-sm text-gray-600">Cover letter</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editorial Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                <p className="text-gray-600 mb-6">
                  Any messages from the editorial team will appear here.
                </p>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Contact Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        {submission?.status && ['submitted', 'revision_requested'].includes(submission.status) && (
          <Button variant="outline" onClick={handleEditSubmission}>
            <Edit className="h-4 w-4 mr-2" />
            {submission.status === 'revision_requested' ? 'Submit Revision' : 'Edit Submission'}
          </Button>
        )}
        <Button variant="outline" onClick={handleContactEditor}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact Editor
        </Button>
        <Button variant="outline" onClick={handleDownloadAllFiles} disabled={downloading}>
          <Download className="h-4 w-4 mr-2" />
          {downloading ? "Downloading..." : "Download All Files"}
        </Button>
      </div>
        </div>
      </AuthorLayout>
    </RouteGuard>
  )
}
