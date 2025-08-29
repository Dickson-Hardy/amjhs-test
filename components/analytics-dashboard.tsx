"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Calendar,
  Target,
  Activity
} from "lucide-react"

interface AnalyticsData {
  overview: {
    totalManuscripts: number
    totalUsers: number
    totalReviews: number
    averageReviewTime: number
    acceptanceRate: number
    rejectionRate: number
  }
  submissions: {
    daily: Array<{ date: string; count: number }>
    monthly: Array<{ month: string; count: number }>
    byCategory: Array<{ category: string; count: number }>
    byStatus: Array<{ status: string; count: number }>
  }
  performance: {
    reviewTimes: Array<{ stage: string; averageDays: number; targetDays: number }>
    editorWorkload: Array<{ editor: string; assigned: number; completed: number; pending: number }>
    reviewerPerformance: Array<{ reviewer: string; completed: number; averageTime: number; qualityScore: number }>
  }
  trends: {
    submissionGrowth: Array<{ period: string; submissions: number; reviews: number; publications: number }>
    categoryTrends: Array<{ category: string; trend: "up" | "down" | "stable"; change: number }>
    qualityMetrics: Array<{ metric: string; current: number; previous: number; change: number }>
  }
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData
  isLoading?: boolean
  onExport?: (type: string) => void
  onRefresh?: () => void
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
}

export function AnalyticsDashboard({
  data,
  isLoading = false,
  onExport,
  onRefresh,
  timeRange = "30d",
  onTimeRangeChange
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      "under_review": "bg-yellow-100 text-yellow-800",
      "revision_requested": "bg-orange-100 text-orange-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      published: "bg-purple-100 text-purple-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-500">Analytics data will appear here once available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive insights into your journal's performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onExport?.("pdf")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Manuscripts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalManuscripts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((data.overview.totalManuscripts * 0.12))} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((data.overview.totalUsers * 0.08))} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Target: 25%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.averageReviewTime} days</div>
            <p className="text-xs text-muted-foreground">
              Target: 21 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Status Distribution</CardTitle>
                <CardDescription>Current status of all manuscripts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.submissions.byStatus.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(status.status)}>
                          {status.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <span className="font-medium">{status.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Submissions by research category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.submissions.byCategory.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <span className="capitalize">{category.category.replace("_", " ")}</span>
                      <span className="font-medium">{category.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Submissions</CardTitle>
                <CardDescription>Submission volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.submissions.daily.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(day.count / Math.max(...data.submissions.daily.map(d => d.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Submission patterns by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.submissions.monthly.slice(-6).map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{month.month}</span>
                      <span className="font-medium">{month.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Performance</CardTitle>
                <CardDescription>Average review times by stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.reviewTimes.map((stage) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{stage.stage.replace("_", " ")}</span>
                        <span className="font-medium">{stage.averageDays} days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${stage.averageDays <= stage.targetDays ? 'bg-green-600' : 'bg-red-600'}`}
                          style={{ width: `${Math.min((stage.averageDays / stage.targetDays) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Target: {stage.targetDays} days</span>
                        <span>{stage.averageDays <= stage.targetDays ? 'On Track' : 'Overdue'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Editor Workload</CardTitle>
                <CardDescription>Current assignment distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.performance.editorWorkload.slice(0, 5).map((editor) => (
                    <div key={editor.editor} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{editor.editor}</span>
                        <span className="text-gray-600">{editor.assigned} total</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {editor.completed} completed
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          {editor.pending} pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Trends</CardTitle>
                <CardDescription>Research area popularity changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.trends.categoryTrends.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(category.trend)}
                        <span className="capitalize">{category.category.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getTrendColor(category.trend)}`}>
                          {category.change > 0 ? '+' : ''}{category.change}%
                        </span>
                        <Badge variant="outline" className={getTrendColor(category.trend)}>
                          {category.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>Performance indicators over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.trends.qualityMetrics.map((metric) => (
                    <div key={metric.metric} className="flex items-center justify-between">
                      <span className="text-sm">{metric.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.current}</span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(metric.change > 0 ? "up" : metric.change < 0 ? "down" : "stable")}
                          <span className={`text-xs ${getTrendColor(metric.change > 0 ? "up" : metric.change < 0 ? "down" : "stable")}`}>
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
