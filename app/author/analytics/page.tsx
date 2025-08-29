"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  FileText,
  Eye,
  Download,
  Quote,
  Users,
  Calendar,
  Target,
  Star,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AuthorAnalytics {
  id: string
  totalPublications: number
  totalCitations: number
  hIndex: number
  i10Index: number
  averageCitationsPerPaper: number
  publicationTrend: PublicationTrend[]
  citationTrend: CitationTrend[]
  topPublications: TopPublication[]
  coAuthorNetwork: CoAuthor[]
  journalPerformance: JournalPerformance[]
  researchAreas: ResearchArea[]
  impactMetrics: ImpactMetrics
}

interface PublicationTrend {
  year: number
  publications: number
  citations: number
  downloads: number
}

interface CitationTrend {
  year: number
  citations: number
  selfCitations: number
  externalCitations: number
}

interface TopPublication {
  id: string
  title: string
  journal: string
  year: number
  citations: number
  downloads: number
  impactFactor: number
  doi: string
}

interface CoAuthor {
  id: string
  name: string
  institution: string
  collaborationCount: number
  totalCitations: number
  hIndex: number
}

interface JournalPerformance {
  journal: string
  publications: number
  totalCitations: number
  averageCitations: number
  impactFactor: number
}

interface ResearchArea {
  area: string
  publications: number
  citations: number
  percentage: number
}

interface ImpactMetrics {
  fieldWeightedCitationImpact: number
  relativeCitationRatio: number
  citationPercentile: number
  altmetricScore: number
  socialMediaMentions: number
}

export default function AuthorAnalyticsPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AuthorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<string>("5y")
  const [selectedMetric, setSelectedMetric] = useState<string>("citations")

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalytics()
    }
  }, [session?.user?.id, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/analytics?timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAnalytics(data.analytics)
        }
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <ArrowUp className="h-4 w-4 text-green-600" />
    } else if (current < previous) {
      return <ArrowDown className="h-4 w-4 text-red-600" />
    } else {
      return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) {
      return "text-green-600"
    } else if (current < previous) {
      return "text-red-600"
    } else {
      return "text-gray-600"
    }
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return "text-green-600"
    if (percentile >= 75) return "text-blue-600"
    if (percentile >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["author"]}>
        <AuthorLayout>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  if (!analytics) {
    return (
      <RouteGuard allowedRoles={["author"]}>
        <AuthorLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Analytics Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load your analytics data.</p>
            <Button onClick={fetchAnalytics}>Try Again</Button>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["author"]}>
      <AuthorLayout>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Publication Analytics</h1>
              <p className="text-slate-600">Track your research impact and publication metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="3y">3 Years</SelectItem>
                  <SelectItem value="5y">5 Years</SelectItem>
                  <SelectItem value="10y">10 Years</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Publications</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.totalPublications}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Citations</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.totalCitations}</p>
                </div>
                <Quote className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">H-Index</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.hIndex}</p>
                </div>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Citations/Paper</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {analytics.averageCitationsPerPaper.toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
            <TabsTrigger value="citations">Citations</TabsTrigger>
            <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
            <TabsTrigger value="impact">Impact Metrics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Publication Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Publication Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.publicationTrend.slice(-5).map((trend, index) => (
                      <div key={trend.year} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{trend.year}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-slate-600">
                            {trend.publications} papers
                          </span>
                          <span className="text-sm text-slate-600">
                            {trend.citations} citations
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Research Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Research Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.researchAreas.slice(0, 5).map((area) => (
                      <div key={area.area}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{area.area}</span>
                          <span className="text-sm text-slate-600">
                            {area.publications} papers
                          </span>
                        </div>
                        <Progress value={area.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Journal Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Journal Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Journal</th>
                        <th className="text-left py-2">Publications</th>
                        <th className="text-left py-2">Citations</th>
                        <th className="text-left py-2">Avg Citations</th>
                        <th className="text-left py-2">Impact Factor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.journalPerformance.map((journal) => (
                        <tr key={journal.journal} className="border-b">
                          <td className="py-2 font-medium">{journal.journal}</td>
                          <td className="py-2">{journal.publications}</td>
                          <td className="py-2">{journal.totalCitations}</td>
                          <td className="py-2">{journal.averageCitations.toFixed(1)}</td>
                          <td className="py-2">{journal.impactFactor.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publications Tab */}
          <TabsContent value="publications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Top Publications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPublications.map((publication) => (
                    <div key={publication.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 mb-2">
                            {publication.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                            <span>{publication.journal}</span>
                            <span>•</span>
                            <span>{publication.year}</span>
                            <span>•</span>
                            <span>IF: {publication.impactFactor.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Quote className="h-4 w-4" />
                              {publication.citations} citations
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              {publication.downloads} downloads
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Citations Tab */}
          <TabsContent value="citations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Citation Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Citation Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.citationTrend.slice(-5).map((trend) => (
                      <div key={trend.year} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{trend.year}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-slate-600">
                            {trend.citations} total
                          </span>
                          <span className="text-sm text-slate-600">
                            {trend.externalCitations} external
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Citation Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Citation Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">0-10 citations</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">11-50 citations</span>
                      <span className="text-sm font-medium">30%</span>
                    </div>
                    <Progress value={30} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">51-100 citations</span>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                    <Progress value={15} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">100+ citations</span>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Collaborations Tab */}
          <TabsContent value="collaborations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Co-Author Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.coAuthorNetwork.map((coAuthor) => (
                    <div key={coAuthor.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-900">{coAuthor.name}</h4>
                        <p className="text-sm text-slate-600">{coAuthor.institution}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {coAuthor.collaborationCount} collaborations
                        </div>
                        <div className="text-xs text-slate-500">
                          H-index: {coAuthor.hIndex}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Impact Metrics Tab */}
          <TabsContent value="impact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Advanced Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Advanced Impact Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Field-Weighted Citation Impact</span>
                    <span className="font-medium">{analytics.impactMetrics.fieldWeightedCitationImpact.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Relative Citation Ratio</span>
                    <span className="font-medium">{analytics.impactMetrics.relativeCitationRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Citation Percentile</span>
                    <span className={`font-medium ${getPercentileColor(analytics.impactMetrics.citationPercentile)}`}>
                      {analytics.impactMetrics.citationPercentile}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Altmetrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Altmetrics & Social Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Altmetric Score</span>
                    <span className="font-medium">{analytics.impactMetrics.altmetricScore}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Social Media Mentions</span>
                    <span className="font-medium">{analytics.impactMetrics.socialMediaMentions}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Your H-index of <strong>{analytics.hIndex}</strong> places you in the top 25% of researchers in your field.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your publications have been cited in <strong>{analytics.totalCitations}</strong> different papers, 
                      indicating strong research impact.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Consider focusing on high-impact journals to increase your citation rate and impact factor.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AuthorLayout>
    </RouteGuard>
  )
}
