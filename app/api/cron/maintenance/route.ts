import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { 
  users, 
  submissions, 
  notifications, 
  adminLogs,
  reviewInvitations
} from "@/lib/db/schema"
import { sql, lt, and, eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email-hybrid"
import { emailTemplates } from "@/lib/email-templates"

/**
 * Comprehensive Maintenance Cron Job for Vercel Free Tier
 * Combines multiple maintenance tasks into a single daily job
 * Runs at 2:00 AM daily
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `process.env.AUTH_TOKEN_PREFIX + ' '${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results = {
    timestamp: new Date().toISOString(),
    tasks: {} as Record<string, any>,
    executionTimeMs: 0
  }

  try {
    logger.info('🔧 Starting daily maintenance tasks...')

    // Task 1: Database Cleanup
    logger.info('📊 Running database cleanup...')
    const cleanupResult = await performDatabaseCleanup()
    results.tasks.databaseCleanup = cleanupResult

    // Task 2: Email Queue Processing
    logger.info('📧 Processing email queue...')
    const emailResult = await processEmailQueue()
    results.tasks.emailProcessing = emailResult

    // Task 3: Review Deadline Management
    logger.info('⏰ Managing review deadlines...')
    const deadlineResult = await processReviewDeadlines()
    results.tasks.deadlineManagement = deadlineResult

    // Task 4: User Activity Cleanup
    logger.info('👤 Cleaning user activity...')
    const activityResult = await cleanupUserActivity()
    results.tasks.activityCleanup = activityResult

    // Task 5: Generate Weekly Digest (Mondays only)
    const today = new Date()
    if (today.getDay() === 1) { // Monday
      logger.info('📊 Generating weekly digest...')
      const digestResult = await generateWeeklyDigest()
      results.tasks.weeklyDigest = digestResult
    }

    // Task 6: System Health Check
    logger.info('🏥 Performing health check...')
    const healthResult = await performSystemHealthCheck()
    results.tasks.healthCheck = healthResult

    const executionTime = Date.now() - startTime
    results.executionTimeMs = executionTime

    // Log successful maintenance (skip if no system admin exists)
    try {
      await db.insert(adminLogs).values({
        id: `maintenance_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        adminId: 'maintenance-system',
        adminEmail: 'system@maintenance.amjhs.org',
        action: 'Daily Maintenance',
        resourceType: 'system',
        resourceId: 'cron',
        details: `Maintenance completed in ${executionTime}ms. Tasks: ${Object.keys(results.tasks).join(', ')}`,
        ipAddress: 'process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL',
        userAgent: 'Vercel-Cron',
        createdAt: new Date()
      })
    } catch (logError) {
      logger.warn('Could not log maintenance activity:', logError)
    }

    logger.info(`✅ Daily maintenance completed in ${executionTime}ms`)

    return NextResponse.json({
      success: true,
      message: 'Daily maintenance completed successfully',
      results,
      executionTimeMs: executionTime
    })

  } catch (error) {
    logger.error('❌ Maintenance task failed:', error)

    // Log the error (skip if no system admin exists)
    try {
      await db.insert(adminLogs).values({
        id: `maintenance_error_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        adminId: 'maintenance-system',
        adminEmail: 'system@maintenance.amjhs.org',
        action: 'Maintenance Error',
        resourceType: 'system',
        resourceId: 'cron',
        details: `Maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ipAddress: 'process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL',
        userAgent: 'Vercel-Cron',
        createdAt: new Date()
      })
    } catch (logError) {
      logger.error('Failed to log maintenance error:', logError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Maintenance failed',
      results,
      executionTimeMs: Date.now() - startTime
    }, { status: 500 })
  }
}

/**
 * Database Cleanup Tasks
 */
async function performDatabaseCleanup() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  const cleanup = {
    oldNotifications: 0,
    oldLogs: 0,
    expiredInvitations: 0
  }

  try {
    // Clean up old read notifications (30 days)
    const oldNotifications = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.isRead, true),
          lt(notifications.createdAt, thirtyDaysAgo)
        )
      )
    cleanup.oldNotifications = oldNotifications.length || 0

    // Clean up old admin logs (90 days, keep critical ones)
    const oldLogs = await db
      .delete(adminLogs)
      .where(
        and(
          lt(adminLogs.createdAt, ninetyDaysAgo),
          sql`action NOT IN ('Security Alert', 'Data Breach', 'System Failure')`
        )
      )
    cleanup.oldLogs = oldLogs.length || 0

    // Clean up expired review invitations (1 year old)
    const expiredInvitations = await db
      .delete(reviewInvitations)
      .where(
        and(
          eq(reviewInvitations.status, 'expired'),
          lt(reviewInvitations.createdAt, oneYearAgo)
        )
      )
    cleanup.expiredInvitations = expiredInvitations.length || 0

    return { success: true, cleanup }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Database cleanup failed',
      cleanup 
    }
  }
}

/**
 * Email Queue Processing
 */
async function processEmailQueue() {
  // This would integrate with the email queue if implemented
  // For now, return a placeholder
  return {
    success: true,
    processed: 0,
    failed: 0,
    note: 'Email processing handled by interval-based system'
  }
}

/**
 * Review Deadline Management
 */
async function processReviewDeadlines() {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const deadlines = {
    remindersWent: 0,
    expiredInvitations: 0
  }

  try {
    // Find invitations needing first reminder (7 days before deadline)
    const needingFirstReminder = await db
      .select()
      .from(reviewInvitations)
      .where(
        and(
          eq(reviewInvitations.status, 'pending'),
          lt(reviewInvitations.responseDeadline, sevenDaysFromNow),
          sql`first_reminder_sent IS NULL`
        )
      )
      .limit(10) // Limit to avoid timeout

    // Send first reminders
    for (const invitation of needingFirstReminder) {
      try {
        await sendEmail({
          to: invitation.reviewerEmail,
          subject: 'Reminder: Review Invitation Response Needed',
          html: `<p>Dear ${invitation.reviewerName},</p>
                 <p>This is a reminder that your response to a review invitation is due in 7 days.</p>
                 <p>Please respond at your earliest convenience.</p>`,
          text: `Reminder: Review invitation response needed within 7 days.`,
          category: 'editorial'
        })

        // Mark reminder as sent
        await db
          .update(reviewInvitations)
          .set({ 
            firstReminderSent: now,
            updatedAt: now 
          })
          .where(eq(reviewInvitations.id, invitation.id))

        deadlines.remindersWent++
      } catch (error) {
        logger.error(`Failed to send reminder for invitation ${invitation.id}:`, error)
      }
    }

    // Expire overdue invitations
    const expiredCount = await db
      .update(reviewInvitations)
      .set({ 
        status: 'expired',
        withdrawnAt: now,
        updatedAt: now 
      })
      .where(
        and(
          eq(reviewInvitations.status, 'pending'),
          lt(reviewInvitations.responseDeadline, now)
        )
      )

    deadlines.expiredInvitations = Array.isArray(expiredCount) ? expiredCount.length : 0

    return { success: true, deadlines }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Deadline processing failed',
      deadlines 
    }
  }
}

/**
 * User Activity Cleanup
 */
async function cleanupUserActivity() {
  const activity = {
    inactiveUsers: 0,
    unverifiedUsers: 0
  }

  try {
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)

    // Mark users as inactive if they haven't logged in for 6 months
    const inactiveCount = await db
      .update(users)
      .set({ 
        isActive: false,
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(users.isActive, true),
          lt(users.lastActiveAt, sixMonthsAgo)
        )
      )

    activity.inactiveUsers = Array.isArray(inactiveCount) ? inactiveCount.length : 0

    // Clean up unverified users older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const unverifiedCount = await db
      .delete(users)
      .where(
        and(
          eq(users.isVerified, false),
          lt(users.createdAt, thirtyDaysAgo)
        )
      )

    activity.unverifiedUsers = Array.isArray(unverifiedCount) ? unverifiedCount.length : 0

    return { success: true, activity }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Activity cleanup failed',
      activity 
    }
  }
}

/**
 * Weekly Digest Generation (Mondays only)
 */
async function generateWeeklyDigest() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  try {
    // Get weekly stats
    const weeklyStats = await db
      .select({
        newSubmissions: sql<number>`COUNT(CASE WHEN status = 'submitted' THEN 1 END)`,
        publishedArticles: sql<number>`COUNT(CASE WHEN status = 'published' THEN 1 END)`,
        activeReviews: sql<number>`COUNT(CASE WHEN status = 'under_review' THEN 1 END)`
      })
      .from(submissions)
      .where(sql`created_at >= ${oneWeekAgo}`)

    // Get new users count separately
    const newUsersResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(sql`created_at >= ${oneWeekAgo}`)

    const stats = {
      ...(weeklyStats[0] || { newSubmissions: 0, publishedArticles: 0, activeReviews: 0 }),
      newUsers: newUsersResult[0]?.count || 0
    }

    // Get admin emails for digest
    const admins = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.role, 'admin'))

    // Send digest to admins
    let digestsSent = 0
    for (const admin of admins) {
      try {
        const template = emailTemplates.weeklyDigest(
          admin.name,
          'Last 7 days',
          stats.newSubmissions,
          stats.publishedArticles,
          stats.newUsers,
          'Recent articles list',
          'Admin digest content'
        )

        await sendEmail({
          to: admin.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
          category: 'editorial'
        })
        digestsSent++
      } catch (error) {
        logger.error(`Failed to send digest to ${admin.email}:`, error)
      }
    }

    return { 
      success: true, 
      stats, 
      digestsSent,
      adminCount: admins.length 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Digest generation failed'
    }
  }
}

/**
 * System Health Check
 */
async function performSystemHealthCheck() {
  const health = {
    database: false,
    emailService: false,
    storage: false,
    timestamp: new Date().toISOString()
  }

  try {
    // Test database connection
    const testQuery = await db.select({ test: sql`1` })
    health.database = true

    // Test email service (just check configuration)
    health.emailService = !!(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER))

    // Test storage (check environment variables)
    health.storage = !!(process.env.CLOUDINARY_URL || process.env.AWS_ACCESS_KEY_ID)

    return { success: true, health }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Health check failed',
      health 
    }
  }
}