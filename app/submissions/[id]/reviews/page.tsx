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
import { handleError } from "@/lib/modern-error-handler"
import { toast } from "@/hooks/use-toast"
import {
  Users,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  Eye,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Award,
  ThumbsUp,
  ThumbsDown,
  User,
  Edit,
} from "lucide-react"

interface Submission {
  id: string;
  title: string;
  category: string;
  status: string;
  submittedDate: string;
  lastUpdate: string;
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
  confidentialComments?: string;
  strengths?: string;
  weaknesses?: string;
  detailedFeedback?: string;
  technicalQuality?: number;
  novelty?: number;
  clarity?: number;
  significance?: number;
}

interface ReviewStats {
  totalReviews: number;
  completedReviews: number;
  averageScore: number;
  recommendationCounts: {
    accept: number;
    minorRevision: number;
    majorRevision: number;
    reject: number;
  };
}

export default function SubmissionReviewsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id && session?.user?.id) {
      fetchSubmissionAndReviews()
    }
  }, [params.id, session])

  const fetchSubmissionAndReviews = async () => {
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

      // Fetch reviews
      const reviewsRes = await fetch(`/api/manuscripts/${params.id}/reviews`)
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json()
        if (reviewsData.success) {
          const reviewList = reviewsData.reviews || []
          setReviews(reviewList)
          
          // Calculate stats
          calculateReviewStats(reviewList)
        }
      }

    } catch (error) {
      handleError(error, { 
        component: 'submission-reviews', 
        action: 'fetch_submission_and_reviews'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateReviewStats = (reviewList: Review[]) => {
    const completedReviews = reviewList.filter(r => r.status === 'completed')
    const totalScore = completedReviews.reduce((sum, r) => sum + (r.score || 0), 0)
    const averageScore = completedReviews.length > 0 ? totalScore / completedReviews.length : 0

    const recommendationCounts = {
      accept: 0,
      minorRevision: 0,
      majorRevision: 0,
      reject: 0,
    }

    completedReviews.forEach(review => {
      if (review.recommendation) {
        const rec = review.recommendation.toLowerCase()
        if (rec.includes('accept') && !rec.includes('revision')) {
          recommendationCounts.accept++
        } else if (rec.includes('minor')) {
          recommendationCounts.minorRevision++
        } else if (rec.includes('major')) {
          recommendationCounts.majorRevision++
        } else if (rec.includes('reject')) {
          recommendationCounts.reject++
        }
      }
    })

    setReviewStats({
      totalReviews: reviewList.length,
      completedReviews: completedReviews.length,
      averageScore,
      recommendationCounts,
    })
  }

  const getRecommendationColor = (recommendation: string) => {
    const rec = recommendation.toLowerCase()
    if (rec.includes('accept') && !rec.includes('revision')) {
      return 'bg-green-100 text-green-800 border-green-300'
    } else if (rec.includes('minor')) {
      return 'bg-blue-100 text-blue-800 border-blue-300'
    } else if (rec.includes('major')) {
      return 'bg-orange-100 text-orange-800 border-orange-300'
    } else if (rec.includes('reject')) {
      return 'bg-red-100 text-red-800 border-red-300'
    }
    return 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  const renderStarRating = (rating: number, maxRating: number = 10) => {
    const percentage = (rating / maxRating) * 100
    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < (rating / 2) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-slate-600">{rating}/10</span>
      </div>
    )
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["author", "reviewer", "editor", "admin"]}>
        <AuthorLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading review details...</p>
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
            <h1 className="text-2xl font-bold text-slate-900">Peer Review Details</h1>
            <p className="text-slate-600">{submission.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">
              Submitted {new Date(submission.submittedDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Review Stats Overview */}
        {reviewStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-slate-900">{reviewStats.totalReviews}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Completed</p>
                    <p className="text-2xl font-bold text-slate-900">{reviewStats.completedReviews}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={(reviewStats.completedReviews / reviewStats.totalReviews) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Average Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(reviewStats.averageScore)}`}>
                      {reviewStats.averageScore.toFixed(1)}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-2">
                  {renderStarRating(reviewStats.averageScore)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Progress</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.round((reviewStats.completedReviews / reviewStats.totalReviews) * 100)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendation Summary */}
        {reviewStats && reviewStats.completedReviews > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" />
                Reviewer Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Accept</span>
                  <span className="text-lg font-bold text-green-600">
                    {reviewStats.recommendationCounts.accept}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-800">Minor Revision</span>
                  <span className="text-lg font-bold text-blue-600">
                    {reviewStats.recommendationCounts.minorRevision}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-800">Major Revision</span>
                  <span className="text-lg font-bold text-orange-600">
                    {reviewStats.recommendationCounts.majorRevision}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-800">Reject</span>
                  <span className="text-lg font-bold text-red-600">
                    {reviewStats.recommendationCounts.reject}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <Tabs defaultValue="detailed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="detailed">Detailed Reviews</TabsTrigger>
            <TabsTrigger value="summary">Summary View</TabsTrigger>
          </TabsList>

          <TabsContent value="detailed" className="space-y-6">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No reviews available</h3>
                  <p className="text-slate-600">
                    Reviews will appear here once reviewers have submitted their evaluations.
                  </p>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review, index) => (
                <Card key={review.id} className="overflow-hidden">
                  <CardHeader className="bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-slate-200 rounded-full">
                          <User className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Reviewer {index + 1}</h3>
                          <p className="text-sm text-slate-600">
                            {review.status === 'completed' ? 'Review Completed' : 'Review Pending'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={
                            review.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {review.status === 'completed' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {review.status}
                        </Badge>
                        {review.submittedDate && (
                          <span className="text-sm text-slate-500">
                            {new Date(review.submittedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {review.status === 'completed' && (
                    <CardContent className="p-6 space-y-6">
                      {/* Overall Score and Recommendation */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-slate-900 mb-3">Overall Score</h4>
                          <div className="flex items-center gap-4">
                            <span className={`text-3xl font-bold ${getScoreColor(review.score || 0)}`}>
                              {review.score || 'N/A'}
                            </span>
                            <div>
                              {review.score && renderStarRating(review.score)}
                            </div>
                          </div>
                        </div>

                        {review.recommendation && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-3">Recommendation</h4>
                            <Badge 
                              className={`${getRecommendationColor(review.recommendation)} text-base px-3 py-1`}
                              variant="outline"
                            >
                              {review.recommendation}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Detailed Scores */}
                      {(review.technicalQuality || review.novelty || review.clarity || review.significance) && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-3">Detailed Evaluation</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {review.technicalQuality && (
                              <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700">Technical Quality</p>
                                <p className={`text-xl font-bold ${getScoreColor(review.technicalQuality)}`}>
                                  {review.technicalQuality}/10
                                </p>
                              </div>
                            )}
                            {review.novelty && (
                              <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700">Novelty</p>
                                <p className={`text-xl font-bold ${getScoreColor(review.novelty)}`}>
                                  {review.novelty}/10
                                </p>
                              </div>
                            )}
                            {review.clarity && (
                              <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700">Clarity</p>
                                <p className={`text-xl font-bold ${getScoreColor(review.clarity)}`}>
                                  {review.clarity}/10
                                </p>
                              </div>
                            )}
                            {review.significance && (
                              <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700">Significance</p>
                                <p className={`text-xl font-bold ${getScoreColor(review.significance)}`}>
                                  {review.significance}/10
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Strengths and Weaknesses */}
                      {(review.strengths || review.weaknesses) && (
                        <div className="grid md:grid-cols-2 gap-6">
                          {review.strengths && (
                            <div>
                              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                                Strengths
                              </h4>
                              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-slate-700 whitespace-pre-wrap">{review.strengths}</p>
                              </div>
                            </div>
                          )}

                          {review.weaknesses && (
                            <div>
                              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                <ThumbsDown className="h-4 w-4 text-red-600" />
                                Weaknesses
                              </h4>
                              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <p className="text-slate-700 whitespace-pre-wrap">{review.weaknesses}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comments */}
                      {review.comments && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            Detailed Comments
                          </h4>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-slate-700 whitespace-pre-wrap">{review.comments}</p>
                          </div>
                        </div>
                      )}

                      {/* Detailed Feedback */}
                      {review.detailedFeedback && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-3">Additional Feedback</h4>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-slate-700 whitespace-pre-wrap">{review.detailedFeedback}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}

                  {review.status !== 'completed' && (
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                        <p className="text-slate-600">Review in progress...</p>
                        <p className="text-sm text-slate-500 mt-2">
                          The reviewer is currently evaluating your submission.
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Summary</CardTitle>
                <CardDescription>
                  Overview of all reviewer feedback and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.filter(r => r.status === 'completed').length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600">No completed reviews yet</p>
                  </div>
                ) : (
                  <>
                    {/* Summary Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-200">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-slate-200 p-3 text-left font-medium">Reviewer</th>
                            <th className="border border-slate-200 p-3 text-center font-medium">Score</th>
                            <th className="border border-slate-200 p-3 text-center font-medium">Recommendation</th>
                            <th className="border border-slate-200 p-3 text-center font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviews.filter(r => r.status === 'completed').map((review, index) => (
                            <tr key={review.id} className="hover:bg-slate-50">
                              <td className="border border-slate-200 p-3">Reviewer {index + 1}</td>
                              <td className="border border-slate-200 p-3 text-center">
                                <span className={`font-bold ${getScoreColor(review.score || 0)}`}>
                                  {review.score || 'N/A'}
                                </span>
                              </td>
                              <td className="border border-slate-200 p-3 text-center">
                                {review.recommendation && (
                                  <Badge className={getRecommendationColor(review.recommendation)} variant="outline">
                                    {review.recommendation}
                                  </Badge>
                                )}
                              </td>
                              <td className="border border-slate-200 p-3 text-center text-sm text-slate-600">
                                {review.submittedDate ? new Date(review.submittedDate).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Common Themes */}
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Common Themes</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h5 className="font-medium text-green-800 mb-2">Positive Feedback</h5>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Strong methodological approach</li>
                            <li>• Clear presentation of results</li>
                            <li>• Relevant to current research</li>
                          </ul>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h5 className="font-medium text-orange-800 mb-2">Areas for Improvement</h5>
                          <ul className="text-sm text-orange-700 space-y-1">
                            <li>• Expand discussion section</li>
                            <li>• Address statistical analysis</li>
                            <li>• Include additional references</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => router.push(`/submissions/${submission.id}`)}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Submission Details
              </Button>
              
              <Button 
                onClick={() => router.push(`/submissions/${submission.id}/messages`)}
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Editor
              </Button>

              {submission.status === 'revision_requested' && (
                <Button 
                  onClick={() => router.push(`/submissions/${submission.id}/revise`)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Submit Revision
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </AuthorLayout>
    </RouteGuard>
  )
}
