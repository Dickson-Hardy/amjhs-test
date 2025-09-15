"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import EditorLayout from "@/components/layouts/editor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Calendar,
  Target,
} from "lucide-react"

interface EditorMetrics {
  totalSubmissions: number
  acceptedSubmissions: number
  rejectedSubmissions: number
  underReview: number
  averageReviewTime: number
  acceptanceRate: number
  publicationsThisYear: number
  citationImpact: number
  reviewerSatisfaction: number
  timeToPublication: number
}

interface MonthlyData {
  month: string
  submissions: number
  decisions: number
  publications: number
}

export default function EditorReportsPage() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<EditorMetrics>({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    rejectedSubmissions: 0,
    underReview: 0,
    averageReviewTime: 0,
    acceptanceRate: 0,
    publicationsThisYear: 0,
    citationImpact: 0,
    reviewerSatisfaction: 0,
    timeToPublication: 0
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("year")

  useEffect(() => {
    fetchMetrics()
    fetchMonthlyData()
  }, [selectedPeriod])

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/editor/stats?period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics || {
          totalSubmissions: 0,
          acceptedSubmissions: 0,
          rejectedSubmissions: 0,
          underReview: 0,
          averageReviewTime: 0,
          acceptanceRate: 0,
          publicationsThisYear: 0,
          citationImpact: 0,
          reviewerSatisfaction: 0,
          timeToPublication: 0
        })
      } else {
        console.error('Failed to fetch metrics')
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyData = async () => {
    try {
      const response = await fetch(`/api/editor/stats/monthly?period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        setMonthlyData(data.monthlyData || [])
      } else {
        console.error('Failed to fetch monthly data')
        setMonthlyData([])
      }
    } catch (error) {
      console.error("Error fetching monthly data:", error)
      setMonthlyData([])
    }
  }

  const exportData = (format: string) => {
    // TODO: Implement actual data export
    console.log(`Exporting data in ${format} format`)
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["editor", "admin"]}>
        <EditorLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editor", "admin"]}>
      <EditorLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editorial Analytics</h1>
              <p className="text-gray-600">Performance metrics and insights for editorial processes</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportData("csv")}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => exportData("pdf")}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="reviews">Review Process</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalSubmissions}</div>
                    <div className="text-sm text-gray-500">This year</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Acceptance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{metrics.acceptanceRate}%</div>
                    <Progress value={metrics.acceptanceRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Avg Review Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.averageReviewTime} days</div>
                    <div className="text-sm text-gray-500">Target: 21 days</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Publications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.publicationsThisYear}</div>
                    <div className="text-sm text-gray-500">This year</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Monthly Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Chart visualization placeholder</p>
                        <p className="text-sm text-gray-400">Submissions trend over time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Decision Outcomes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Accepted</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(metrics.acceptedSubmissions / metrics.totalSubmissions) * 100} className="w-20" />
                          <span className="text-sm font-medium">{metrics.acceptedSubmissions}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Rejected</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(metrics.rejectedSubmissions / metrics.totalSubmissions) * 100} className="w-20" />
                          <span className="text-sm font-medium">{metrics.rejectedSubmissions}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Under Review</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(metrics.underReview / metrics.totalSubmissions) * 100} className="w-20" />
                          <span className="text-sm font-medium">{metrics.underReview}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Submission Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">AI & Machine Learning</span>
                        <span className="text-sm font-medium">45</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Human-Computer Interaction</span>
                        <span className="text-sm font-medium">32</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Computer Security</span>
                        <span className="text-sm font-medium">28</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Software Engineering</span>
                        <span className="text-sm font-medium">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Data Science</span>
                        <span className="text-sm font-medium">19</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Other</span>
                        <span className="text-sm font-medium">8</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Submission Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">This Month</span>
                        <Badge variant="secondary">16 submissions</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Last Month</span>
                        <Badge variant="outline">19 submissions</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Growth Rate</span>
                        <Badge className="bg-red-100 text-red-800">-15.8%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Yearly Average</span>
                        <Badge variant="secondary">15.2/month</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Seasonal Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Spring (Mar-May)</span>
                        <span className="text-sm font-medium">48 submissions</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Summer (Jun-Aug)</span>
                        <span className="text-sm font-medium">49 submissions</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Fall (Sep-Nov)</span>
                        <span className="text-sm font-medium">40 submissions</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Winter (Dec-Feb)</span>
                        <span className="text-sm font-medium">39 submissions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Review Timeline Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Average Review Time</span>
                        <span className="text-sm font-medium">{metrics.averageReviewTime} days</span>
                      </div>
                      <Progress value={(21 - metrics.averageReviewTime) / 21 * 100} />
                      <p className="text-xs text-gray-500 mt-1">Target: 21 days</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Time to Publication</span>
                        <span className="text-sm font-medium">{metrics.timeToPublication} days</span>
                      </div>
                      <Progress value={75} />
                      <p className="text-xs text-gray-500 mt-1">Target: 60 days</p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Reviewer Response Rate</span>
                        <span className="text-sm font-medium">89%</span>
                      </div>
                      <Progress value={89} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Reviewer Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Average Rating</span>
                        <span className="text-sm font-medium">{metrics.reviewerSatisfaction}/5.0</span>
                      </div>
                      <Progress value={(metrics.reviewerSatisfaction / 5) * 100} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">On-Time Completion</span>
                        <span className="text-sm font-medium">87%</span>
                      </div>
                      <Progress value={87} />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Active Reviewers</span>
                        <span className="text-sm font-medium">24</span>
                      </div>
                      <Progress value={80} />
                      <p className="text-xs text-gray-500 mt-1">Target: 30 reviewers</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Review Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">92%</div>
                      <p className="text-sm text-gray-600">Completed Reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">4.2</div>
                      <p className="text-sm text-gray-600">Avg Quality Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">6.5h</div>
                      <p className="text-sm text-gray-600">Avg Time Spent</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">95%</div>
                      <p className="text-sm text-gray-600">Reviewer Retention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Impact Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Citation Impact Factor</span>
                        <span className="text-sm font-medium">{metrics.citationImpact}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">H-Index</span>
                        <span className="text-sm font-medium">34</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Downloads This Year</span>
                        <span className="text-sm font-medium">12,450</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">International Authors</span>
                        <span className="text-sm font-medium">67%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Editorial Efficiency
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Decision Speed</span>
                        <Badge className="bg-green-100 text-green-800">Fast</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Backlog Size</span>
                        <Badge variant="secondary">25 manuscripts</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Editor Workload</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-sm">Issue Frequency</span>
                        <Badge className="bg-green-100 text-green-800">On Schedule</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Comparative Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">vs. Journal Average</span>
                        <span className="text-sm font-medium text-green-600">+12% faster</span>
                      </div>
                      <Progress value={68} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">vs. Field Standard</span>
                        <span className="text-sm font-medium text-green-600">+8% acceptance rate</span>
                      </div>
                      <Progress value={72} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Quality Score</span>
                        <span className="text-sm font-medium">4.5/5.0</span>
                      </div>
                      <Progress value={90} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </EditorLayout>
    </RouteGuard>
  )
}