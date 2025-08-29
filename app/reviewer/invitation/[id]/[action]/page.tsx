"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, FileText, User, AlertTriangle, CheckCircle, XCircle, Mail } from "lucide-react"
import { toast } from "sonner"

interface ReviewInvitation {
  id: string
  articleId: string
  reviewerId: string
  status: string
  createdAt: string
  articleTitle: string
  articleAbstract: string
  articleKeywords: string[]
  reviewerName: string
  reviewerEmail: string
  manuscriptNumber: string
}

export default function ReviewerInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const reviewId = params.id as string
  const action = params.action as string

  const [invitation, setInvitation] = useState<ReviewInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const [alternativeReviewers, setAlternativeReviewers] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchInvitation()
  }, [reviewId])

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/reviewer/invitation/${reviewId}`)
      if (!response.ok) {
        throw new AppError("Failed to fetch invitation")
      }
      const data = await response.json()
      setInvitation(data.invitation)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching invitation:", error)
      }
      setError("Failed to load invitation details")
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async () => {
    if (!action || !["accept", "decline"].includes(action)) {
      toast.error("Invalid action")
      return
    }

    if (action === "decline" && !declineReason.trim()) {
      toast.error("Please provide a reason for declining")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/reviewer/invitation/${reviewId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          declineReason: action === "decline" ? declineReason : undefined,
          alternativeReviewers: action === "decline" && alternativeReviewers.trim() ? alternativeReviewers : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new AppError(errorData.error || "Failed to submit response")
      }

      const data = await response.json()
      
      if (action === "accept") {
        toast.success("Review invitation accepted! You will receive access instructions shortly.")
        setTimeout(() => {
          router.push("/reviewer/dashboard")
        }, 2000)
      } else {
        toast.success("Thank you for your response. The editorial team has been notified.")
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }

    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error submitting response:", error)
      }
      setError(error.message || "Failed to submit response")
      toast.error(error.message || "Failed to submit response")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Review invitation not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isAlreadyResponded = invitation.status !== "pending"

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Review Invitation</h1>
          <p className="text-muted-foreground mt-2">
            Advances in Medicine and Health Science Journal
          </p>
        </div>

        {/* Status Alert */}
        {isAlreadyResponded && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This invitation has already been {invitation.status}. 
            </AlertDescription>
          </Alert>
        )}

        {/* Invitation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Review Invitation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span><strong>Reviewer:</strong> {invitation.reviewerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span><strong>Manuscript No.:</strong> {invitation.manuscriptNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span><strong>Invited:</strong> {new Date(invitation.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span><strong>Review Period:</strong> 21 days from acceptance</span>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-2">{invitation.articleTitle}</h3>
              <Badge variant="secondary" className="mb-3">
                Manuscript No. {invitation.manuscriptNumber}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Abstract</h4>
              <p className="text-sm text-muted-foreground leading-relaxed bg-gray-50 p-4 rounded">
                {invitation.articleAbstract}
              </p>
            </div>

            {invitation.articleKeywords && invitation.articleKeywords.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {invitation.articleKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confidentiality Notice */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="text-amber-800">
              <h4 className="font-semibold mb-2">🔒 Confidentiality Notice</h4>
              <p className="text-sm">
                Please treat this invitation, the manuscript, and all associated materials as <strong>strictly confidential</strong>. 
                This includes refraining from sharing your review, any part of the manuscript, or reviewer comments with others 
                without explicit consent from the editors and authors, regardless of the publication outcome.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Response Section */}
        {!isAlreadyResponded && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {action === "accept" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {action === "accept" ? "Accept Review Invitation" : "Decline Review Invitation"}
              </CardTitle>
              <CardDescription>
                {action === "accept" 
                  ? "By accepting, you agree to review this manuscript within 21 days and maintain strict confidentiality."
                  : "Please provide a reason for declining and suggest alternative reviewers if possible."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {action === "accept" && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <h4 className="font-semibold mb-2">What happens next:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• You will receive a confirmation email with access instructions</li>
                      <li>• The manuscript and review forms will be available in your reviewer dashboard</li>
                      <li>• You will have 21 days to complete your review</li>
                      <li>• All materials must remain confidential throughout the process</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {action === "decline" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="decline-reason">
                      Reason for declining *
                    </Label>
                    <Textarea
                      id="decline-reason"
                      placeholder="Please provide a brief explanation for why you cannot review this manuscript..."
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternative-reviewers">
                      Alternative reviewer suggestions (Optional)
                    </Label>
                    <Textarea
                      id="alternative-reviewers"
                      placeholder="If possible, please suggest names and contact information for alternative qualified reviewers..."
                      value={alternativeReviewers}
                      onChange={(e) => setAlternativeReviewers(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleResponse}
                  disabled={submitting}
                  className={`flex-1 ${action === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {submitting ? "Submitting..." : (action === "accept" ? "Accept Invitation" : "Decline Invitation")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
