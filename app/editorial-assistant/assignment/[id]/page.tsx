"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, AlertTriangle, CheckCircle, User, FileText, Users } from "lucide-react"
import { toast } from "sonner"

interface Manuscript {
  id: string
  title: string
  abstract: string
  keywords: string[]
  category: string
  status: string
  submittedAt: string
  authorName: string
  authorEmail: string
  files: Array<{
    id: string
    name: string
    type: string
    url: string
  }>
}

interface AssociateEditor {
  id: string
  name: string
  email: string
  affiliation: string
  expertise: string[]
  specializations: string[]
  currentWorkload: number
  maxWorkload: number
  isAvailable: boolean
}

interface ScreeningResult {
  id: string
  status: string
  decision: string
  qualityScore: number
  completenessScore: number
  overallAssessment: string
  screeningNotes: string
  completedAt: string
}

export default function EditorialAssistantAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const manuscriptId = params.id as string

  const [manuscript, setManuscript] = useState<Manuscript | null>(null)
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null)
  const [associateEditors, setAssociateEditors] = useState<AssociateEditor[]>([])
  const [selectedEditor, setSelectedEditor] = useState("")
  const [assignmentReason, setAssignmentReason] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchData()
  }, [manuscriptId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch manuscript details
      const manuscriptResponse = await fetch(`/api/submissions/${manuscriptId}`)
      if (!manuscriptResponse.ok) {
        throw new Error("Failed to fetch manuscript details")
      }
      const manuscriptData = await manuscriptResponse.json()
      setManuscript(manuscriptData.submission)

      // Fetch screening result - optional for now
      try {
        const screeningResponse = await fetch(`/api/editorial-assistant/screening?submissionId=${manuscriptId}`)
        if (screeningResponse.ok) {
          const screeningData = await screeningResponse.json()
          // For now, we'll create mock screening data if none exists
          // In a real system, you'd fetch from manuscript_screenings table
          if (screeningData.manuscript) {
            setScreeningResult({
              id: 'mock-screening',
              status: 'passed',
              decision: 'proceed_to_associate_editor',
              qualityScore: 85,
              completenessScore: 90,
              overallAssessment: 'Manuscript meets publication standards and is ready for associate editor review.',
              screeningNotes: 'Initial screening completed successfully.',
              completedAt: new Date().toISOString()
            })
          }
        }
      } catch (screeningError) {
        console.log('Screening data not available, proceeding without it')
        // This is OK - assignment can work without screening results
      }

      // Fetch available associate editors
      try {
        const editorsResponse = await fetch(`/api/users?role=associate-editor&available=true`)
        if (!editorsResponse.ok) {
          throw new Error("Failed to fetch associate editors")
        }
        const editorsData = await editorsResponse.json()
        setAssociateEditors(editorsData.users || [])
      } catch (editorsError) {
        console.error("Error fetching associate editors:", editorsError)
        // Continue without associate editors - the UI will show appropriate message
        setAssociateEditors([])
      }

    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load assignment data")
    } finally {
      setLoading(false)
    }
  }

  const calculateMatchScore = (editor: AssociateEditor): number => {
    if (!manuscript) return 0
    
    let score = 0
    const manuscriptKeywords = manuscript.keywords.map(k => k.toLowerCase())
    const editorExpertise = editor.expertise.map(e => e.toLowerCase())
    const editorSpecializations = editor.specializations.map(s => s.toLowerCase())
    
    // Check keyword matches with expertise
    manuscriptKeywords.forEach(keyword => {
      if (editorExpertise.some(exp => exp.includes(keyword) || keyword.includes(exp))) {
        score += 3
      }
      if (editorSpecializations.some(spec => spec.includes(keyword) || keyword.includes(spec))) {
        score += 2
      }
    })
    
    // Workload factor (lower workload = higher score)
    const workloadFactor = editor.maxWorkload > 0 ? 
      (editor.maxWorkload - editor.currentWorkload) / editor.maxWorkload : 1
    score += workloadFactor * 10
    
    return Math.min(score, 100)
  }

  const handleAssignEditor = async () => {
    // For single associate editor workflow, we auto-assign
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/editorial-assistant/assignment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manuscriptId,
          // No need to specify associateEditorId - API will auto-assign to single editor
          assignmentReason: "auto-assignment", 
          additionalNotes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to assign to associate editor")
      }

      const responseData = await response.json()
      toast.success("Manuscript assigned to associate editor successfully")
      
      // Redirect back to dashboard after successful assignment
      setTimeout(() => {
        router.push("/editorial-assistant")
      }, 2000)

    } catch (error: any) {
      console.error("Error assigning editor:", error)
      setError(error.message || "Failed to assign to associate editor")
      toast.error(error.message || "Failed to assign to associate editor")
    } finally {
      setSubmitting(false)
    }
  }

  const getWorkloadColor = (current: number, max: number): string => {
    const percentage = max > 0 ? (current / max) * 100 : 0
    if (percentage >= 80) return "text-red-600"
    if (percentage >= 60) return "text-amber-600"
    return "text-green-600"
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

  if (error && !manuscript) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!manuscript) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Manuscript not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const sortedEditors = associateEditors
    .map(editor => ({
      ...editor,
      matchScore: calculateMatchScore(editor)
    }))
    .sort((a, b) => b.matchScore - a.matchScore)

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Associate Editor Assignment</h1>
          <p className="text-muted-foreground mt-2">
            Assign an associate editor to review this manuscript
          </p>
        </div>

        {/* Manuscript Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Manuscript Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{manuscript.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{manuscript.category}</Badge>
                <Badge variant={manuscript.status === 'associate_editor_assignment' ? 'default' : 'outline'}>
                  {manuscript.status}
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Abstract</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {manuscript.abstract}
              </p>
            </div>

            {manuscript.keywords && manuscript.keywords.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {manuscript.keywords.map((keyword, index) => (
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
                <span><strong>Author:</strong> {manuscript.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span><strong>Submitted:</strong> {new Date(manuscript.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screening Result */}
        {screeningResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Screening Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{screeningResult.qualityScore}%</div>
                  <div className="text-sm text-muted-foreground">Quality Score</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{screeningResult.completenessScore}%</div>
                  <div className="text-sm text-muted-foreground">Completeness</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{screeningResult.decision}</div>
                  <div className="text-sm text-muted-foreground">Decision</div>
                </div>
              </div>
              
              {screeningResult.overallAssessment && (
                <div>
                  <h4 className="font-medium mb-2">Assessment</h4>
                  <p className="text-sm text-muted-foreground">{screeningResult.overallAssessment}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Associate Editor Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Associate Editor Assignment
            </CardTitle>
            <CardDescription>
              This manuscript will be assigned to the associate editor who manages all submitted manuscripts 
              and assigns reviewers for peer review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedEditors.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No associate editor is currently available for assignment.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {/* Show the primary associate editor */}
                {sortedEditors.slice(0, 1).map((editor, index) => (
                  <div 
                    key={editor.id} 
                    className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{editor.name}</h4>
                          <Badge variant="default" className="text-xs">Primary Associate Editor</Badge>
                          <Badge variant="outline" className="text-xs">
                            All Manuscripts
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{editor.affiliation}</p>
                        
                        <div className="mt-2 space-y-1">
                          {editor.expertise.length > 0 && (
                            <div>
                              <span className="text-xs font-medium">Expertise: </span>
                              <span className="text-xs text-muted-foreground">
                                {editor.expertise.slice(0, 3).join(", ")}
                                {editor.expertise.length > 3 && ` +${editor.expertise.length - 3} more`}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs">
                            <span className={getWorkloadColor(editor.currentWorkload, editor.maxWorkload)}>
                              Workload: {editor.currentWorkload}/{editor.maxWorkload}
                            </span>
                            <span className={editor.isAvailable ? 'text-green-600' : 'text-red-600'}>
                              {editor.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <input
                        type="radio"
                        checked={selectedEditor === editor.id}
                        onChange={() => setSelectedEditor(editor.id)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle>Assign to Associate Editor</CardTitle>
            <CardDescription>
              Confirm assignment of this manuscript to the associate editor who will manage the review process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {associateEditors.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Assignment Target</span>
                </div>
                <p className="text-sm text-blue-700">
                  <strong>{associateEditors[0]?.name}</strong> - Primary Associate Editor
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Will assign reviewers and manage the peer review process for this manuscript
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="additional-notes" className="text-sm font-medium">
                Assignment Notes (Optional)
              </label>
              <Textarea
                id="additional-notes"
                placeholder="Any specific instructions or notes for the associate editor about this manuscript..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
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
                  onClick={handleAssignEditor}
                  disabled={submitting || associateEditors.length === 0}
                  className="flex-1"
                >
                  {submitting ? "Assigning..." : "Assign to Associate Editor"}
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
      </div>
    </div>
  )
}