/**
 * Advanced Features Dashboard
 * Central hub for AI, integrations, and collaboration features
 */

"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Database, 
  Users, 
  Zap, 
  TrendingUp, 
  FileSearch, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  BarChart3,
  Settings,
  Rocket
} from 'lucide-react'
import AIAssessmentDashboard from './ai-assessment-dashboard'
import ExternalIntegrationsDashboard from './external-integrations-dashboard'
import RealTimeCollaborationEditor from './real-time-collaboration-editor'
import { logger } from '@/lib/logger'

interface DashboardStats {
  aiAssessments: {
    total: number
    completed: number
    avgQualityScore: number
    trending: 'up' | 'down' | 'stable'
  }
  integrations: {
    orcidConnected: boolean
    doiRegistered: number
    crossrefSearches: number
    pubmedSearches: number
  }
  collaboration: {
    activeSessions: number
    totalParticipants: number
    commentsThisWeek: number
    versionsCreated: number
  }
  performance: {
    uptime: number
    responseTime: number
    errorRate: number
    cacheHitRate: number
  }
}

interface RecentActivity {
  id: string
  type: 'ai_assessment' | 'integration' | 'collaboration' | 'system'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
  metadata?: Record<string, any>
}

interface AdvancedFeaturesDashboardProps {
  manuscriptId?: string
  className?: string
}

export function AdvancedFeaturesDashboard({ manuscriptId, className }: AdvancedFeaturesDashboardProps) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (session?.user) {
      loadDashboardData()
    }
  }, [session])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load dashboard statistics
      await Promise.all([
        loadStats(),
        loadRecentActivity()
      ])
    } catch (error) {
      logger.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // In a real implementation, this would fetch from multiple APIs
      // For now, we'll use mock data
      const mockStats: DashboardStats = {
        aiAssessments: {
          total: 142,
          completed: 138,
          avgQualityScore: 84.5,
          trending: 'up'
        },
        integrations: {
          orcidConnected: true,
          doiRegistered: 23,
          crossrefSearches: 156,
          pubmedSearches: 89
        },
        collaboration: {
          activeSessions: 7,
          totalParticipants: 24,
          commentsThisWeek: 68,
          versionsCreated: 31
        },
        performance: {
          uptime: 99.8,
          responseTime: 1.2,
          errorRate: 0.1,
          cacheHitRate: 94.5
        }
      }

      setStats(mockStats)
    } catch (error) {
      logger.error('Failed to load stats:', error)
    }
  }

  const loadRecentActivity = async () => {
    try {
      // Mock recent activity data
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'ai_assessment',
          title: 'AI Assessment Completed',
          description: 'Manuscript "Advanced Neural Networks" received quality score of 89%',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'success',
          metadata: { qualityScore: 89, manuscriptId: 'ms-001' }
        },
        {
          id: '2',
          type: 'collaboration',
          title: 'New Collaboration Session',
          description: 'Dr. Sarah Johnson started a review session for manuscript MS-002',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'success',
          metadata: { sessionId: 'cs-001', participantCount: 3 }
        },
        {
          id: '3',
          type: 'integration',
          title: 'DOI Registered',
          description: 'DOI 10.1234/example.2024.001 successfully registered via DataCite',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'success',
          metadata: { doi: '10.1234/example.2024.001' }
        },
        {
          id: '4',
          type: 'integration',
          title: 'ORCID Profile Synced',
          description: 'Successfully synchronized profile data and 15 publications',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'success',
          metadata: { publicationsCount: 15 }
        },
        {
          id: '5',
          type: 'system',
          title: 'Performance Alert',
          description: 'API response time increased to 2.1s (threshold: 2.0s)',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'warning',
          metadata: { responseTime: 2.1 }
        }
      ]

      setRecentActivity(mockActivity)
    } catch (error) {
      logger.error('Failed to load recent activity:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ai_assessment':
        return Brain
      case 'integration':
        return Database
      case 'collaboration':
        return Users
      case 'system':
        return Settings
      default:
        return Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading advanced features dashboard...</span>
          </div>
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
            <Rocket className="h-5 w-5" />
            Advanced Features Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive overview of AI, integrations, and collaboration features
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai">AI Assessment</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">AI Assessments</p>
                      <p className="text-2xl font-bold">{stats.aiAssessments.completed}</p>
                      <p className="text-xs text-muted-foreground">
                        Avg Score: {stats.aiAssessments.avgQualityScore}%
                      </p>
                    </div>
                    <Brain className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="mt-3">
                    <Progress value={(stats.aiAssessments.completed / stats.aiAssessments.total) * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                      <p className="text-2xl font-bold">{stats.collaboration.activeSessions}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.collaboration.totalParticipants} participants
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mt-3">
                    <Progress value={75} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">DOIs Registered</p>
                      <p className="text-2xl font-bold">{stats.integrations.doiRegistered}</p>
                      <p className="text-xs text-muted-foreground">
                        ORCID: {stats.integrations.orcidConnected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                    <Database className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="mt-3">
                    <Progress value={stats.integrations.orcidConnected ? 100 : 50} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">System Health</p>
                      <p className="text-2xl font-bold">{stats.performance.uptime}%</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.performance.responseTime}s avg response
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="mt-3">
                    <Progress value={stats.performance.uptime} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Feature Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feature Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">AI Assessment Engine</p>
                      <p className="text-sm text-muted-foreground">Quality scoring & analysis</p>
                    </div>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">External Integrations</p>
                      <p className="text-sm text-muted-foreground">ORCID, CrossRef, DOI, PubMed</p>
                    </div>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Real-time Collaboration</p>
                      <p className="text-sm text-muted-foreground">Live editing & comments</p>
                    </div>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Performance Monitoring</p>
                      <p className="text-sm text-muted-foreground">Real-time metrics & alerts</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Beta
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentActivity.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <IconComponent className={`h-5 w-5 mt-0.5 ${getStatusColor(activity.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and operations for advanced features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('ai')}>
                  <Brain className="h-6 w-6" />
                  <span className="text-sm">AI Assessment</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('integrations')}>
                  <Database className="h-6 w-6" />
                  <span className="text-sm">Integrations</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('collaboration')}>
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Collaboration</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('analytics')}>
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <AIAssessmentDashboard manuscriptId={manuscriptId} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <ExternalIntegrationsDashboard manuscriptId={manuscriptId} />
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          {manuscriptId ? (
            <RealTimeCollaborationEditor manuscriptId={manuscriptId} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Manuscript</h3>
                <p className="text-muted-foreground">
                  Choose a manuscript to start real-time collaboration
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive analytics and insights for all advanced features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-medium">AI Assessment Metrics</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Completion Rate</span>
                            <span>{Math.round((stats.aiAssessments.completed / stats.aiAssessments.total) * 100)}%</span>
                          </div>
                          <Progress value={(stats.aiAssessments.completed / stats.aiAssessments.total) * 100} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Average Quality Score</span>
                            <span>{stats.aiAssessments.avgQualityScore}%</span>
                          </div>
                          <Progress value={stats.aiAssessments.avgQualityScore} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">System Performance</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Uptime</span>
                            <span>{stats.performance.uptime}%</span>
                          </div>
                          <Progress value={stats.performance.uptime} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Cache Hit Rate</span>
                            <span>{stats.performance.cacheHitRate}%</span>
                          </div>
                          <Progress value={stats.performance.cacheHitRate} />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdvancedFeaturesDashboard
