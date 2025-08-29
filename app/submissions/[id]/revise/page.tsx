"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { handleError } from "@/lib/modern-error-handler"
import { toast } from "@/hooks/use-toast"
import {
  Upload,
  FileText,
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  Download,
  Calendar,
  Edit,
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
  files?: { url: string; type: string; name: string; fileId: string }[];
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

interface RevisionData {
  responseToReviewers: string;
  changesDescription: string;
  newFiles: File[];
  removedFileIds: string[];
}

export default function SubmissionRevisionPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [revisionData, setRevisionData] = useState<RevisionData>({
    responseToReviewers: '',
    changesDescription: '',
    newFiles: [],
    removedFileIds: [],
  })

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
            
            // Check if revision is actually needed
            if (foundSubmission.status !== 'revision_requested') {
              toast({
                title: "No revision needed",
                description: "This submission does not require revision at this time.",
                variant: "destructive",
              })
              router.push(`/submissions/${params.id}`)
              return
            }
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
          setReviews(reviewsData.reviews || [])
        }
      }

    } catch (error) {
      handleError(error, { 
        component: 'submission-revision', 
        action: 'fetch_submission_and_reviews'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setRevisionData(prev => ({
      ...prev,
      newFiles: [...prev.newFiles, ...files]
    }))
  }

  const removeNewFile = (index: number) => {
    setRevisionData(prev => ({
      ...prev,
      newFiles: prev.newFiles.filter((_, i) => i !== index)
    }))
  }

  const removeExistingFile = (fileId: string) => {
    setRevisionData(prev => ({
      ...prev,
      removedFileIds: [...prev.removedFileIds, fileId]
    }))
  }

  const restoreExistingFile = (fileId: string) => {
    setRevisionData(prev => ({
      ...prev,
      removedFileIds: prev.removedFileIds.filter(id => id !== fileId)
    }))
  }

  const handleSaveDraft = async () => {
    try {
      const response = await fetch(`/api/manuscripts/${params.id}/revisions/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responseToReviewers: revisionData.responseToReviewers,
          changesDescription: revisionData.changesDescription,
        }),
      })

      if (response.ok) {
        toast({
          title: "Draft saved",
          description: "Your revision draft has been saved successfully.",
        })
      }
    } catch (error) {
      handleError(error, { 
        component: 'submission-revision', 
        action: 'save_draft'
      })
    }
  }

  const handleSubmitRevision = async () => {
    if (!revisionData.responseToReviewers.trim() || !revisionData.changesDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both response to reviewers and description of changes.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('responseToReviewers', revisionData.responseToReviewers)
      formData.append('changesDescription', revisionData.changesDescription)
      formData.append('removedFileIds', JSON.stringify(revisionData.removedFileIds))

      // Add new files
      revisionData.newFiles.forEach((file, index) => {
        formData.append(`newFiles`, file)
      })

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`/api/manuscripts/revisions/submit`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: "Revision submitted",
            description: "Your revision has been submitted successfully and is now under review.",
          })
          router.push(`/submissions/${params.id}`)
        }
      } else {
        throw new AppError('Failed to submit revision')
      }
    } catch (error) {
      handleError(error, { 
        component: 'submission-revision', 
        action: 'submit_revision'
      })
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["author", "reviewer", "editor", "admin"]}>
        <AuthorLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading revision details...</p>
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
            <h1 className="text-2xl font-bold text-slate-900">Submit Revision</h1>
            <p className="text-slate-600">{submission.title}</p>
          </div>
          <Badge className="bg-orange-100 text-orange-800" variant="outline">
            <Edit className="h-3 w-3 mr-1" />
            Revision Required
          </Badge>
        </div>

        {/* Instructions */}
        <Alert className="border-orange-200 bg-orange-50 mb-6">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Revision Instructions:</strong> Please address all reviewer comments and provide a detailed response explaining your changes. Upload your revised manuscript and any additional files as needed.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reviewer Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Reviewer Comments to Address
                </CardTitle>
                <CardDescription>
                  Review the feedback from peer reviewers before submitting your revision
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">No reviewer comments available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Reviewer {index + 1}</h4>
                          {review.score && (
                            <Badge variant="outline">
                              Score: {review.score}/10
                            </Badge>
                          )}
                        </div>
                        {review.recommendation && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-slate-700">Recommendation: </span>
                            <span className="text-sm text-slate-600">{review.recommendation}</span>
                          </div>
                        )}
                        {review.comments && (
                          <div className="bg-slate-50 p-3 rounded">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{review.comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Response to Reviewers */}
            <Card>
              <CardHeader>
                <CardTitle>Response to Reviewers</CardTitle>
                <CardDescription>
                  Provide a detailed point-by-point response addressing each reviewer comment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="response">Your Response</Label>
                  <Textarea
                    id="response"
                    value={revisionData.responseToReviewers}
                    onChange={(e) => setRevisionData(prev => ({ ...prev, responseToReviewers: e.target.value }))}
                    placeholder="Dear Reviewers,

Thank you for your valuable feedback. Please find our point-by-point responses below:

Reviewer 1:
Comment 1: [Insert reviewer comment]
Response: [Your detailed response and how you addressed it]

Reviewer 2:
..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Provide a comprehensive response addressing each reviewer's comments systematically.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Description of Changes */}
            <Card>
              <CardHeader>
                <CardTitle>Summary of Changes</CardTitle>
                <CardDescription>
                  Describe the major changes made to your manuscript
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="changes">Changes Description</Label>
                  <Textarea
                    id="changes"
                    value={revisionData.changesDescription}
                    onChange={(e) => setRevisionData(prev => ({ ...prev, changesDescription: e.target.value }))}
                    placeholder="Summary of major changes made:

1. Methodology section: Added detailed description of statistical analysis methods (lines 145-162)
2. Results section: Included additional data tables and updated figures 2-4
3. Discussion: Expanded discussion of limitations and future research directions
4. References: Added 12 new citations as suggested by reviewers
..."
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Revised Files
                </CardTitle>
                <CardDescription>
                  Upload your revised manuscript and any additional supporting files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Files */}
                {submission.files && submission.files.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Current Files</h4>
                    <div className="space-y-2">
                      {submission.files.map((file, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            revisionData.removedFileIds.includes(file.fileId) 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-slate-500" />
                            <div>
                              <p className={`font-medium ${
                                revisionData.removedFileIds.includes(file.fileId) 
                                  ? 'line-through text-red-600' 
                                  : 'text-slate-900'
                              }`}>
                                {file.name}
                              </p>
                              <p className="text-sm text-slate-600">{file.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                            {revisionData.removedFileIds.includes(file.fileId) ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => restoreExistingFile(file.fileId)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => removeExistingFile(file.fileId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Files */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900">Upload New Files</h4>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Files
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.tex,.txt"
                    />
                  </div>

                  {revisionData.newFiles.length > 0 && (
                    <div className="space-y-2">
                      {revisionData.newFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">{file.name}</p>
                              <p className="text-sm text-green-700">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeNewFile(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {submitting && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submission Info */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-700">Manuscript ID</span>
                  <p className="text-sm text-slate-600">{submission.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700">Category</span>
                  <p className="text-sm text-slate-600">{submission.category}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700">Original Submission</span>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(submission.submittedDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700">Revision Requested</span>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(submission.lastUpdate).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSaveDraft}
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={submitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                
                <Button 
                  onClick={handleSubmitRevision}
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                  disabled={submitting || !revisionData.responseToReviewers.trim() || !revisionData.changesDescription.trim()}
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Revision
                    </>
                  )}
                </Button>

                <Button 
                  onClick={() => router.push(`/submissions/${submission.id}`)}
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={submitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Revision Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Response Format</h4>
                  <p>Address each reviewer comment individually with clear explanations of changes made.</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">File Requirements</h4>
                  <p>Upload your revised manuscript highlighting changes. Accepted formats: PDF, DOC, DOCX, TEX.</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Review Timeline</h4>
                  <p>Revised manuscripts are typically reviewed within 2-3 weeks of submission.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthorLayout>
    </RouteGuard>
  )
}
