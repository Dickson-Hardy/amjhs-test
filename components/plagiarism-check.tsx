/**
 * Plagiarism Detection Component
 * Provides plagiarism checking and reporting interface
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  RefreshCw,
  FileText,
  Search,
  Eye,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface PlagiarismReport {
  articleId: string
  overallSimilarity: number
  sources: PlagiarismSource[]
  textMatches: TextMatch[]
  status: 'pending' | 'completed' | 'failed'
  generatedAt: string
  service: string
}

interface PlagiarismSource {
  sourceId: string
  title: string
  authors: string[]
  url?: string
  doi?: string
  similarity: number
  matchedWords: number
  totalWords: number
}

interface TextMatch {
  originalText: string
  matchedText: string
  similarity: number
  startPosition: number
  endPosition: number
  sourceTitle?: string
  sourceUrl?: string
}

interface PlagiarismCheckProps {
  articleId?: string
  content?: string
  onReportGenerated?: (report: PlagiarismReport) => void
}

export default function PlagiarismCheck({ articleId, content, onReportGenerated }: PlagiarismCheckProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [report, setReport] = useState<PlagiarismReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePlagiarismCheck = async () => {
    if (!articleId && !content) {
      toast.error('Article ID or content is required')
      return
    }

    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch('/api/integrations/plagiarism', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          content
        }),
      })

      if (!response.ok) {
        throw new AppError('Failed to run plagiarism check')
      }

      const data = await response.json()
      setReport(data.report)
      onReportGenerated?.(data.report)
      
      toast.success('Plagiarism check completed')

    } catch (error) {
      logger.error('Error running plagiarism check:', error)
      setError('Failed to run plagiarism check')
      toast.error('Failed to run plagiarism check')
    } finally {
      setIsChecking(false)
    }
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity < 10) return 'text-green-600'
    if (similarity < 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSimilarityVariant = (similarity: number) => {
    if (similarity < 10) return 'default'
    if (similarity < 25) return 'secondary'
    return 'destructive'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Plagiarism Detection
          </CardTitle>
          <CardDescription>
            Check your article for potential plagiarism and similarity with existing publications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!report && (
            <Button 
              onClick={handlePlagiarismCheck}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running Plagiarism Check...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Run Plagiarism Check
                </>
              )}
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Plagiarism Report
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getSimilarityVariant(report.overallSimilarity)}>
                  {report.overallSimilarity.toFixed(1)}% Similarity
                </Badge>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
            <CardDescription>
              Generated on {formatDate(report.generatedAt)} using {report.service}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sources">Sources ({report.sources.length})</TabsTrigger>
                <TabsTrigger value="matches">Text Matches ({report.textMatches.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Overall Similarity Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Similarity</span>
                    <span className={`text-sm font-semibold ${getSimilarityColor(report.overallSimilarity)}`}>
                      {report.overallSimilarity.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={report.overallSimilarity} 
                    className="h-2"
                  />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{report.sources.length}</div>
                    <div className="text-sm text-muted-foreground">Sources Found</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{report.textMatches.length}</div>
                    <div className="text-sm text-muted-foreground">Text Matches</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className={`text-2xl font-bold ${getSimilarityColor(report.overallSimilarity)}`}>
                      {report.overallSimilarity < 10 ? 'Low' : report.overallSimilarity < 25 ? 'Medium' : 'High'}
                    </div>
                    <div className="text-sm text-muted-foreground">Risk Level</div>
                  </div>
                </div>

                {/* Recommendations */}
                <Alert>
                  {report.overallSimilarity < 10 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {report.overallSimilarity < 10 
                      ? 'Low similarity detected. The content appears to be largely original.'
                      : report.overallSimilarity < 25
                      ? 'Moderate similarity detected. Review flagged sections and ensure proper citations.'
                      : 'High similarity detected. Significant revision and proper attribution may be required.'
                    }
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="sources" className="space-y-4">
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {report.sources.map((source, index) => (
                      <Card key={source.sourceId} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{source.title}</h4>
                            {source.authors.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                by {source.authors.join(', ')}
                              </p>
                            )}
                            {source.doi && (
                              <p className="text-xs text-blue-600 mt-1">
                                DOI: {source.doi}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant={getSimilarityVariant(source.similarity * 100)}>
                              {(source.similarity * 100).toFixed(1)}%
                            </Badge>
                            {source.url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={source.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {source.matchedWords} of {source.totalWords} words matched
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="matches" className="space-y-4">
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {report.textMatches.map((match, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant={getSimilarityVariant(match.similarity * 100)}>
                              {(match.similarity * 100).toFixed(1)}% Match
                            </Badge>
                            {match.sourceTitle && (
                              <span className="text-xs text-muted-foreground">
                                from {match.sourceTitle}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Your Text:</div>
                              <div className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                                {match.originalText}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Similar Text:</div>
                              <div className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded">
                                {match.matchedText}
                              </div>
                            </div>
                          </div>

                          {match.sourceUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={match.sourceUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Source
                              </a>
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
