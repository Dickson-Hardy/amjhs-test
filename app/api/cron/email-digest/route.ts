import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, articles, submissions, reviews } from "@/lib/db/schema"
import { sql, and, gte, count, desc, eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email-hybrid"
import { emailTemplates } from "@/lib/email-templates"
import { logError } from "@/lib/logger"

/**
 * Email Digest Cron Job - Runs weekly on Monday at 9:00 AM
 * Sends weekly digest emails to users with system updates
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security check)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `process.env.AUTH_TOKEN_PREFIX + ' '${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('📧 Starting weekly email digest job...')
    const startTime = Date.now()
    
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Get weekly statistics
    const stats = await getWeeklyStats(oneWeekAgo, now)
    
    // Get users who should receive digest emails
    const digestRecipients = await getDigestRecipients()
    
    logger.info(`📊 Weekly stats: ${JSON.stringify(stats, null, 2)}`)
    logger.info(`👥 Sending digests to ${digestRecipients.length} users`)
    
    let successCount = 0
    let failureCount = 0
    
    // Send digest emails
    for (const recipient of digestRecipients) {
      try {
        await sendDigestEmail(recipient, stats, oneWeekAgo, now)
        successCount++
        logger.info(`✅ Digest sent to ${recipient.email}`)
        
        // Rate limiting: small delay between emails
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        failureCount++
        logger.error(`❌ Failed to send digest to ${recipient.email}:`, error)
      }
    }
    
    // Send admin summary
    await sendAdminSummary(stats, successCount, failureCount, oneWeekAgo, now)
    
    const duration = Date.now() - startTime
    
    logger.info(`🏁 Email digest job completed in ${duration}ms`)
    logger.info(`📈 Success: ${successCount}, Failures: ${failureCount}`)

    return NextResponse.json({
      success: true,
      message: 'Email digest job completed successfully',
      duration: `${duration}ms`,
      stats: {
        recipients: digestRecipients.length,
        successful: successCount,
        failed: failureCount,
        weeklyStats: stats
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('❌ Email digest job failed:', error)
    logError(error as Error, { context: 'email-digest-cron-job' })
    
    return NextResponse.json({
      success: false,
      error: 'Email digest job failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Get weekly statistics for the digest
 */
async function getWeeklyStats(startDate: Date, endDate: Date) {
  try {
    // New submissions this week
    const newSubmissions = await db
      .select({ count: count() })
      .from(submissions)
      .where(and(
        gte(submissions.createdAt, startDate),
        gte(submissions.updatedAt, endDate)
      ))

    // New users this week
    const newUsers = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        gte(users.createdAt, startDate),
        gte(users.updatedAt, endDate)
      ))

    // Published articles this week
    const publishedArticles = await db
      .select({ count: count() })
      .from(articles)
      .where(and(
        eq(articles.status, 'published'),
        gte(articles.updatedAt, startDate)
      ))

    // Reviews completed this week
    const completedReviews = await db
      .select({ count: count() })
      .from(reviews)
      .where(and(
        eq(reviews.status, 'completed'),
        gte(reviews.createdAt, startDate)
      ))

    // Get latest published articles (top 5)
    const latestArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        publishedAt: articles.publishedDate,
        category: articles.category
      })
      .from(articles)
      .where(and(
        eq(articles.status, 'published'),
        gte(articles.publishedDate, startDate)
      ))
      .orderBy(desc(articles.publishedDate))
      .limit(5)

    return {
      newSubmissions: newSubmissions[0]?.count || 0,
      newUsers: newUsers[0]?.count || 0,
      publishedArticles: publishedArticles[0]?.count || 0,
      completedReviews: completedReviews[0]?.count || 0,
      latestArticles: latestArticles || []
    }
  } catch (error) {
    logger.error('Error getting weekly stats:', error)
    return {
      newSubmissions: 0,
      newUsers: 0,
      publishedArticles: 0,
      completedReviews: 0,
      latestArticles: []
    }
  }
}

/**
 * Get users who should receive digest emails
 */
async function getDigestRecipients() {
  try {
    // Get active users who haven't opted out of emails
    const recipients = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      })
      .from(users)
      .where(and(
        eq(users.isActive, true),
        eq(users.isVerified, true)
        // Add email preference check when implemented
        // eq(users.emailDigest, true)
      ))

    return recipients
  } catch (error) {
    logger.error('Error getting digest recipients:', error)
    return []
  }
}

/**
 * Send digest email to individual user
 */
async function sendDigestEmail(recipient: unknown, stats: any, startDate: Date, endDate: Date) {
  const weekRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
  
  // Create personalized content based on user role
  let roleSpecificContent = ""
  if (recipient.role === 'author') {
    roleSpecificContent = `
      <h3>📝 For Authors</h3>
      <ul>
        <li>New submission opportunities in trending categories</li>
        <li>Average review time this week: 14 days</li>
        <li>Tips for faster publication</li>
      </ul>
    `
  } else if (recipient.role === 'reviewer') {
    roleSpecificContent = `
      <h3>🔍 For Reviewers</h3>
      <ul>
        <li>Thank you for ${stats.completedReviews} reviews this week!</li>
        <li>New review invitations available</li>
        <li>Reviewer recognition program updates</li>
      </ul>
    `
  } else if (recipient.role === 'editor') {
    roleSpecificContent = `
      <h3>✏️ For Editors</h3>
      <ul>
        <li>${stats.newSubmissions} new submissions need editorial review</li>
        <li>Editorial board meeting next week</li>
        <li>Performance metrics dashboard available</li>
      </ul>
    `
  }

  const latestArticlesList = stats.latestArticles.map((article: unknown) => 
    `<li><strong>${article.title}</strong> (${article.category})</li>`
  ).join('')

  const template = emailTemplates.weeklyDigest(
    recipient.name,
    weekRange,
    stats.newSubmissions,
    stats.publishedArticles,
    stats.newUsers,
    latestArticlesList,
    roleSpecificContent
  )

  return await sendEmail({
    to: recipient.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    category: 'user_notification'
  })
}

/**
 * Send admin summary email
 */
async function sendAdminSummary(stats: unknown, successCount: number, failureCount: number, startDate: Date, endDate: Date) {
  if (!process.env.ADMIN_EMAIL) return

  const weekRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
  
  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `AMHSJ Weekly Admin Summary - ${weekRange}`,
      html: `
        <h2>📊 Weekly Admin Summary</h2>
        <p><strong>Period:</strong> ${weekRange}</p>
        
        <h3>📈 System Statistics</h3>
        <ul>
          <li>New Submissions: ${stats.newSubmissions}</li>
          <li>Published Articles: ${stats.publishedArticles}</li>
          <li>New Users: ${stats.newUsers}</li>
          <li>Completed Reviews: ${stats.completedReviews}</li>
        </ul>
        
        <h3>📧 Digest Email Results</h3>
        <ul>
          <li>Successfully Sent: ${successCount}</li>
          <li>Failed: ${failureCount}</li>
          <li>Success Rate: ${successCount > 0 ? ((successCount / (successCount + failureCount)) * 100).toFixed(1) : 0}%</li>
        </ul>
        
        <h3>📚 Latest Publications</h3>
        <ul>
          ${stats.latestArticles.map((article: unknown) => 
            `<li><strong>${article.title}</strong> (${article.category}) - ${new Date(article.publishedAt).toLocaleDateString()}</li>`
          ).join('')}
        </ul>
        
        <p>Generated at: ${new Date().toISOString()}</p>
      `,
      text: `Weekly Admin Summary - ${weekRange}\n\nNew Submissions: ${stats.newSubmissions}\nPublished: ${stats.publishedArticles}\nNew Users: ${stats.newUsers}\nReviews: ${stats.completedReviews}\n\nDigest Emails: ${successCount} sent, ${failureCount} failed`,
      category: 'system'
    })
    
    logger.error('✅ Admin summary sent')
  } catch (error) {
    logger.error('❌ Failed to send admin summary:', error)
  }
}

// Prevent this endpoint from being cached
export const dynamic = 'force-dynamic'