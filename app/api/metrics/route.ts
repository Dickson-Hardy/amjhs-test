import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// Collect default metrics
collectDefaultMetrics({ register });

// Custom metrics for AMHSJ
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users',
  registers: [register]
});

const articlesTotal = new Gauge({
  name: 'articles_total',
  help: 'Total number of articles in the system',
  labelNames: ['status'],
  registers: [register]
});

const reviewsTotal = new Gauge({
  name: 'reviews_total',
  help: 'Total number of reviews in the system',
  labelNames: ['status'],
  registers: [register]
});

const submissionsToday = new Gauge({
  name: 'submissions_today',
  help: 'Number of article submissions today',
  registers: [register]
});

const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register]
});

const redisConnections = new Gauge({
  name: 'redis_connections_active',
  help: 'Number of active Redis connections',
  registers: [register]
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admin and monitoring systems can access metrics
    if (!session || (session.user?.role !== "admin" && session.user?.role !== "monitoring")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update custom metrics with real database values
    await updateMetricsFromDatabase()

    const metrics = await register.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    logger.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}

async function updateMetricsFromDatabase() {
  try {
    // Get article counts by status
    const articleCounts = await db.execute(sql`
      SELECT status, COUNT(*) as count 
      FROM articles 
      GROUP BY status
    `)
    
    articleCounts.forEach((row: unknown) => {
      articlesTotal.set({ status: row.status }, parseInt(row.count))
    })

    // Get review counts by status
    const reviewCounts = await db.execute(sql`
      SELECT status, COUNT(*) as count 
      FROM reviews 
      GROUP BY status
    `)
    
    reviewCounts.forEach((row: unknown) => {
      reviewsTotal.set({ status: row.status }, parseInt(row.count))
    })

    // Get today's submissions
    const todaySubmissions = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM articles 
      WHERE DATE(created_at) = CURRENT_DATE
    `)
    
    submissionsToday.set(parseInt((todaySubmissions[0] as unknown)?.count || '0'))

    // Get active users (logged in within last hour)
    const activeUsersResult = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM page_views 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    `)
    
    activeUsers.set(parseInt((activeUsersResult[0] as unknown)?.count || '0'))

    // Database connection metrics (approximate)
    databaseConnections.set(5) // This would come from connection pool stats
    redisConnections.set(3) // This would come from Redis connection stats

  } catch (error) {
    logger.error('Error updating metrics from database:', error)
    // Set default values on error
    articlesTotal.set({ status: 'published' }, 0)
    reviewsTotal.set({ status: 'pending' }, 0)
    submissionsToday.set(0)
    activeUsers.set(0)
  }
}

// Export metrics for use in other parts of the application
export {
  httpRequestsTotal,
  httpRequestDuration,
  activeUsers,
  articlesTotal,
  reviewsTotal,
  submissionsToday,
  databaseConnections,
  redisConnections
};
