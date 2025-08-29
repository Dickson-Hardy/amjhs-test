import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { initRedis } from "@/lib/redis"
import { CacheManager } from "@/lib/cache"

export async function GET() {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true'
  
  const healthCheck = {
    status: isMaintenanceMode ? "maintenance" : "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    platform: 'vercel',
    region: process.env.VERCEL_REGION || 'unknown',
    deployment: {
      url: process.env.VERCEL_URL,
      git_commit: process.env.VERCEL_GIT_COMMIT_SHA,
      git_branch: process.env.VERCEL_GIT_COMMIT_REF,
    },
    maintenance: {
      enabled: isMaintenanceMode,
      startTime: process.env.MAINTENANCE_START_TIME || null,
      endTime: process.env.MAINTENANCE_END_TIME || null,
      reason: process.env.MAINTENANCE_REASON || null
    },
    services: {
      database: "unknown",
      redis: "unknown",
      cache: "unknown",
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      }
    },
    details: {
      cacheStatus: null as unknown,
      redisDetails: null as unknown
    }
  }

  // Skip service checks during maintenance mode
  if (isMaintenanceMode) {
    return NextResponse.json(healthCheck, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Check': 'vercel-deployment',
        'X-Vercel-Region': process.env.VERCEL_REGION || 'unknown'
      }
    })
  }

  // Check Database Connection
  try {
    await sql`SELECT 1 as health_check`
    healthCheck.services.database = "healthy"
  } catch (error) {
    healthCheck.services.database = "unhealthy"
    healthCheck.status = "degraded"
    logger.error("Database health check failed:", error)
  }

  // Check Cache System
  try {
    const testKey = "health:cache:test"
    const testValue = { test: true, timestamp: Date.now() }
    
    await CacheManager.set(testKey, testValue, 60)
    const retrieved = await CacheManager.get<{ test: boolean; timestamp: number }>(testKey)
    
    if (retrieved && retrieved.test === true) {
      healthCheck.services.cache = "healthy"
    } else {
      healthCheck.services.cache = "error"
      healthCheck.status = "degraded"
    }
    
    await CacheManager.del(testKey)
    healthCheck.details.cacheStatus = CacheManager.getStatus()
    
  } catch (error) {
    healthCheck.services.cache = "error"
    healthCheck.status = "degraded"
    logger.error("Cache health check failed:", error)
  }

  // Check Redis Connection (non-blocking)
  try {
    const redis = await initRedis()
    if (redis) {
      const pingResult = await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ])
      
      if (pingResult === 'PONG') {
        healthCheck.services.redis = "healthy"
        healthCheck.details.redisDetails = "connected"
      } else {
        healthCheck.services.redis = "degraded"
        healthCheck.details.redisDetails = "ping_failed"
      }
    } else {
      healthCheck.services.redis = "not_configured"
      healthCheck.details.redisDetails = "redis_client_not_available"
    }
  } catch (error) {
    healthCheck.services.redis = "unhealthy"
    healthCheck.details.redisDetails = error instanceof Error ? error.message : "unknown_error"
    // Don't mark overall status as degraded for Redis failures since we have memory fallback
    logger.debug("Redis health check failed (using memory fallback):", error)
  }

  const statusCode = healthCheck.status === "healthy" ? 200 : 503

  return NextResponse.json(healthCheck, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Check': 'vercel-deployment',
      'X-Vercel-Region': process.env.VERCEL_REGION || 'unknown'
    }
  })
}
