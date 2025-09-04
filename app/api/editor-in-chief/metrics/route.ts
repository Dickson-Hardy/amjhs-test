import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, reviews, users, editorProfiles } from "@/lib/db/schema"
import { sql, eq, and, gte } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only editor-in-chief and admin can access this
    if (!session?.user || !["editor-in-chief", "admin"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get overall journal metrics
    const journalMetrics = await db
      .select({
        totalSubmissions: sql<number>`COUNT(*)`,
        accepted: sql<number>`COUNT(CASE WHEN status = 'accepted' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN status = 'rejected' THEN 1 END)`,
        published: sql<number>`COUNT(CASE WHEN status = 'published' THEN 1 END)`,
        technicalCheck: sql<number>`COUNT(CASE WHEN status = 'technical_check' THEN 1 END)`,
        underReview: sql<number>`COUNT(CASE WHEN status = 'under_review' THEN 1 END)`,
        revisionRequested: sql<number>`COUNT(CASE WHEN status = 'revision_requested' THEN 1 END)`,
        avgReviewTime: sql<number>`
          AVG(EXTRACT(EPOCH FROM (updated_at - submitted_date)) / 86400)
          FILTER (WHERE status IN ('accepted', 'rejected', 'published') AND submitted_date IS NOT NULL)
        `,
      })
      .from(articles)

    const metrics = journalMetrics[0] || {
      totalSubmissions: 0,
      accepted: 0,
      rejected: 0,
      published: 0,
      technicalCheck: 0,
      underReview: 0,
      revisionRequested: 0,
      avgReviewTime: 0,
    }

    // Get current month rejections
    const currentMonthStart = new Date()
    currentMonthStart.setDate(1)
    currentMonthStart.setHours(0, 0, 0, 0)

    const rejectionsThisMonth = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(articles)
      .where(
        and(
          eq(articles.status, 'rejected'),
          gte(articles.updatedAt, currentMonthStart)
        )
      )

    // Get current year citations (placeholder - would need actual citation tracking)
    const currentYear = new Date().getFullYear()
    const citationsThisYear = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(articles)
      .where(
        and(
          eq(articles.status, 'published'),
          sql`EXTRACT(YEAR FROM updated_at) = ${currentYear}`
        )
      )

    // Calculate acceptance rate
    const totalDecisions = metrics.accepted + metrics.rejected
    const acceptanceRate = totalDecisions > 0 ? (metrics.accepted / totalDecisions) * 100 : 0

    // Get submissions requiring EIC attention
    const pendingDecisions = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(articles)
      .where(
        sql`status IN ('technical_check', 'under_review') AND (
          editor_id IS NULL OR 
          EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400 > 30
        )`
      )

    return NextResponse.json({
      success: true,
      metrics: {
        totalSubmissions: metrics.totalSubmissions,
        acceptanceRate: Math.round(acceptanceRate * 10) / 10,
        averageReviewTime: Math.round(metrics.avgReviewTime || 0),
        impactFactor: 3.2, // Static for now - would need impact factor calculation
        citationsThisYear: citationsThisYear[0]?.count || 0,
        rejectionsThisMonth: rejectionsThisMonth[0]?.count || 0,
        pendingDecisions: pendingDecisions[0]?.count || 0,
        statusBreakdown: {
          technicalCheck: metrics.technicalCheck,
          underReview: metrics.underReview,
          revisionRequested: metrics.revisionRequested,
          accepted: metrics.accepted,
          rejected: metrics.rejected,
          published: metrics.published,
        }
      },
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/editor-in-chief/metrics` })
    return NextResponse.json({ success: false, error: "Failed to fetch journal metrics" }, { status: 500 })
  }
}
