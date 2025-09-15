"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AdminLayout from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Zap,
  Database,
  Server,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi
} from "lucide-react"

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  description: string
}

interface SystemHealth {
  overall: number
  database: number
  api: number
  storage: number
  memory: number
}

export default function PerformancePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 0,
    database: 0,
    api: 0,
    storage: 0,
    memory: 0
  })
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [timeRange, setTimeRange] = useState("24h")

  useEffect(() => {
    fetchPerformanceData()
  }, [timeRange])

  const fetchPerformanceData = async () => {
    try {
      // Mock performance data - replace with actual API calls
      const mockMetrics: PerformanceMetric[] = [
        {
          name: "Database Query Time",
          value: 45,
          unit: "ms",
          status: "good",
          trend: "down",
          description: "Average database query response time"
        },
        {
          name: "API Response Time",
          value: 125,
          unit: "ms",
          status: "good",
          trend: "stable",
          description: "Average API endpoint response time"
        },
        {
          name: "Memory Usage",
          value: 78,
          unit: "%",
          status: "warning",
          trend: "up",
          description: "Current memory utilization"
        },
        {
          name: "CPU Usage",
          value: 35,
          unit: "%",
          status: "good",
          trend: "stable",
          description: "Current CPU utilization"
        },
        {
          name: "Storage Usage",
          value: 67,
          unit: "%",
          status: "good",
          trend: "up",
          description: "Database storage utilization"
        },
        {
          name: "Active Connections",
          value: 23,
          unit: "connections",
          status: "good",
          trend: "stable",
          description: "Current active database connections"
        }
      ]

      const mockHealth: SystemHealth = {
        overall: 87,
        database: 92,
        api: 85,
        storage: 78,
        memory: 76
      }

      setMetrics(mockMetrics)
      setSystemHealth(mockHealth)
    } catch (error) {
      toast.error("Failed to load performance data")
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizePerformance = async (optimizationType: string) => {
    setOptimizing(true)
    try {
      // Mock optimization process - replace with actual API calls
      console.log('Running optimization:', optimizationType)

      // Simulate optimization delay
      await new Promise(resolve => setTimeout(resolve, 3000))

      toast.success(`${optimizationType} optimization completed successfully!`)

      // Refresh performance data
      fetchPerformanceData()

    } catch (error) {
      toast.error(`Failed to optimize ${optimizationType}`)
      console.error('Error optimizing performance:', error)
    } finally {
      setOptimizing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-600" />
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getHealthColor = (value: number) => {
    if (value >= 90) return 'text-green-600'
    if (value >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Optimization</h1>
              <p className="text-gray-600">Monitor and optimize system performance</p>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => router.push('/admin/dashboard')}>
                <Activity className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{systemHealth.overall}%</p>
                    <p className="text-sm text-gray-600">Overall Health</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <Progress value={systemHealth.overall} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${getHealthColor(systemHealth.database)}`}>
                      {systemHealth.database}%
                    </p>
                    <p className="text-sm text-gray-600">Database</p>
                  </div>
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <Progress value={systemHealth.database} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${getHealthColor(systemHealth.api)}`}>
                      {systemHealth.api}%
                    </p>
                    <p className="text-sm text-gray-600">API</p>
                  </div>
                  <Server className="h-8 w-8 text-blue-600" />
                </div>
                <Progress value={systemHealth.api} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${getHealthColor(systemHealth.storage)}`}>
                      {systemHealth.storage}%
                    </p>
                    <p className="text-sm text-gray-600">Storage</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-purple-600" />
                </div>
                <Progress value={systemHealth.storage} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${getHealthColor(systemHealth.memory)}`}>
                      {systemHealth.memory}%
                    </p>
                    <p className="text-sm text-gray-600">Memory</p>
                  </div>
                  <Cpu className="h-8 w-8 text-orange-600" />
                </div>
                <Progress value={systemHealth.memory} className="mt-3" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="metrics" className="space-y-6">
            <TabsList>
              <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
              <TabsTrigger value="optimization">Optimization Tools</TabsTrigger>
              <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-6">
              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metrics.map((metric, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {metric.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(metric.status)}
                        {getTrendIcon(metric.trend)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {metric.value}{metric.unit}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {metric.description}
                      </p>
                      {metric.unit === '%' && (
                        <Progress value={metric.value} className="mt-3" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">Database Performance Improved</p>
                          <p className="text-sm text-green-700">Query time reduced by 15% this week</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">+15%</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-900">Memory Usage Increasing</p>
                          <p className="text-sm text-yellow-700">Memory utilization up 8% in last 24 hours</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">+8%</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">API Response Stable</p>
                          <p className="text-sm text-blue-700">Response times remain consistent</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">Stable</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Database Optimization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="h-5 w-5 mr-2 text-blue-600" />
                      Database Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleOptimizePerformance('Database Indexes')}
                        disabled={optimizing}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rebuild Indexes
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleOptimizePerformance('Query Cache')}
                        disabled={optimizing}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Clear Query Cache
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleOptimizePerformance('Table Statistics')}
                        disabled={optimizing}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Update Statistics
                      </Button>
                    </div>

                    {optimizing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Optimizing...</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* System Optimization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Server className="h-5 w-5 mr-2 text-green-600" />
                      System Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleOptimizePerformance('Memory Cleanup')}
                        disabled={optimizing}
                      >
                        <Cpu className="h-4 w-4 mr-2" />
                        Memory Cleanup
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleOptimizePerformance('Cache Optimization')}
                        disabled={optimizing}
                      >
                        <HardDrive className="h-4 w-4 mr-2" />
                        Optimize Cache
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleOptimizePerformance('Log Rotation')}
                        disabled={optimizing}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rotate Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Optimization History */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Optimizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Database Index Rebuild</p>
                        <p className="text-sm text-gray-500">Completed 2 hours ago</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Success</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Cache Optimization</p>
                        <p className="text-sm text-gray-500">Completed 1 day ago</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Success</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Memory Cleanup</p>
                        <p className="text-sm text-gray-500">Completed 3 days ago</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Success</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real-time Monitoring */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-blue-600" />
                      Real-time Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Users</span>
                        <span className="font-semibold">23</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Sessions</span>
                        <span className="font-semibold">45</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Requests/min</span>
                        <span className="font-semibold">127</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Error Rate</span>
                        <span className="font-semibold text-green-600">0.1%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Resources */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Server className="h-5 w-5 mr-2 text-purple-600" />
                      System Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CPU Usage</span>
                          <span>35%</span>
                        </div>
                        <Progress value={35} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Memory Usage</span>
                          <span>78%</span>
                        </div>
                        <Progress value={78} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Disk Usage</span>
                          <span>67%</span>
                        </div>
                        <Progress value={67} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Network I/O</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts & Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-900">High Memory Usage</p>
                          <p className="text-sm text-yellow-700">Memory usage above 75% threshold</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">Database Performance</p>
                          <p className="text-sm text-green-700">All database metrics within normal range</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Normal</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}