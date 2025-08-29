"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle, User, FileText } from "lucide-react"
import { toast } from "sonner"

interface Assignment {
  id: string
  articleId: string
  editorId: string
  assignedAt: string
  deadline: string
  status: string
  assignmentReason?: string
  articleTitle: string
  articleAbstract: string
  articleKeywords: string[]
  articleCategory: string
  editorName: string
  editorEmail: string
}

interface ConflictType {
  id: string
  label: string
  description: string
}

const conflictTypes: ConflictType[] = [
  {
    id: "family",
    label: "Family Relationships",
    description: "Any family members among the authors"
  },
  {
    id: "friendship",
    label: "Personal Friendships", 
    description: "Close personal friends among the authors"
  },
  {
    id: "coauthorship",
    label: "Co-authorship",
    description: "Co-authored papers with any author within the last 10 years"
  },
  {
    id: "financial",
    label: "Financial Interests",
    description: "Financial relationships with authors or their institutions"
  },
  {
    id: "institutional",
    label: "Institutional Bias",
    description: "Same institution as unknown author"
  },
  {
    id: "professional",
    label: "Professional Rivalries",
    description: "Known professional conflicts or rivalries"
  },
  {
    id: "mentorship",
    label: "Mentorship",
    description: "Current or former student/supervisor relationships"
  }
]

export default function EditorAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [action, setAction] = useState<"accept" | "decline" | "">("")
  const [conflictDeclared, setConflictDeclared] = useState(false)
  const [selectedConflicts, setSelectedConflicts] = useState<string[]>([])
  const [conflictDetails, setConflictDetails] = useState("")
  const [declineReason, setDeclineReason] = useState("")
  const [editorComments, setEditorComments] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAssignment()
  }, [assignmentId])

  const fetchAssignment = async () => {
    try {
      const response = await fetch(`/api/editor/assignment/${assignmentId}`)
      if (!response.ok) {
        throw new AppError("Failed to fetch assignment")
      }
      const data = await response.json()
      setAssignment(data.assignment)
    } catch (error) {
      logger.error("Error fetching assignment:", error)
      setError("Failed to load assignment details")
    } finally {
      setLoading(false)
    }
  }

  const handleConflictToggle = (conflictId: string, checked: boolean) => {
    if (checked) {
      setSelectedConflicts(prev => [...prev, conflictId])
      setConflictDeclared(true)
    } else {
      setSelectedConflicts(prev => prev.filter(id => id !== conflictId))
      if (selectedConflicts.length === 1) {
        setConflictDeclared(false)
        setConflictDetails("")
      }
    }
  }

  const handleSubmit = async () => {
    if (!action) {
      toast.error("Please select accept or decline")
      return
    }

    if (conflictDeclared && selectedConflicts.length === 0) {
      toast.error("Please specify which conflicts exist")
      return
    }

    if (conflictDeclared && !conflictDetails.trim()) {
      toast.error("Please provide details about the conflict of interest")
      return
    }

    if (action === "decline" && !conflictDeclared && !declineReason.trim()) {
      toast.error("Please provide a reason for declining")
      return
    }

    if (conflictDeclared && action === "accept") {
      toast.error("Cannot accept assignment when conflict of interest is declared")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/editor/assignment/${assignmentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          conflictDeclared,
          conflictDetails: conflictDeclared ? 
            `Selected conflicts: ${selectedConflicts.map(id => conflictTypes.find(c => c.id === id)?.label).join(", ")}. Details: ${conflictDetails}` :
            undefined,
          declineReason,
          editorComments,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new AppError(errorData.error || "Failed to submit response")
      }

      toast.success(`Assignment ${action}ed successfully`)
      
      // Redirect to editor dashboard after successful submission
      setTimeout(() => {
        router.push("/editor/dashboard")
      }, 2000)

    } catch (error: unknown) {
      logger.error("Error submitting response:", error)
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

  if (error && !assignment) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Assignment not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isExpired = new Date() > new Date(assignment.deadline)
  const isAlreadyResponded = assignment.status !== "pending"

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Editorial Assignment</h1>
          <p className="text-muted-foreground mt-2">
            Please review the manuscript details and declare any conflicts of interest
          </p>
        </div>

        {/* Status Alert */}
        {isAlreadyResponded && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This assignment has already been {assignment.status}. 
            </AlertDescription>
          </Alert>
        )}

        {isExpired && assignment.status === "pending" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              This assignment has expired. The deadline was {new Date(assignment.deadline).toLocaleDateString()}.
            </AlertDescription>
          </Alert>
        )}

        {/* Assignment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Manuscript Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{assignment.articleTitle}</h3>
              <Badge variant="secondary" className="mt-1">
                {assignment.articleCategory}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Abstract</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {assignment.articleAbstract}
              </p>
            </div>

            {assignment.articleKeywords && assignment.articleKeywords.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {assignment.articleKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span><strong>Assigned to:</strong> {assignment.editorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span><strong>Assigned:</strong> {new Date(assignment.assignedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className={isExpired ? "text-red-600" : ""}>
                  <strong>Deadline:</strong> {new Date(assignment.deadline).toLocaleDateString()}
                </span>
              </div>
              {assignment.assignmentReason && (
                <div className="md:col-span-2">
                  <strong>Assignment Reason:</strong> {assignment.assignmentReason}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conflict of Interest Declaration */}
        {!isAlreadyResponded && !isExpired && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Conflict of Interest Declaration
              </CardTitle>
              <CardDescription>
                You must declare any conflicts of interest before responding to this assignment.
                If any conflicts exist, you must decline the assignment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Please check all that apply:</strong> Do you have any of the following 
                  relationships with the authors of this manuscript?
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-4">
                {conflictTypes.map((conflict) => (
                  <div key={conflict.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={conflict.id}
                      checked={selectedConflicts.includes(conflict.id)}
                      onCheckedChange={(checked) => 
                        handleConflictToggle(conflict.id, checked as boolean)
                      }
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor={conflict.id} className="text-sm font-medium">
                        {conflict.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {conflict.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {conflictDeclared && (
                <div className="space-y-2">
                  <Label htmlFor="conflict-details">
                    Please provide details about the conflict(s) of interest *
                  </Label>
                  <Textarea
                    id="conflict-details"
                    placeholder="Describe the nature of the conflict(s) in detail..."
                    value={conflictDetails}
                    onChange={(e) => setConflictDetails(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Response Section */}
        {!isAlreadyResponded && !isExpired && (
          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
              <CardDescription>
                {conflictDeclared 
                  ? "Since you declared a conflict of interest, you must decline this assignment."
                  : "Please indicate whether you accept or decline this editorial assignment."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={action}
                onValueChange={setAction as (value: string) => void}
                disabled={conflictDeclared}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="accept" 
                    id="accept" 
                    disabled={conflictDeclared}
                  />
                  <Label htmlFor="accept" className={conflictDeclared ? "text-muted-foreground" : ""}>
                    Accept Assignment
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="decline" id="decline" />
                  <Label htmlFor="decline">Decline Assignment</Label>
                </div>
              </RadioGroup>

              {action === "decline" && !conflictDeclared && (
                <div className="space-y-2">
                  <Label htmlFor="decline-reason">
                    Reason for declining *
                  </Label>
                  <Textarea
                    id="decline-reason"
                    placeholder="Please provide a reason for declining this assignment..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="editor-comments">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id="editor-comments"
                  placeholder="Any additional comments or questions..."
                  value={editorComments}
                  onChange={(e) => setEditorComments(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !action}
                  className="flex-1"
                  variant={action === "accept" ? "default" : "destructive"}
                >
                  {submitting ? "Submitting..." : `${action === "accept" ? "Accept" : "Decline"} Assignment`}
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
