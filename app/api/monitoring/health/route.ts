import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admins can access detailed system health
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    const health = await checkSystemHealth()
    
    return NextResponse.json({
      success: true,
      data: health
    })
  } catch (error: unknown) {
    logError(error, { context: 'GET /api/monitoring/health' })
    
    return NextResponse.json({
      success: false,
      error: "Failed to check system health"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Health check endpoint - no authentication required for uptime monitoring
    const { searchParams } = new URL(request.url)
    const simple = searchParams.get('simple') === 'true'

    if (simple) {
      // Simple health check for load balancers
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
      })
    }

    const health = await checkSystemHealth()
    
    return NextResponse.json({
      success: true,
      data: {
        status: health.status,
        timestamp: health.timestamp,
        responseTime: health.metrics.responseTime
      }
    })
  } catch (error: unknown) {
    logError(error, { context: 'POST /api/monitoring/health' })
    
    return NextResponse.json({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 500 })
  }
}

async function checkSystemHealth() {
  const start = Date.now()
  
  try {
    // Check database connectivity
    const dbStart = Date.now()
    await db.execute(sql`SELECT 1 as health_check`)
    const dbLatency = Date.now() - dbStart

    // Check basic system metrics
    const systemMetrics = await getSystemMetrics()
    
    const responseTime = Date.now() - start
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        responseTime,
        database: {
          status: 'connected',
          latency: dbLatency
        },
        system: systemMetrics
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      metrics: {
        responseTime: Date.now() - start
      }
    }
  }
}

async function getSystemMetrics() {
  try {
    // Get database counts
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`)
    const articleCount = await db.execute(sql`SELECT COUNT(*) as count FROM articles`)
    const reviewCount = await db.execute(sql`SELECT COUNT(*) as count FROM reviews`)
    
    return {
      users: parseInt((userCount[0] as unknown)?.count || '0'),
      articles: parseInt((articleCount[0] as unknown)?.count || '0'),
      reviews: parseInt((reviewCount[0] as unknown)?.count || '0'),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  } catch (error) {
    return {
      error: 'Failed to get system metrics',
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  }
}
