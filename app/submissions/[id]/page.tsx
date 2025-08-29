"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { handleError } from "@/lib/modern-error-handler"
import { toast } from "@/hooks/use-toast"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  MessageSquare,
  Download,
  Edit,
  Calendar,
  Star,
  AlertCircle,
  ArrowLeft,
  Send,
  Paperclip,
} from "lucide-react"

interface Submission {
  id: string;
  title: string;
  abstract: string;
  category: string;
  keywords: string[];
  status: string;
  submittedDate: string;
  lastUpdate: string;
  authorId: string;
  editorId?: string;
  reviewerIds?: string[];
  files?: { url: string; type: string; name: string; fileId: string }[];
  views: number;
  downloads: number;
  coAuthors?: string[];
}

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  status: string;
  submittedDate?: string;
  score?: number;
  comments?: string;
  recommendation?: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  type: 'editorial' | 'reviewer' | 'author';
  isResolved: boolean;
}

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
    rejected: {
      label: "Rejected",
      color: "bg-red-100 text-red-800 border-red-300",
      icon: <XCircle className="h-3 w-3" />,
      description: "Unfortunately, your submission was not accepted"
    }
  }
  return configs[status as keyof typeof configs] || configs.submitted
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (params.id && session?.user?.id) {
      fetchSubmissionDetails()
    }
  }, [params.id, session])

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch submission details
      const submissionRes = await fetch(`/api/users/${session?.user?.id}/submissions`)
      if (submissionRes.ok) {
        const submissionData = await submissionRes.json()
        if (submissionData.success) {
          const foundSubmission = submissionData.submissions.find((s: unknown) => s.id === params.id)
          if (foundSubmission) {
            setSubmission(foundSubmission)
          } else {
            toast({
              title: "Submission not found",
              description: "The requested submission could not be found.",
              variant: "destructive",
            })
            router.push('/dashboard')
            return
          }
        }
      }

      // Fetch reviews if available
      const reviewsRes = await fetch(`/api/manuscripts/${params.id}/reviews`)
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json()
        if (reviewsData.success) {
          setReviews(reviewsData.reviews || [])
        }
      }

      // Fetch comments
      const commentsRes = await fetch(`/api/manuscripts/${params.id}/comments`)
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json()
        if (commentsData.success) {
          setComments(commentsData.comments || [])
        }
      }

    } catch (error) {
      handleError(error, { 
        component: 'submission-detail', 
        action: 'fetch_submission_details'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`/api/manuscripts/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          type: 'author'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setComments(prev => [...prev, data.comment])
          setNewComment("")
          toast({
            title: "Comment added",
            description: "Your comment has been submitted successfully.",
          })
        }
      }
    } catch (error) {
      handleError(error, { 
        component: 'submission-detail', 
        action: 'add_comment'
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const getSubmissionProgress = (status: string): number => {
    switch (status) {
      case "submitted": return 25;
      case "technical_check": return 40;
      case "under_review": return 60;
      case "revision_requested": return 75;
      case "accepted": return 100;
      case "published": return 100;
      default: return 0;
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["author", "reviewer", "editor", "admin"]}>
        <AuthorLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading submission details...</p>
            </div>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  if (!submission) {
    return (
      <RouteGuard allowedRoles={["author", "reviewer", "editor", "admin"]}>
        <AuthorLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Submission not found</h3>
            <p className="text-slate-600 mb-4">The requested submission could not be found.</p>
            <Button onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  const statusConfig = getStatusConfig(submission.status)

  return (
    <RouteGuard allowedRoles={["author", "reviewer", "editor", "admin"]}>
      <AuthorLayout>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Submission Details</h1>
            <p className="text-slate-600">Manuscript ID: {submission.id}</p>
          </div>
          <Badge className={statusConfig.color} variant="outline">
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </Badge>
        </div>

        {/* Action Required Alert */}
        {submission.status === 'revision_requested' && (
          <Alert className="border-orange-200 bg-orange-50 mb-6">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Action Required:</strong> Please review the feedback and submit a revised version of your manuscript.
              <Button 
                size="sm" 
                className="ml-4 bg-orange-600 hover:bg-orange-700"
                onClick={() => router.push(`/submissions/${submission.id}/revise`)}
              >
                Submit Revision
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submission Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Current Status</span>
                <span className="text-sm text-slate-600">{getSubmissionProgress(submission.status)}% Complete</span>
              </div>
              <Progress value={getSubmissionProgress(submission.status)} className="h-3" />
              <p className="text-sm text-slate-600">{statusConfig.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manuscript Details */}
            <Card>
              <CardHeader>
                <CardTitle>{submission.title}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Category: {submission.category}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Submitted {new Date(submission.submittedDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Abstract</h4>
                  <p className="text-slate-700 leading-relaxed">{submission.abstract}</p>
                </div>
                
                {submission.keywords && submission.keywords.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {submission.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {submission.coAuthors && submission.coAuthors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Co-Authors</h4>
                    <div className="space-y-1">
                      {submission.coAuthors.map((author, index) => (
                        <p key={index} className="text-slate-700">{author}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Files */}
            {submission.files && submission.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Attached Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {submission.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="font-medium text-slate-900">{file.name}</p>
                            <p className="text-sm text-slate-600">{file.type}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <Tabs defaultValue="reviews" className="space-y-4">
              <TabsList>
                <TabsTrigger value="reviews">Peer Reviews</TabsTrigger>
                <TabsTrigger value="comments">Comments & Discussion</TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Peer Review Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviews.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                        <p className="text-slate-600">No reviews available yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review, index) => (
                          <div key={review.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">Reviewer {index + 1}</h4>
                              <Badge 
                                className={
                                  review.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {review.status}
                              </Badge>
                            </div>
                            {review.score && (
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="font-medium">Score: {review.score}/10</span>
                              </div>
                            )}
                            {review.recommendation && (
                              <p className="text-sm text-slate-600 mb-2">
                                <strong>Recommendation:</strong> {review.recommendation}
                              </p>
                            )}
                            {review.comments && (
                              <div className="bg-slate-50 p-3 rounded">
                                <p className="text-sm text-slate-700">{review.comments}</p>
                              </div>
                            )}
                            {review.submittedDate && (
                              <p className="text-xs text-slate-500 mt-2">
                                Submitted on {new Date(review.submittedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comments & Discussion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Comments List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {comments.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                          <p className="text-slate-600">No comments yet</p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="border-l-4 border-indigo-200 pl-4 py-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">{comment.authorName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {comment.type}
                                </Badge>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-700">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment */}
                    <div className="border-t pt-4">
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add a comment or question..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <Button 
                            onClick={handleAddComment}
                            disabled={submittingComment || !newComment.trim()}
                          >
                            {submittingComment ? (
                              "Submitting..."
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Add Comment
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700">Views</span>
                  </div>
                  <span className="font-medium">{submission.views || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700">Downloads</span>
                  </div>
                  <span className="font-medium">{submission.downloads || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push(`/submissions/${submission.id}/messages`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                
                {submission.status === 'revision_requested' && (
                  <Button 
                    className="w-full justify-start bg-orange-600 hover:bg-orange-700"
                    onClick={() => router.push(`/submissions/${submission.id}/revise`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Submit Revision
                  </Button>
                )}
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Summary
                </Button>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Submitted</p>
                      <p className="text-xs text-slate-500">
                        {new Date(submission.submittedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {submission.status !== 'submitted' && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Under Review</p>
                        <p className="text-xs text-slate-500">
                          {new Date(submission.lastUpdate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {(submission.status === 'accepted' || submission.status === 'published') && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Accepted</p>
                        <p className="text-xs text-slate-500">
                          {new Date(submission.lastUpdate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthorLayout>
    </RouteGuard>
  )
}
