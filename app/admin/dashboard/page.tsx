"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import RouteGuard from "@/components/route-guard"
import BackupManagement from "@/components/admin/BackupManagement"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  FileText,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  UserPlus,
  BookOpen,
  Globe,
  Zap,
  Shield,
  Bell,
  Settings
} from "lucide-react"

interface DashboardStats {
  totalUsers: number
  totalArticles: number
  pendingReviews: number
  publishedThisMonth: number
  systemHealth: number
  activeReviewers: number
  pendingApplications: number
  monthlyGrowth: number
}

export default function ModernAdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalArticles: 0,
    pendingReviews: 0,
    publishedThisMonth: 0,
    systemHealth: 0,
    activeReviewers: 0,
    pendingApplications: 0,
    monthlyGrowth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      if (session?.user?.role !== "admin") return

      try {
        const response = await fetch("/api/admin/dashboard-stats")
        const data = await response.json()
        
        if (data.success) {
          setStats(data.stats)
        } else {
          // Keep default empty state
          setStats({
            totalUsers: 0,
            totalArticles: 0,
            pendingReviews: 0,
            publishedThisMonth: 0,
            systemHealth: 0,
            activeReviewers: 0,
            pendingApplications: 0,
            monthlyGrowth: 0,
          })
        }
      } catch (error) {
        logger.error("Error fetching dashboard data:", error)
        // Keep default empty state on error
        setStats({
          totalUsers: 0,
          totalArticles: 0,
          pendingReviews: 0,
          publishedThisMonth: 0,
          systemHealth: 0,
          activeReviewers: 0,
          pendingApplications: 0,
          monthlyGrowth: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [session])

  return (
    <RouteGuard allowedRoles={["admin"]}>
      <div>
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {session?.user?.name || 'Administrator'}
              </h1>
              <p className="text-gray-600">
                Here's what's happening with your journal today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">+{stats.monthlyGrowth}%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Published Articles</CardTitle>
              <BookOpen className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalArticles}</div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-green-600 font-medium">+{stats.publishedThisMonth}</span>
                <span className="text-sm text-gray-500 ml-1">this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.pendingReviews}</div>
              <div className="flex items-center mt-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mr-1" />
                <span className="text-sm text-orange-600 font-medium">Requires attention</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
              <Activity className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.systemHealth}%</div>
              <Progress value={stats.systemHealth} className="mt-2" />
              <span className="text-sm text-green-600 font-medium">Excellent</span>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="content">Content Analytics</TabsTrigger>
            <TabsTrigger value="reviews">Review Process</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="backup">Backup Management</TabsTrigger>
            <TabsTrigger value="coi">COI Management</TabsTrigger>
            <TabsTrigger value="time-limits">Time Limits</TabsTrigger>
            <TabsTrigger value="workflow">Workflow Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest system activities and updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">New user registration</p>
                      <p className="text-xs text-gray-500">Dr. Sarah Martinez joined as reviewer</p>
                      <p className="text-xs text-gray-400">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Manuscript submitted</p>
                      <p className="text-xs text-gray-500">"IoT in Healthcare" by Dr. Kim</p>
                      <p className="text-xs text-gray-400">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Review completed</p>
                      <p className="text-xs text-gray-500">MS-2024-0156 reviewed by Dr. Chen</p>
                      <p className="text-xs text-gray-400">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Article published</p>
                      <p className="text-xs text-gray-500">"Smart Medical Devices" went live</p>
                      <p className="text-xs text-gray-400">3 hours ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/admin/users')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/admin/submissions')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Review Submissions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/admin/reviewers')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Approve Reviewers
                    {stats.pendingApplications > 0 && (
                      <Badge className="ml-auto bg-orange-100 text-orange-700">
                        {stats.pendingApplications}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/admin/analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Review Efficiency</CardTitle>
                  <CardDescription>Average review completion time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">18.5 days</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">2.3 days faster than target</span>
                  </div>
                  <Progress value={85} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Author Satisfaction</CardTitle>
                  <CardDescription>Feedback from authors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">4.7/5</div>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">Excellent rating</span>
                  </div>
                  <Progress value={94} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Publication Rate</CardTitle>
                  <CardDescription>Acceptance to publication ratio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">73%</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-sm text-purple-600">Above industry average</span>
                  </div>
                  <Progress value={73} className="mt-3" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                      <p className="text-sm text-gray-600">Total Users</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.activeReviewers}</p>
                      <p className="text-sm text-gray-600">Active Reviewers</p>
                    </div>
                    <Eye className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</p>
                      <p className="text-sm text-gray-600">Pending Applications</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">89%</p>
                      <p className="text-sm text-gray-600">User Satisfaction</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Management Actions</CardTitle>
                <CardDescription>Manage users and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => router.push('/admin/users')}
                  >
                    <Users className="h-6 w-6 mb-2" />
                    View All Users
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => router.push('/admin/reviewers')}
                  >
                    <UserPlus className="h-6 w-6 mb-2" />
                    Manage Reviewers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalArticles}</p>
                      <p className="text-sm text-gray-600">Total Articles</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.publishedThisMonth}</p>
                      <p className="text-sm text-gray-600">Published This Month</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">12.5K</p>
                      <p className="text-sm text-gray-600">Monthly Views</p>
                    </div>
                    <Globe className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Manage articles and publications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => router.push('/admin/submissions')}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    Review Submissions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => router.push('/admin/analytics')}
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Content Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{stats.pendingReviews}</p>
                      <p className="text-sm text-gray-600">Pending Reviews</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">18.5</p>
                      <p className="text-sm text-gray-600">Avg Review Days</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">94%</p>
                      <p className="text-sm text-gray-600">Review Quality</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-600" />
                    System Health: {stats.systemHealth}%
                  </CardTitle>
                  <CardDescription>All systems operational</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={stats.systemHealth} className="mb-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Database Performance</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">Excellent</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">API Response Time</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">125ms</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Storage Usage</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">78%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Actions</CardTitle>
                  <CardDescription>Administrative system controls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="justify-start">
                      <Activity className="h-4 w-4 mr-2" />
                      View System Logs
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Globe className="h-4 w-4 mr-2" />
                      Database Backup
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Zap className="h-4 w-4 mr-2" />
                      Performance Optimization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <BackupManagement />
          </TabsContent>

          <TabsContent value="coi" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Conflict of Interest Management</h2>
              <Button>
                <Shield className="h-4 w-4 mr-2" />
                COI Overview
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    COI Declarations
                  </CardTitle>
                  <CardDescription>Monitor conflict of interest declarations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Declarations</span>
                    <span className="font-semibold text-xl text-blue-600">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conflicts Detected</span>
                    <span className="font-semibold text-xl text-red-600">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Review</span>
                    <span className="font-semibold text-xl text-orange-600">8</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    View All Declarations
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    COI Alerts
                  </CardTitle>
                  <CardDescription>Recent conflict of interest alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">High Conflict Risk</p>
                        <p className="text-xs text-gray-600">Dr. Smith - MS-2024-0123</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Conflict Confirmed</p>
                        <p className="text-xs text-gray-600">Dr. Johnson - MS-2024-0118</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View All Alerts
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="time-limits" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Time Limit Configuration</h2>
              <Button>
                <Clock className="h-4 w-4 mr-2" />
                Configure Limits
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Current Time Limits
                  </CardTitle>
                  <CardDescription>Configure workflow stage deadlines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm font-medium">Editorial Assistant Review</span>
                      <Badge variant="outline">3 days</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-sm font-medium">Associate Editor Review</span>
                      <Badge variant="outline">7 days</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium">Reviewer Review</span>
                      <Badge variant="outline">21 days</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Time Limits
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-green-600" />
                    Reminder Settings
                  </CardTitle>
                  <CardDescription>Automated reminder configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium">Pre-deadline Reminders</span>
                      <Badge variant="outline">1, 2, 3 days</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <span className="text-sm font-medium">Escalation Alerts</span>
                      <Badge variant="outline">1, 2, 3 days</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Bell className="h-4 w-4 mr-2" />
                    Configure Reminders
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Workflow Automation</h2>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Configure Automation
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-600" />
                    Automated Triggers
                  </CardTitle>
                  <CardDescription>Configure automated workflow actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm font-medium">Auto-assign Reviewers</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-sm font-medium">Deadline Reminders</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium">Status Updates</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Triggers
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-600" />
                    Workflow Analytics
                  </CardTitle>
                  <CardDescription>Monitor automated workflow performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Automation Success Rate</span>
                      <span className="font-semibold text-xl text-green-600">98.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Time Saved</span>
                      <span className="font-semibold text-xl text-blue-600">45 hrs/month</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Error Rate</span>
                      <span className="font-semibold text-xl text-red-600">1.5%</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RouteGuard>
  )
}
