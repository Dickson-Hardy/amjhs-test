import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Users, UserPlus, Search, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface RecommendedReviewer {
  id: string
  name: string
  email: string
  affiliation: string
  expertise?: string[]
  status: string
  isInSystem: boolean
}

interface SystemCandidate {
  id: string
  name: string
  email: string
  score: number
}

interface WorkflowStep {
  step1_recommendedRetrieved: number
  step2_recommendedValidated: number
  step3_systemCandidates: number
  step4_totalRanked: number
  step5_finalSelected: number
}

interface AssignmentResult {
  assignedReviewers: unknown[]
  recommendedUsed: number
  systemFound: number
  totalAssigned: number
  workflow: WorkflowStep
  summary: {
    step1: string
    step2: string
    step3: string
    step4: string
    step5: string
  }
}

interface ReviewerAssignmentPanelProps {
  articleId: string
  articleTitle: string
  onAssignmentComplete?: (result: AssignmentResult) => void
}

export function ReviewerAssignmentPanel({ 
  articleId, 
  articleTitle, 
  onAssignmentComplete 
}: ReviewerAssignmentPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null)
  const [previewData, setPreviewData] = useState<{
    recommendedReviewers: RecommendedReviewer[]
    systemCandidates: SystemCandidate[]
    summary: unknown
  } | null>(null)
  const [targetReviewerCount, setTargetReviewerCount] = useState(3)

  useEffect(() => {
    loadPreviewData()
  }, [articleId])

  const loadPreviewData = async () => {
    setIsPreviewLoading(true)
    try {
      const response = await fetch(`/api/workflow/assign-reviewers-enhanced?articleId=${articleId}`)
      const data = await response.json()
      
      if (data.success) {
        setPreviewData(data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load reviewer preview",
          variant: "destructive"
        })
      }
    } catch (error) {
      logger.error('Error loading preview:', error)
      toast({
        title: "Error",
        description: "Failed to load reviewer preview",
        variant: "destructive"
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleAssignReviewers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/workflow/assign-reviewers-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          targetReviewerCount
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAssignmentResult(data.data)
        onAssignmentComplete?.(data.data)
        toast({
          title: "Success",
          description: `Successfully assigned ${data.data.totalAssigned} reviewers`,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to assign reviewers",
          variant: "destructive"
        })
      }
    } catch (error) {
      logger.error('Error assigning reviewers:', error)
      toast({
        title: "Error",
        description: "An error occurred while assigning reviewers",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'suggested':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'validated':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'conflict':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (isPreviewLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enhanced Reviewer Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reviewer data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enhanced Reviewer Assignment
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Intelligent assignment combining author recommendations with system candidates
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Article Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Article</h4>
            <p className="text-sm">{articleTitle}</p>
          </div>

          {/* Preview Data */}
          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Author Recommended Reviewers */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Author Recommendations ({previewData.recommendedReviewers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {previewData.recommendedReviewers.map((reviewer) => (
                      <div key={reviewer.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(reviewer.status)}
                            <span className="font-medium text-sm">{reviewer.name}</span>
                            {reviewer.isInSystem && (
                              <Badge variant="secondary" className="text-xs">In System</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{reviewer.affiliation}</p>
                        </div>
                      </div>
                    ))}
                    {previewData.recommendedReviewers.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recommendations found</p>
                    )}
                  </CardContent>
                </Card>

                {/* System Candidates */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      System Candidates ({previewData.systemCandidates.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {previewData.systemCandidates.slice(0, 5).map((candidate) => (
                      <div key={candidate.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <span className="font-medium text-sm">{candidate.name}</span>
                          <p className="text-xs text-muted-foreground">{candidate.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Score: {candidate.score}
                        </Badge>
                      </div>
                    ))}
                    {previewData.systemCandidates.length === 0 && (
                      <p className="text-sm text-muted-foreground">No candidates found</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Assignment Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Target Reviewers:</label>
                  <select 
                    value={targetReviewerCount} 
                    onChange={(e) => setTargetReviewerCount(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
                <Button 
                  onClick={handleAssignReviewers} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  Assign Reviewers
                </Button>
              </div>
            </div>
          )}

          {/* Assignment Result */}
          {assignmentResult && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Assignment Complete
                </h4>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {assignmentResult.recommendedUsed}
                      </div>
                      <p className="text-sm text-muted-foreground">Recommended</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {assignmentResult.systemFound}
                      </div>
                      <p className="text-sm text-muted-foreground">System Found</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {assignmentResult.totalAssigned}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Assigned</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Workflow Steps */}
                <div className="space-y-2">
                  <h5 className="font-medium">Workflow Summary:</h5>
                  {Object.entries(assignmentResult.summary).map(([step, description]) => (
                    <div key={step} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {step.replace('step', 'Step ')}
                      </Badge>
                      <span>{description}</span>
                    </div>
                  ))}
                </div>

                {/* Assigned Reviewers List */}
                <div>
                  <h5 className="font-medium mb-2">Assigned Reviewers:</h5>
                  <div className="space-y-2">
                    {assignmentResult.assignedReviewers.map((reviewer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{reviewer.name}</span>
                          <p className="text-sm text-muted-foreground">{reviewer.email}</p>
                        </div>
                        <Badge variant={reviewer.source === 'recommended' ? 'default' : 'secondary'}>
                          {reviewer.source === 'recommended' ? 'Author Rec.' : 'System Found'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
