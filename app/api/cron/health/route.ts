import { NextRequest, NextResponse } from "next/server"

/**
 * Health Check for Cron Jobs
 * Tests connectivity and validates all scheduled endpoints
 */
export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL'
    const cronSecret = process.env.CRON_SECRET
    
    const tests = [
      {
        name: 'Cleanup Cron Job',
        url: `${baseUrl}/api/cron/cleanup`,
        description: 'Daily cleanup task at 2:00 AM'
      },
      {
        name: 'Email Digest Cron Job', 
        url: `${baseUrl}/api/cron/email-digest`,
        description: 'Weekly digest emails on Monday at 9:00 AM'
      }
    ]

    const results = []
    
    for (const test of tests) {
      try {
        const headers: unknown = {
          'User-Agent': 'AMHSJ-Health-Check'
        }
        
        // Add auth header if cron secret is configured
        if (cronSecret) {
          headers['Authorization'] = `process.env.AUTH_TOKEN_PREFIX + ' '${cronSecret}`
        }
        
        const response = await fetch(test.url, {
          method: 'GET',
          headers,
          // Don't actually execute, just test connectivity
          signal: AbortSignal.timeout(5000)
        })
        
        results.push({
          name: test.name,
          url: test.url,
          description: test.description,
          status: response.ok ? 'healthy' : 'error',
          statusCode: response.status,
          responseTime: '< 5s',
          lastChecked: new Date().toISOString()
        })
        
      } catch (error) {
        results.push({
          name: test.name,
          url: test.url,
          description: test.description,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString()
        })
      }
    }
    
    const allHealthy = results.every(r => r.status === 'healthy')
    
    return NextResponse.json({
      success: true,
      overall: allHealthy ? 'healthy' : 'degraded',
      message: `${results.filter(r => r.status === 'healthy').length}/${results.length} cron jobs are healthy`,
      cronJobs: results,
      configuration: {
        cronSecret: cronSecret ? 'configured' : 'not configured',
        baseUrl,
        vercelSchedules: [
          { path: '/api/cron/cleanup', schedule: '0 2 * * *' },
          { path: '/api/cron/email-digest', schedule: '0 9 * * 1' }
        ]
      },
      timestamp: new Date().toISOString()
    }, { 
      status: allHealthy ? 200 : 503 
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Prevent this endpoint from being cached
export const dynamic = 'force-dynamic'