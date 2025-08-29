/**
 * Performance & Security Monitoring API
 * Enterprise monitoring endpoints for system health and security
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import * as crypto from "crypto"
import {
  requireAuth,
  createApiResponse,
  createErrorResponse,
  validateRequest,
  withErrorHandler,
  ROLES
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// Input validation schemas
const MonitoringQuerySchema = z.object({
  timeframe: z.enum(['1h', '24h', '7d', '30d']).optional().default('24h'),
  metric: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
})

export const GET = withErrorHandler(async (req: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Require admin or editor permissions
    const { user } = await requireAuth(req, [ROLES.ADMIN, ROLES.ASSOCIATE_EDITOR])
    
    logger.api("Monitoring API GET request", { 
      requestId, 
      userId: user.id, 
      userRole: user.role 
    })

    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get('endpoint')

    let result
    switch (endpoint) {
      case 'dashboard':
        result = await handleDashboardRequest(req, requestId)
        break
      
      case 'performance':
        result = await handlePerformanceRequest(req, requestId)
        break
      
      case 'system-health':
        result = await handleSystemHealthRequest(req, requestId)
        break

      default:
        logger.api("Invalid monitoring endpoint requested", { requestId, endpoint })
        throw new Error('Invalid endpoint')
    }

    logger.api("Monitoring API request completed", { requestId, endpoint })
    return result
  } catch (error) {
    logger.error("Monitoring API error", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Require authentication for POST operations
    const { user } = await requireAuth(req, [ROLES.ADMIN, ROLES.ASSOCIATE_EDITOR, ROLES.AUTHOR])
    
    logger.api("Monitoring API POST request", { 
      requestId, 
      userId: user.id, 
      userRole: user.role 
    })

    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get('endpoint')
    const body = await req.json()

    let result
    switch (endpoint) {
      case 'log-event':
        result = await handleEventLogging(req, body)
        break
      
      case 'resolve-alert':
        result = await handleAlertResolution(req, body)
        break

      default:
        logger.api("Invalid monitoring POST endpoint requested", { requestId, endpoint })
        throw new Error('Invalid endpoint')
    }

    logger.api("Monitoring API POST request completed", { requestId, endpoint })
    return result
  } catch (error) {
    logger.error("Monitoring API POST error", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})

// Dashboard data handler
async function handleDashboardRequest(req: NextRequest, requestId: string) {
  try {
    const { searchParams } = new URL(req.url)
    const query = MonitoringQuerySchema.parse(Object.fromEntries(searchParams))

    const dashboardData = await getDashboardData(query.timeframe)

    logger.api("Dashboard data retrieved", { requestId, timeframe: query.timeframe })

    return createApiResponse(
      {
        timestamp: Date.now(),
        ...dashboardData
      },
      "Dashboard data retrieved successfully",
      requestId
    )
  } catch (error) {
    logger.error("Dashboard request error", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw new Error('Failed to load dashboard data')
  }
}

// Performance monitoring handler
async function handlePerformanceRequest(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = MonitoringQuerySchema.parse(Object.fromEntries(searchParams))

    const performanceData = await getPerformanceData(query.timeframe)

    return NextResponse.json({
      success: true,
      data: {
        timeframe: query.timeframe,
        ...performanceData
      }
    })
  } catch (error) {
    logger.error('Performance request error', { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    return NextResponse.json(
      { error: 'Failed to load performance data' },
      { status: 500 }
    )
  }
}

// System health handler
async function handleSystemHealthRequest(req: NextRequest) {
  try {
    const healthData = await getSystemHealth()

    return NextResponse.json({
      success: true,
      data: healthData
    })
  } catch (error) {
    logger.error('System health request error', { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    return NextResponse.json(
      { error: 'Failed to load system health data' },
      { status: 500 }
    )
  }
}

// Event logging handler
async function handleEventLogging(req: NextRequest, body: any) {
  try {
    const session = await getServerSession(authOptions)
    const { eventType, message, severity = 'info', metadata = {} } = body

    // Log event to database
    await db.execute(sql`
      INSERT INTO monitoring_events (event_type, message, severity, metadata, user_id, created_at)
      VALUES (${eventType}, ${message}, ${severity}, ${JSON.stringify(metadata)}, ${session!.user.id}, NOW())
    `)

    return NextResponse.json({
      success: true,
      message: 'Event logged successfully',
    })
  } catch (error) {
    logger.error('Event logging error', { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    )
  }
}

// Alert resolution handler
async function handleAlertResolution(req: NextRequest, body: any) {
  try {
    const session = await getServerSession(authOptions)
    const { alertId, resolution } = body

    // Log alert resolution
    await db.execute(sql`
      INSERT INTO admin_logs (action, performed_by, details, created_at)
      VALUES ('ALERT_RESOLVED', ${session!.user.email}, ${JSON.stringify({ alertId, resolution })}, NOW())
    `)

    return NextResponse.json({
      success: true,
      message: 'Alert resolved successfully',
    })
  } catch (error) {
    logger.error('Alert resolution error', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    )
  }
}

async function getDashboardData(timeframe: string) {
  const timeframeHours = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720

  try {
    // Get system metrics from database
    const [
      userCount,
      articleCount,
      reviewCount,
      recentActivity,
      errorCount
    ] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM users`),
      db.execute(sql`SELECT COUNT(*) as count FROM articles`),
      db.execute(sql`SELECT COUNT(*) as count FROM reviews WHERE created_at >= NOW() - INTERVAL '${sql.raw(timeframeHours.toString())} hours'`),
      db.execute(sql`SELECT COUNT(*) as count FROM page_views WHERE created_at >= NOW() - INTERVAL '${sql.raw(timeframeHours.toString())} hours'`),
      db.execute(sql`SELECT COUNT(*) as count FROM admin_logs WHERE action LIKE '%ERROR%' AND created_at >= NOW() - INTERVAL '${sql.raw(timeframeHours.toString())} hours'`)
    ])

    return {
      overview: {
        systemHealth: 'healthy',
        activeAlerts: parseInt((errorCount[0] as any)?.count || '0'),
        totalUsers: parseInt((userCount[0] as any)?.count || '0'),
        totalArticles: parseInt((articleCount[0] as any)?.count || '0'),
        recentReviews: parseInt((reviewCount[0] as any)?.count || '0'),
        recentActivity: parseInt((recentActivity[0] as any)?.count || '0')
      },
      performance: {
        avgResponseTime: 150, // Would come from actual metrics
        errorRate: 0.01,
        uptime: process.uptime()
      }
    }
  } catch (error) {
    logger.error('Error getting dashboard data', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    return {
      overview: {
        systemHealth: 'healthy',
        activeAlerts: 0,
        totalUsers: 0,
        totalArticles: 0,
        recentReviews: 0,
        recentActivity: 0
      },
      performance: {
        avgResponseTime: 150,
        errorRate: 0.01,
        uptime: process.uptime()
      }
    }
  }
}

async function getPerformanceData(timeframe: string) {
  const timeframeHours = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720

  try {
    // Get performance-related data
    const pageViews = await db.execute(sql`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as views
      FROM page_views 
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(timeframeHours.toString())} hours'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour
    `)

    const errorLogs = await db.execute(sql`
      SELECT 
        action,
        COUNT(*) as count
      FROM admin_logs 
      WHERE action LIKE '%ERROR%' 
      AND created_at >= NOW() - INTERVAL '${sql.raw(timeframeHours.toString())} hours'
      GROUP BY action
    `)

    return {
      pageViews: pageViews.map(row => ({
        hour: (row as any).hour,
        views: parseInt((row as any).views)
      })),
      errors: errorLogs.map(row => ({
        type: (row as any).action,
        count: parseInt((row as any).count)
      })),
      memory: process.memoryUsage(),
      summary: {
        totalViews: pageViews.reduce((sum, row) => sum + parseInt((row as any).views), 0),
        totalErrors: errorLogs.reduce((sum, row) => sum + parseInt((row as any).count), 0)
      }
    }
  } catch (error) {
    logger.error('Error getting performance data', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    return {
      pageViews: [],
      errors: [],
      memory: process.memoryUsage(),
      summary: {
        totalViews: 0,
        totalErrors: 0
      }
    }
  }
}

async function getSystemHealth() {
  try {
    // Test database connection
    const dbStart = Date.now()
    await db.execute(sql`SELECT 1 as health_check`)
    const dbLatency = Date.now() - dbStart

    const memUsage = process.memoryUsage()
    const uptime = process.uptime()

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latency: dbLatency
      },
      system: {
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          usage: memUsage.heapUsed / memUsage.heapTotal
        },
        uptime: uptime,
        pid: process.pid,
        nodeVersion: process.version
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}
