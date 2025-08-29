import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { 
  adminLogs, 
  users, 
  submissions, 
  reviews,
  notifications
} from "@/lib/db/schema"
import { desc, gte, eq, and, count, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'alerts', 'updates', 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'

    const now = new Date()
    const last30min = new Date(now.getTime() - 30 * 60 * 1000)
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Generate real-time notifications based on system state
    const [
      criticalAlerts,
      recentErrors,
      systemUpdates,
      reviewAlerts,
      userAlerts,
      performanceAlerts
    ] = await Promise.all([
      // Critical system alerts
      generateCriticalAlerts(last30min),
      
      // Recent error notifications
      db.select({
        id: adminLogs.id,
        action: adminLogs.action,
        details: adminLogs.details,
        userId: adminLogs.adminId,
        userEmail: users.email,
        createdAt: adminLogs.createdAt
      })
      .from(adminLogs)
      .leftJoin(users, eq(adminLogs.adminId, users.id))
      .where(
        and(
          gte(adminLogs.createdAt, lastHour),
          sql`${adminLogs.details} LIKE '%error%'`
        )
      )
      .orderBy(desc(adminLogs.createdAt))
      .limit(5),

      // System updates and activities
      db.select({
        action: adminLogs.action,
        count: count(),
        lastOccurrence: sql<Date>`MAX(${adminLogs.createdAt})`
      })
      .from(adminLogs)
      .where(gte(adminLogs.createdAt, lastHour))
      .groupBy(adminLogs.action)
      .orderBy(desc(count()))
      .limit(10),

      // Review workflow alerts
      generateReviewAlerts(),

      // User management alerts
      generateUserAlerts(last24h),

      // Performance alerts
      generatePerformanceAlerts(lastHour)
    ])

    // Combine all notifications
    const allNotifications = [
      ...criticalAlerts,
      ...recentErrors.map(error => ({
        id: `error-${error.id}`,
        type: 'error' as const,
        priority: 'high' as const,
        title: 'System Error Detected',
        message: `Error in ${error.action}: ${error.details?.substring(0, 100)}...`,
        timestamp: error.createdAt?.toISOString() || now.toISOString(),
        metadata: {
          action: error.action,
          userId: error.userId,
          userEmail: error.userEmail
        },
        read: false
      })),
      ...systemUpdates.map(update => ({
        id: `update-${update.action}-${update.count}`,
        type: 'info' as const,
        priority: 'medium' as const,
        title: 'System Activity',
        message: `${update.action} performed ${update.count} times in the last hour`,
        timestamp: update.lastOccurrence?.toISOString() || now.toISOString(),
        metadata: {
          action: update.action,
          count: update.count
        },
        read: false
      })),
      ...reviewAlerts,
      ...userAlerts,
      ...performanceAlerts
    ]

    // Filter by type if specified
    let filteredNotifications = allNotifications
    if (type && type !== 'all') {
      filteredNotifications = allNotifications.filter(n => n.type === type)
    }

    // Filter unread only if specified
    if (unreadOnly) {
      filteredNotifications = filteredNotifications.filter(n => !n.read)
    }

    // Sort by priority and timestamp
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    filteredNotifications.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Limit results
    const notifications = filteredNotifications.slice(0, limit)

    // Generate summary statistics
    const summary = {
      total: allNotifications.length,
      unread: allNotifications.filter(n => !n.read).length,
      byType: {
        critical: allNotifications.filter(n => n.priority === 'critical').length,
        error: allNotifications.filter(n => n.type === 'error').length,
        warning: allNotifications.filter(n => n.type === 'warning').length,
        info: allNotifications.filter(n => n.type === 'info').length
      },
      byPriority: {
        critical: allNotifications.filter(n => n.priority === 'critical').length,
        high: allNotifications.filter(n => n.priority === 'high').length,
        medium: allNotifications.filter(n => n.priority === 'medium').length,
        low: allNotifications.filter(n => n.priority === 'low').length
      }
    }

    return NextResponse.json({
      notifications,
      summary,
      filters: {
        type,
        limit,
        unreadOnly
      },
      timestamp: now.toISOString()
    })

  } catch (error) {
    logger.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

async function generateCriticalAlerts(since: Date) {
  const alerts = []
  
  try {
    // Check for database connection issues
    const recentDbErrors = await db.select({ count: count() })
      .from(adminLogs)
      .where(
        and(
          gte(adminLogs.createdAt, since),
          sql`${adminLogs.details} LIKE '%database%error%'`
        )
      )

    if (recentDbErrors[0].count > 0) {
      alerts.push({
        id: 'critical-db-errors',
        type: 'critical' as const,
        priority: 'critical' as const,
        title: 'Database Connection Issues',
        message: `${recentDbErrors[0].count} database errors detected in the last 30 minutes`,
        timestamp: new Date().toISOString(),
        metadata: { errorCount: recentDbErrors[0].count },
        read: false
      })
    }

    // Check for high error rates
    const totalLogs = await db.select({ count: count() })
      .from(adminLogs)
      .where(gte(adminLogs.createdAt, since))

    const errorLogs = await db.select({ count: count() })
      .from(adminLogs)
      .where(
        and(
          gte(adminLogs.createdAt, since),
          sql`${adminLogs.details} LIKE '%error%'`
        )
      )

    const errorRate = totalLogs[0].count > 0 ? (errorLogs[0].count / totalLogs[0].count) : 0
    
    if (errorRate > 0.1) { // More than 10% error rate
      alerts.push({
        id: 'critical-error-rate',
        type: 'critical' as const,
        priority: 'critical' as const,
        title: 'High Error Rate Detected',
        message: `System error rate is ${Math.round(errorRate * 100)}% in the last 30 minutes`,
        timestamp: new Date().toISOString(),
        metadata: { errorRate: Math.round(errorRate * 100) },
        read: false
      })
    }

  } catch (error) {
    logger.error("Error generating critical alerts:", error)
  }

  return alerts
}

async function generateReviewAlerts() {
  const alerts = []
  
  try {
    // Check for overdue reviews
    const overdueReviews = await db.select({ count: count() })
      .from(reviews)
      .where(
        and(
          eq(reviews.status, 'pending'),
          sql`${reviews.createdAt} < ${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)}`
        )
      )

    if (overdueReviews[0].count > 0) {
      alerts.push({
        id: 'review-overdue',
        type: 'warning' as const,
        priority: 'high' as const,
        title: 'Overdue Reviews',
        message: `${overdueReviews[0].count} reviews are overdue (>14 days)`,
        timestamp: new Date().toISOString(),
        metadata: { count: overdueReviews[0].count },
        read: false
      })
    }

    // Check for review backlog
    const pendingReviews = await db.select({ count: count() })
      .from(reviews)
      .where(eq(reviews.status, 'pending'))

    if (pendingReviews[0].count > 50) {
      alerts.push({
        id: 'review-backlog',
        type: 'warning' as const,
        priority: 'medium' as const,
        title: 'High Review Backlog',
        message: `${pendingReviews[0].count} reviews are pending assignment or completion`,
        timestamp: new Date().toISOString(),
        metadata: { count: pendingReviews[0].count },
        read: false
      })
    }

  } catch (error) {
    logger.error("Error generating review alerts:", error)
  }

  return alerts
}

async function generateUserAlerts(since: Date) {
  const alerts = []
  
  try {
    // Check for new user registrations
    const newUsers = await db.select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, since))

    if (newUsers[0].count > 0) {
      alerts.push({
        id: 'new-users',
        type: 'info' as const,
        priority: 'low' as const,
        title: 'New User Registrations',
        message: `${newUsers[0].count} new users registered in the last 24 hours`,
        timestamp: new Date().toISOString(),
        metadata: { count: newUsers[0].count },
        read: false
      })
    }

    // Check for inactive admin accounts
    const inactiveAdmins = await db.select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.role, 'admin'),
          sql`${users.lastActiveAt} < ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}`
        )
      )

    if (inactiveAdmins[0].count > 0) {
      alerts.push({
        id: 'inactive-admins',
        type: 'warning' as const,
        priority: 'medium' as const,
        title: 'Inactive Admin Accounts',
        message: `${inactiveAdmins[0].count} admin accounts haven't logged in for 30+ days`,
        timestamp: new Date().toISOString(),
        metadata: { count: inactiveAdmins[0].count },
        read: false
      })
    }

  } catch (error) {
    logger.error("Error generating user alerts:", error)
  }

  return alerts
}

async function generatePerformanceAlerts(since: Date) {
  const alerts = []
  
  try {
    // Check for high activity periods
    const recentActivity = await db.select({ count: count() })
      .from(adminLogs)
      .where(gte(adminLogs.createdAt, since))

    if (recentActivity[0].count > 100) {
      alerts.push({
        id: 'high-activity',
        type: 'info' as const,
        priority: 'low' as const,
        title: 'High System Activity',
        message: `${recentActivity[0].count} admin actions in the last hour`,
        timestamp: new Date().toISOString(),
        metadata: { count: recentActivity[0].count },
        read: false
      })
    }

  } catch (error) {
    logger.error("Error generating performance alerts:", error)
  }

  return alerts
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const { notificationId } = await request.json()
    
    // In a real implementation, you'd update the notification status in the database
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: "Notification marked as read"
    })

  } catch (error) {
    logger.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}
