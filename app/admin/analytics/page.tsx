"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AdminLayout from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  CheckCircle,
  Download,
  Eye,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react"

interface AnalyticsData {
  submissionStats: {
    total: number
    thisMonth: number
    growth: number
    byCategory: Array<{ name: string; value: number }>
    monthlyTrend: Array<{ month: string; submissions: number; published: number }>
  }
  userStats: {
    total: number
    active: number
    newThisMonth: number
    byRole: Array<{ role: string; count: number }>
  }
  reviewStats: {
    averageTime: number
    completionRate: number
    onTimeRate: number
    monthlyReviews: Array<{ month: string; completed: number; pending: number }>
  }
  publicationStats: {
    published: number
    inPress: number
    avgTimeToPublication: number
    citationMetrics: {
      totalCitations: number
      hIndex: number
      impactFactor: number
    }
  }
  systemUsage: {
    dailyActiveUsers: Array<{ date: string; users: number }>
    pageViews: number
    downloads: number
    topPages: Array<{ page: string; views: number }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658']

export default function AdminAnalyticsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {change > 0 ? '+' : ''}{change}% from last period
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
        <AdminLayout>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
      <AdminLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-600 mt-2">Comprehensive system metrics and insights</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Submissions"
              value={analyticsData.submissionStats.total}
              change={analyticsData.submissionStats.growth}
              icon={FileText}
              trend={analyticsData.submissionStats.growth > 0 ? 'up' : 'down'}
            />
            <StatCard
              title="Active Users"
              value={analyticsData.userStats.active}
              change={12}
              icon={Users}
              trend="up"
            />
            <StatCard
              title="Avg Review Time"
              value={`${analyticsData.reviewStats.averageTime} days`}
              change={-8}
              icon={Clock}
              trend="up"
            />
            <StatCard
              title="Publications"
              value={analyticsData.publicationStats.published}
              change={15}
              icon={CheckCircle}
              trend="up"
            />
          </div>
        )}

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Submissions Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.submissionStats.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="submissions" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="published" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submissions by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData?.submissionStats.byCategory || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData?.submissionStats.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData?.reviewStats.completionRate}%</div>
                    <div className="text-sm text-gray-600">Review Completion Rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analyticsData?.publicationStats.citationMetrics.impactFactor}</div>
                    <div className="text-sm text-gray-600">Impact Factor</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{analyticsData?.publicationStats.avgTimeToPublication} days</div>
                    <div className="text-sm text-gray-600">Avg. Time to Publication</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analyticsData?.submissionStats.monthlyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="submissions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="published" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Users by Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData?.userStats.byRole || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="role" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{analyticsData?.userStats.total}</div>
                    <div className="text-lg text-gray-600 mb-4">Total Registered Users</div>
                    <div className="text-2xl font-semibold text-green-600 mb-1">+{analyticsData?.userStats.newThisMonth}</div>
                    <div className="text-sm text-gray-500">New users this month</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData?.reviewStats.monthlyReviews || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#82ca9d" />
                    <Bar dataKey="pending" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.systemUsage.dailyActiveUsers || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Usage Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Page Views</span>
                      <span className="font-semibold">{analyticsData?.systemUsage.pageViews.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Downloads</span>
                      <span className="font-semibold">{analyticsData?.systemUsage.downloads.toLocaleString()}</span>
                    </div>
                    <div className="pt-4">
                      <h4 className="font-medium mb-2">Top Pages</h4>
                      {analyticsData?.systemUsage.topPages.map((page, index) => (
                        <div key={index} className="flex justify-between items-center py-1">
                          <span className="text-sm">{page.page}</span>
                          <span className="text-sm font-medium">{page.views}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </RouteGuard>
  )
}