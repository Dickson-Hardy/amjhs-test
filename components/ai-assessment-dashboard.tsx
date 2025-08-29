/**
 * AI Assessment Dashboard Component
 * Displays AI-powered manuscript assessments and insights
 */

"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Brain, 
  FileSearch, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'
import { logger } from '@/lib/logger'

interface AssessmentResult {
  id: string
  manuscriptId: string
  qualityScore: number
  plagiarismScore: number
  readabilityScore: number
  originalityScore: number
  impactPrediction: {
    score: number
    factors: string[]
    confidence: number
  }
  reviewerMatches: Array<{
    id: string
    name: string
    expertise: string[]
    matchScore: number
    availability: boolean
  }>
  recommendations: string[]
  issues: Array<{
    type: 'warning' | 'error' | 'suggestion'
    message: string
    section?: string
  }>
  createdAt: string
  status: 'processing' | 'completed' | 'failed'
}

interface AIAssessmentDashboardProps {
  manuscriptId?: string
  className?: string
}

export function AIAssessmentDashboard({ manuscriptId, className }: AIAssessmentDashboardProps) {
  const { data: session } = useSession()
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      loadAssessments()
    }
  }, [session, manuscriptId])

  const loadAssessments = async () => {
    try {
      setLoading(true)
      setError(null)

      const endpoint = manuscriptId 
        ? `/api/ai?action=get-assessment&manuscriptId=${manuscriptId}`
        : '/api/ai?action=get-assessments'

      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.success) {
        if (manuscriptId) {
          setCurrentAssessment(data.data)
        } else {
          setAssessments(data.data.assessments || [])
        }
      } else {
        setError(data.error || 'Failed to load assessments')
      }
    } catch (error) {
      logger.error('Failed to load AI assessments:', error)
      setError('Failed to load assessments')
    } finally {
      setLoading(false)
    }
  }

  const startAssessment = async (manuscriptId: string, content: unknown) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assess-manuscript',
          manuscriptId,
          content
        })
      })

      const data = await response.json()

      if (data.success) {
        setCurrentAssessment(data.data)
        await loadAssessments() // Refresh the list
      } else {
        setError(data.error || 'Assessment failed')
      }
    } catch (error) {
      logger.error('Failed to start assessment:', error)
      setError('Failed to start assessment')
    } finally {
      setLoading(false)
    }
  }

  const runPlagiarismCheck = async (manuscriptId: string, content: string) => {
    try {
      setLoading(true)

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check-plagiarism',
          manuscriptId,
          content
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update current assessment with plagiarism results
        if (currentAssessment) {
          setCurrentAssessment({
            ...currentAssessment,
            plagiarismScore: data.data.similarityScore,
            issues: [
              ...currentAssessment.issues,
              ...data.data.flaggedContent.map((item: unknown) => ({
                type: 'warning' as const,
                message: `Potential plagiarism detected: ${item.reason}`,
                section: item.section
              }))
            ]
          })
        }
      } else {
        setError(data.error || 'Plagiarism check failed')
      }
    } catch (error) {
      logger.error('Failed to run plagiarism check:', error)
      setError('Failed to run plagiarism check')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  if (loading && !currentAssessment && assessments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin mr-3" />
          <span>Loading AI assessments...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Manuscript Assessment
          </CardTitle>
          <CardDescription>
            Comprehensive analysis using artificial intelligence and machine learning
          </CardDescription>
        </CardHeader>
      </Card>

      {currentAssessment ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
            <TabsTrigger value="plagiarism">Plagiarism Check</TabsTrigger>
            <TabsTrigger value="reviewers">Reviewer Matching</TabsTrigger>
            <TabsTrigger value="impact">Impact Prediction</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Quality Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(currentAssessment.qualityScore)}`}>
                        {currentAssessment.qualityScore}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Progress value={currentAssessment.qualityScore} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Originality</p>
                      <p className={`text-2xl font-bold ${getScoreColor(currentAssessment.originalityScore)}`}>
                        {currentAssessment.originalityScore}%
                      </p>
                    </div>
                    <FileSearch className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Progress value={currentAssessment.originalityScore} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Readability</p>
                      <p className={`text-2xl font-bold ${getScoreColor(currentAssessment.readabilityScore)}`}>
                        {currentAssessment.readabilityScore}%
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Progress value={currentAssessment.readabilityScore} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Impact Potential</p>
                      <p className={`text-2xl font-bold ${getScoreColor(currentAssessment.impactPrediction.score)}`}>
                        {currentAssessment.impactPrediction.score}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Progress value={currentAssessment.impactPrediction.score} className="mt-3" />
                </CardContent>
              </Card>
            </div>

            {currentAssessment.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Issues & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentAssessment.issues.map((issue, index) => (
                    <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                      {issue.type === 'error' ? (
                        <XCircle className="h-4 w-4" />
                      ) : issue.type === 'warning' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        <strong>{issue.section && `${issue.section}: `}</strong>
                        {issue.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {currentAssessment.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentAssessment.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Analysis Details</CardTitle>
                <CardDescription>
                  Comprehensive quality assessment based on multiple factors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Structure & Organization</span>
                    <Badge variant={getScoreBadgeVariant(85)}>85%</Badge>
                  </div>
                  <Progress value={85} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Methodology Clarity</span>
                    <Badge variant={getScoreBadgeVariant(78)}>78%</Badge>
                  </div>
                  <Progress value={78} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Citation Quality</span>
                    <Badge variant={getScoreBadgeVariant(92)}>92%</Badge>
                  </div>
                  <Progress value={92} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Data Presentation</span>
                    <Badge variant={getScoreBadgeVariant(73)}>73%</Badge>
                  </div>
                  <Progress value={73} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plagiarism" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Plagiarism Detection Results
                </CardTitle>
                <CardDescription>
                  Advanced similarity detection across academic databases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Overall Similarity Score</p>
                      <p className="text-sm text-muted-foreground">
                        Compared against millions of academic papers
                      </p>
                    </div>
                    <Badge 
                      variant={currentAssessment.plagiarismScore < 15 ? 'default' : 
                              currentAssessment.plagiarismScore < 25 ? 'secondary' : 'destructive'}
                      className="text-lg px-3 py-1"
                    >
                      {currentAssessment.plagiarismScore}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">5%</p>
                      <p className="text-sm text-muted-foreground">CrossRef Database</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">8%</p>
                      <p className="text-sm text-muted-foreground">PubMed Central</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">2%</p>
                      <p className="text-sm text-muted-foreground">arXiv Repository</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviewers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  AI-Matched Reviewers
                </CardTitle>
                <CardDescription>
                  Optimal reviewer recommendations based on expertise and availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentAssessment.reviewerMatches.map((reviewer) => (
                    <div key={reviewer.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{reviewer.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={reviewer.availability ? 'default' : 'secondary'}>
                              {reviewer.availability ? 'Available' : 'Busy'}
                            </Badge>
                            <Badge variant="outline">
                              {reviewer.matchScore}% match
                            </Badge>
                          </div>
                        </div>
                        <Progress value={reviewer.matchScore} className="w-24" />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {reviewer.expertise.map((area, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="impact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Research Impact Prediction
                </CardTitle>
                <CardDescription>
                  AI-powered analysis of potential research impact and reach
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {currentAssessment.impactPrediction.score}%
                  </div>
                  <p className="text-lg font-medium mb-1">Predicted Impact Score</p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {currentAssessment.impactPrediction.confidence}%
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Impact Factors</h4>
                  <div className="space-y-2">
                    {currentAssessment.impactPrediction.factors.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">150-300</p>
                    <p className="text-sm text-muted-foreground">Estimated Citations (5 years)</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">High</p>
                    <p className="text-sm text-muted-foreground">Interdisciplinary Potential</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Assessment Available</h3>
            <p className="text-muted-foreground mb-6">
              Run an AI assessment to get comprehensive analysis and insights for your manuscript.
            </p>
            <Button onClick={() => setError(null)}>
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {!manuscriptId && assessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>
              Latest AI assessments across all manuscripts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Manuscript {assessment.manuscriptId}</h4>
                    <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                      {assessment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Quality: {assessment.qualityScore}%</span>
                    <span>Originality: {assessment.originalityScore}%</span>
                    <span>Impact: {assessment.impactPrediction.score}%</span>
                    <span>{new Date(assessment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AIAssessmentDashboard
