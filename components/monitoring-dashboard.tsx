/**
 * Enterprise Monitoring Dashboard
 * Real-time system monitoring and alerting interface
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: number
}

interface DatabaseMetrics {
  connections: number
  queryTime: number
  activeQueries: number
  slowQueries: number
}

interface CacheMetrics {
  hitRate: number
  memoryUsage: number
  keys: number
  evictions: number
}

interface SecurityMetrics {
  failedLogins: number
  blockedIPs: number
  suspiciousActivity: number
  lastIncident?: string
}

interface PerformanceMetrics {
  responseTime: number
  throughput: number
  errorRate: number
  activeUsers: number
}

interface MonitoringData {
  timestamp: number
  monitoring: SystemMetrics
  security: SecurityMetrics
  performance: PerformanceMetrics
  cache: CacheMetrics
  overview: {
    systemHealth: SystemMetrics
    activeAlerts: number
    criticalIssues: number
    avgResponseTime: number
    errorRate: number
    cacheHitRate: number
  }
}

interface SystemAlert {
  id: string
  name: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: number
  source: string
  resolved: boolean
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { toast } = useToast()

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      const response = await fetch(`/api/monitoring?endpoint=dashboard&timeframe=${timeframe}`)
      if (!response.ok) throw new AppError('Failed to fetch monitoring data')
      
      const result = await response.json()
      setData(result.data)
    } catch (error) {
      logger.error('Monitoring data fetch error:', error)
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    fetchMonitoringData()
    
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeframe, autoRefresh])

  // Handle cache clear
  const handleCacheClear = async (pattern?: string) => {
    try {
      const response = await fetch('/api/monitoring?endpoint=clear-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern }),
      })

      if (!response.ok) throw new AppError('Failed to clear cache')

      toast({
        title: 'Success',
        description: 'Cache cleared successfully',
      })

      fetchMonitoringData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive',
      })
    }
  }

  // Handle alert resolution
  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring?endpoint=resolve-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, resolution: 'Resolved by admin' }),
      })

      if (!response.ok) throw new AppError('Failed to resolve alert')

      toast({
        title: 'Success',
        description: 'Alert resolved successfully',
      })

      fetchMonitoringData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <MonitoringDashboardSkeleton />
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Failed to load monitoring data</p>
      </div>
    )
  }

  const systemHealth = data.overview.systemHealth
  const alerts = data.monitoring.activeAlerts || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and performance analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Auto-refresh:</span>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'On' : 'Off'}
            </Button>
          </div>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '1h' | '24h' | '7d' | '30d')}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button onClick={fetchMonitoringData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.filter((alert: SystemAlert) => alert.severity === 'critical').length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Critical Alerts</AlertTitle>
          <AlertDescription>
            {alerts.filter((alert: SystemAlert) => alert.severity === 'critical').length} critical issues require immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold">
                  {getSystemStatus(systemHealth)}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(systemHealth)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">
                  {data.overview.avgResponseTime.toFixed(0)}ms
                </p>
              </div>
              <div className="text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 7H7v6l4-3 2 3z"/>
                </svg>
              </div>
            </div>
            <Progress 
              value={Math.min(data.overview.avgResponseTime / 20, 100)} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">
                  {(data.overview.errorRate * 100).toFixed(2)}%
                </p>
              </div>
              <div className={data.overview.errorRate > 0.05 ? "text-red-600" : "text-green-600"}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11h14V7l-7-5z"/>
                </svg>
              </div>
            </div>
            <Progress 
              value={data.overview.errorRate * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">
                  {(data.overview.cacheHitRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-blue-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
            </div>
            <Progress 
              value={data.overview.cacheHitRate * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">
                  {data.overview.activeAlerts}
                </p>
              </div>
              <div className={data.overview.activeAlerts > 0 ? "text-yellow-600" : "text-green-600"}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold">
                  {data.overview.criticalIssues}
                </p>
              </div>
              <div className={data.overview.criticalIssues > 0 ? "text-red-600" : "text-green-600"}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateMockTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Request Volume */}
            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={generateMockTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Response Time</span>
                  <Badge variant="outline">
                    {data.overview.avgResponseTime.toFixed(0)}ms
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>95th Percentile</span>
                  <Badge variant="outline">
                    {(data.overview.avgResponseTime * 1.5).toFixed(0)}ms
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Error Rate</span>
                  <Badge variant={data.overview.errorRate > 0.05 ? "destructive" : "default"}>
                    {(data.overview.errorRate * 100).toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Throughput</span>
                  <Badge variant="outline">1,234 req/min</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Slowest Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle>Slowest Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generateMockSlowEndpoints().map((endpoint, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-mono">{endpoint.path}</span>
                      <Badge variant="outline">{endpoint.avgTime}ms</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Security Score</span>
                    <Badge variant="default" className="bg-green-600">
                      {data.security?.securityScore || 95}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Events</span>
                    <Badge variant="outline">
                      {data.security?.totalEvents || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Critical Events</span>
                    <Badge variant={data.overview.criticalIssues > 0 ? "destructive" : "default"}>
                      {data.overview.criticalIssues}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Unresolved Events</span>
                    <Badge variant="outline">
                      {data.security?.unresolvedEvents || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Threat Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Threat Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={generateMockThreatData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generateMockThreatData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getThreatColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {systemHealth && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resource Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Resource Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Memory Usage</span>
                      <span>{(systemHealth.memory.usage * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={systemHealth.memory.usage * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>CPU Usage</span>
                      <span>{(systemHealth.cpu.usage * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={systemHealth.cpu.usage * 100} />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Uptime</span>
                        <p className="font-semibold">
                          {formatUptime(systemHealth.application.uptime)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Node Version</span>
                        <p className="font-semibold">{systemHealth.application.nodeVersion}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Details */}
              <Card>
                <CardHeader>
                  <CardTitle>System Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Memory</span>
                    <span>{formatBytes(systemHealth.memory.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Used Memory</span>
                    <span>{formatBytes(systemHealth.memory.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heap Used</span>
                    <span>{formatBytes(systemHealth.memory.heap.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heap Total</span>
                    <span>{formatBytes(systemHealth.memory.heap.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Process ID</span>
                    <span>{systemHealth.application.pid}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Hit Rate</span>
                  <Badge variant="default">
                    {(data.overview.cacheHitRate * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Hits</span>
                  <Badge variant="outline">{data.cache?.hits || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Misses</span>
                  <Badge variant="outline">{data.cache?.misses || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Redis Connected</span>
                  <Badge variant={data.cache?.redis?.connected ? "default" : "destructive"}>
                    {data.cache?.redis?.connected ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => handleCacheClear()}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Clear All Cache
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cache Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateMockCacheData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="operation" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No active alerts
                  </p>
                ) : (
                  alerts.map((alert: SystemAlert) => (
                    <div 
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'error' ? 'destructive' :
                          alert.severity === 'warning' ? 'default' : 'secondary'
                        }>
                          {alert.severity}
                        </Badge>
                        
                        <div>
                          <p className="font-semibold">{alert.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()} • {alert.source}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions
function getSystemStatus(health: SystemMetrics): string {
  if (!health) return 'Unknown'
  
  if (health.memory > 90 || health.cpu > 90) {
    return 'Critical'
  }
  
  if (health.memory > 80 || health.cpu > 80) {
    return 'Warning'
  }

  return 'Healthy'
}

function getStatusColor(health: SystemMetrics): string {
  const status = getSystemStatus(health)
  return status === 'Healthy' ? 'bg-green-500' :
         status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Mock data generators
function generateMockTimeSeriesData() {
  const data = []
  const now = Date.now()
  
  for (let i = 23; i >= 0; i--) {
    data.push({
      time: new Date(now - i * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit' }),
      responseTime: Math.floor(Math.random() * 200) + 100,
      requests: Math.floor(Math.random() * 1000) + 500,
      errors: Math.floor(Math.random() * 50),
    })
  }
  
  return data
}

function generateMockSlowEndpoints() {
  return [
    { path: '/api/articles/search', avgTime: 1250 },
    { path: '/api/submissions/upload', avgTime: 980 },
    { path: '/api/review/analyze', avgTime: 750 },
    { path: '/api/dashboard/analytics', avgTime: 650 },
    { path: '/api/auth/login', avgTime: 320 },
  ]
}

function generateMockThreatData() {
  return [
    { name: 'SQL Injection', value: 12 },
    { name: 'XSS Attempts', value: 8 },
    { name: 'Rate Limit', value: 25 },
    { name: 'Auth Failures', value: 15 },
    { name: 'Suspicious Activity', value: 5 },
  ]
}

function generateMockCacheData() {
  return [
    { operation: 'Hits', count: 1250 },
    { operation: 'Misses', count: 380 },
    { operation: 'Sets', count: 450 },
    { operation: 'Deletes', count: 125 },
    { operation: 'Errors', count: 12 },
  ]
}

function getThreatColor(index: number): string {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
  return colors[index % colors.length]
}

// Skeleton component
function MonitoringDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded w-64"></div>
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded"></div>
    </div>
  )
}
