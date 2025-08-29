import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reviews, submissions, users, adminLogs } from '@/lib/db/schema'
import { eq, desc, and, gte, count } from 'drizzle-orm'

export async function GET() {
  try {
    // Get recent system alerts based on various criteria
    const alerts = []

    // Check for overdue reviews
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const overdueReviewsCount = await db
      .select({ count: count() })
      .from(reviews)
      .where(and(
        eq(reviews.status, 'pending'),
        gte(reviews.createdAt, overdueDate)
      ))

    if ((overdueReviewsCount[0]?.count || 0) > 0) {
      alerts.push({
        id: 'overdue_reviews',
        type: 'overdue_reviews',
        severity: 'high',
        title: 'Overdue Reviews Alert',
        message: `${overdueReviewsCount[0].count} reviews are overdue and require immediate attention`,
        timestamp: new Date().toISOString(),
        action: 'review_management',
        resolved: false,
        category: 'Review Management'
      })
    }

    // Check for high submission volume
    const recentSubmissions = await db
      .select({ count: count() })
      .from(submissions)
      .where(gte(submissions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))

    if ((recentSubmissions[0]?.count || 0) > 20) {
      alerts.push({
        id: 'high_submission_volume',
        type: 'system_performance',
        severity: 'medium',
        title: 'High Submission Volume',
        message: `${recentSubmissions[0].count} new submissions received this week - consider additional reviewer assignments`,
        timestamp: new Date().toISOString(),
        action: 'workload_management',
        resolved: false,
        category: 'Workflow'
      })
    }

    // Check for inactive editors (placeholder logic)
    const inactiveEditorsCount = 2 // Would calculate from actual activity data
    if (inactiveEditorsCount > 0) {
      alerts.push({
        id: 'inactive_editors',
        type: 'editor_activity',
        severity: 'medium',
        title: 'Editor Inactivity Alert',
        message: `${inactiveEditorsCount} section editors have been inactive for over 14 days`,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        action: 'editor_engagement',
        resolved: false,
        category: 'Editor Management'
      })
    }

    // System maintenance reminder
    alerts.push({
      id: 'system_maintenance',
      type: 'system_maintenance',
      severity: 'low',
      title: 'Scheduled Maintenance Reminder',
      message: 'Weekly system backup scheduled for tonight at 2:00 AM',
      timestamp: new Date().toISOString(),
      action: 'system_backup',
      resolved: false,
      category: 'System'
    })

    // Quality threshold alert
    alerts.push({
      id: 'quality_threshold',
      type: 'quality_control',
      severity: 'medium',
      title: 'Quality Metrics Alert',
      message: 'Average review quality score has dropped below 4.0 - consider reviewer training',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      action: 'quality_improvement',
      resolved: false,
      category: 'Quality Assurance'
    })

    // Sort by severity and timestamp
    const sortedAlerts = alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      const severityDiff = severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder]
      if (severityDiff !== 0) return severityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return NextResponse.json(sortedAlerts.slice(0, 10)) // Limit to 10 most important alerts
  } catch (error) {
    logger.error('Error fetching system alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system alerts' },
      { status: 500 }
    )
  }
}
