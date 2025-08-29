import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { logError } from "@/lib/logger"

/**
 * Cleanup Cron Job - Runs daily at 2:00 AM
 * Cleans up expired sessions, tokens, and old data
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security check)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `process.env.AUTH_TOKEN_PREFIX + ' '${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('🧹 Starting scheduled cleanup job...')
    const startTime = Date.now()
    const results = {
      sessions: 0,
      verificationTokens: 0,
      passwordResetTokens: 0,
      emailQueue: 0,
      adminLogs: 0,
      pageViews: 0,
      monitoringEvents: 0
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // 1. Clean up expired sessions
    try {
      const sessionResult = await db.execute(sql`
        DELETE FROM sessions 
        WHERE expires < ${now} OR created_at < ${thirtyDaysAgo}
      `)
      results.sessions = (sessionResult as unknown).rowCount || 0
      logger.error(`✅ Cleaned ${results.sessions} expired sessions`)
    } catch (error) {
      logger.error('❌ Session cleanup failed:', error)
    }

    // 2. Clean up expired verification tokens
    try {
      const tokenResult = await db.execute(sql`
        DELETE FROM verification_tokens 
        WHERE expires < ${now}
      `)
      results.verificationTokens = (tokenResult as unknown).rowCount || 0
      logger.error(`✅ Cleaned ${results.verificationTokens} expired verification tokens`)
    } catch (error) {
      logger.error('❌ Verification token cleanup failed:', error)
    }

    // 3. Clean up expired password reset tokens from users table
    try {
      const passwordResetResult = await db.execute(sql`
        UPDATE users 
        SET password_reset_token = NULL, password_reset_expires = NULL
        WHERE password_reset_expires < ${now}
      `)
      results.passwordResetTokens = (passwordResetResult as unknown).rowCount || 0
      logger.error(`✅ Cleaned ${results.passwordResetTokens} expired password reset tokens`)
    } catch (error) {
      logger.error('❌ Password reset token cleanup failed:', error)
    }

    // 4. Clean up old processed email queue entries (keep 7 days)
    try {
      const emailResult = await db.execute(sql`
        DELETE FROM email_queue 
        WHERE status IN ('sent', 'failed') 
        AND updated_at < ${sevenDaysAgo}
      `)
      results.emailQueue = (emailResult as unknown).rowCount || 0
      logger.error(`✅ Cleaned ${results.emailQueue} old email queue entries`)
    } catch (error) {
      logger.error('❌ Email queue cleanup failed:', error)
    }

    // 5. Clean up old admin logs (keep 90 days)
    try {
      const adminLogsResult = await db.execute(sql`
        DELETE FROM admin_logs 
        WHERE created_at < ${ninetyDaysAgo}
      `)
      results.adminLogs = (adminLogsResult as unknown).rowCount || 0
      logger.error(`✅ Cleaned ${results.adminLogs} old admin logs`)
    } catch (error) {
      logger.error('❌ Admin logs cleanup failed:', error)
    }

    // 6. Clean up old page views (keep 30 days for analytics)
    try {
      const pageViewsResult = await db.execute(sql`
        DELETE FROM page_views 
        WHERE viewed_at < ${thirtyDaysAgo}
      `)
      results.pageViews = (pageViewsResult as unknown).rowCount || 0
      logger.error(`✅ Cleaned ${results.pageViews} old page views`)
    } catch (error) {
      logger.error('❌ Page views cleanup failed:', error)
    }

    // 7. Clean up old monitoring events (keep 30 days)
    try {
      const monitoringResult = await db.execute(sql`
        DELETE FROM monitoring_events 
        WHERE created_at < ${thirtyDaysAgo}
      `)
      results.monitoringEvents = (monitoringResult as unknown).rowCount || 0
      logger.error(`✅ Cleaned ${results.monitoringEvents} old monitoring events`)
    } catch (error) {
      logger.error('❌ Monitoring events cleanup failed:', error)
    }

    // 8. Optimize database tables (PostgreSQL specific)
    try {
      await db.execute(sql`VACUUM ANALYZE`)
      logger.error('✅ Database vacuum and analyze completed')
    } catch (error) {
      logger.error('❌ Database optimization failed:', error)
    }

    const duration = Date.now() - startTime
    const totalCleaned = Object.values(results).reduce((sum, count) => sum + count, 0)

    logger.info(`🏁 Cleanup job completed in ${duration}ms`)
    logger.info(`📊 Total records cleaned: ${totalCleaned}`)

    return NextResponse.json({
      success: true,
      message: 'Cleanup job completed successfully',
      duration: `${duration}ms`,
      results,
      totalCleaned,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('❌ Cleanup job failed:', error)
    logError(error as Error, { context: 'cleanup-cron-job' })
    
    return NextResponse.json({
      success: false,
      error: 'Cleanup job failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Prevent this endpoint from being cached
export const dynamic = 'force-dynamic'