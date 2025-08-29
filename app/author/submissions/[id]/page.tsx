"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
  const submissionId = params.id as string
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch submission details
    fetchSubmissionDetails()
    fetchReviews()
  }, [submissionId])

  const fetchSubmissionDetails = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSubmission: Submission = {
        id: submissionId,
        title: "Impact of Telemedicine on Rural Healthcare Access",
        status: "under_review",
        submittedAt: "2024-01-15",
        lastUpdated: "2024-01-20",
        manuscriptFile: "manuscript_v1.docx",
        coverLetter: "cover_letter.pdf",
        authors: ["Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Emily Rodriguez"],
        category: "Original Research",
        abstract: "This study examines the effectiveness of telemedicine interventions in improving healthcare access for rural populations..."
      }
      setSubmission(mockSubmission)
    } catch (error) {
      console.error("Error fetching submission:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockReviews: Review[] = [
        {
          id: "1",
          reviewerName: "Dr. Robert Smith",
          status: "completed",
          submittedAt: "2024-01-18",
          comments: "Excellent study design and methodology. Minor revisions needed in discussion section.",
          decision: "minor_revision"
        },
        {
          id: "2",
          reviewerName: "Dr. Lisa Wang",
          status: "completed",
          submittedAt: "2024-01-19",
          comments: "Well-written manuscript with clear objectives. Some statistical analysis could be improved.",
          decision: "minor_revision"
        }
      ]
      setReviews(mockReviews)
    } catch (error) {
      console.error("Error fetching reviews:", error)
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Submission Not Found</h1>
          <p className="text-gray-600">The requested submission could not be found.</p>
        </div>
      </div>
    )
  }

  return (
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
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Submission
        </Button>
        <Button variant="outline">
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact Editor
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download All Files
        </Button>
      </div>
    </div>
  )
}
