/**
 * System Monitoring Page
 * Enterprise-grade monitoring dashboard for system health and performance
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MonitoringDashboard from '@/components/monitoring-dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'System Monitoring - Performance & Security Analytics',
  description: 'Real-time monitoring dashboard for system performance, security alerts, and application health metrics.',
  keywords: [
    'system monitoring',
    'performance analytics',
    'security alerts',
    'application health',
    'real-time monitoring',
    'enterprise monitoring'
  ]
}

export default async function MonitoringPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/monitoring')
  }

  // Check if user has monitoring access
  const hasMonitoringAccess = ['admin', 'editor'].includes(session.user.role)

  if (!hasMonitoringAccess) {
    redirect('/dashboard?error=insufficient-permissions')
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            System Monitoring
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enterprise-grade monitoring and observability for real-time insights 
            into system performance, security, and application health
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center p-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Real-time response times, throughput, and performance optimization insights
            </p>
          </Card>

          <Card className="text-center p-6 border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Security Monitoring</h3>
            <p className="text-sm text-muted-foreground">
              Threat detection, security alerts, and comprehensive audit logging
            </p>
          </Card>

          <Card className="text-center p-6 border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">System Health</h3>
            <p className="text-sm text-muted-foreground">
              CPU, memory, disk usage monitoring with automated alerting
            </p>
          </Card>

          <Card className="text-center p-6 border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Cache Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Cache hit rates, performance optimization, and Redis monitoring
            </p>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Suspense fallback={<MonitoringDashboardSkeleton />}>
          <MonitoringDashboard />
        </Suspense>

        {/* Monitoring Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monitoring Features</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Real-time Performance Tracking</p>
                    <p className="text-muted-foreground">Monitor response times, throughput, and error rates in real-time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Advanced Security Analytics</p>
                    <p className="text-muted-foreground">Detect threats, monitor authentication, and track security events</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Intelligent Alerting</p>
                    <p className="text-muted-foreground">Automated alerts for critical issues with smart thresholds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">4</span>
                  </div>
                  <div>
                    <p className="font-medium">Resource Optimization</p>
                    <p className="text-muted-foreground">Cache analytics and performance optimization recommendations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">System Capabilities</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>30-day metric retention with sub-second resolution</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Multi-level caching with Redis and memory tiers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Advanced threat detection and audit logging</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Distributed tracing and performance profiling</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Custom alerting rules and notification channels</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Comprehensive API monitoring and analytics</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Specifications */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">Performance Monitoring</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Sub-millisecond response time tracking</li>
                  <li>• P50, P95, P99 percentile calculations</li>
                  <li>• Request rate and throughput analysis</li>
                  <li>• Error rate monitoring and categorization</li>
                  <li>• Database query performance tracking</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Security Features</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Real-time threat detection</li>
                  <li>• SQL injection and XSS prevention</li>
                  <li>• Authentication failure monitoring</li>
                  <li>• Rate limiting and DDoS protection</li>
                  <li>• Comprehensive audit trail</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Infrastructure</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Redis-based metric storage</li>
                  <li>• Multi-tier caching architecture</li>
                  <li>• Automatic metric aggregation</li>
                  <li>• Horizontal scaling support</li>
                  <li>• High availability design</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MonitoringDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
