import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, reviews } from "@/lib/db/schema"
import { eq, sql, and } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request, context: { params: Promise<{ section: string }> | { section: string } }) {
  try {
    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params);
    const section = decodeURIComponent(params.section);
    const session = await getServerSession(authOptions)
    
    // Check if user has editor permissions
    const allowedRoles = ["section-editor", "managing-editor", "editor-in-chief", "admin"]
    if (!session?.user || !allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get section statistics
    const statsResult = await db
      .select({
        totalSubmissions: sql<number>`COUNT(*)`,
        technicalCheck: sql<number>`COUNT(CASE WHEN status = 'technical_check' THEN 1 END)`,
        underReview: sql<number>`COUNT(CASE WHEN status = 'under_review' THEN 1 END)`,
        revisionRequested: sql<number>`COUNT(CASE WHEN status = 'revision_requested' THEN 1 END)`,
        accepted: sql<number>`COUNT(CASE WHEN status = 'accepted' THEN 1 END)`,
        published: sql<number>`COUNT(CASE WHEN status = 'published' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN status = 'rejected' THEN 1 END)`,
        avgReviewTime: sql<number>`
          AVG(EXTRACT(EPOCH FROM (updated_at - submitted_date)) / 86400)
          FILTER (WHERE status IN ('accepted', 'rejected', 'published'))
        `,
      })
      .from(articles)
      .where(eq(articles.category, section))

    const stats = statsResult[0] || {
      totalSubmissions: 0,
      technicalCheck: 0,
      underReview: 0,
      revisionRequested: 0,
      accepted: 0,
      published: 0,
      rejected: 0,
      avgReviewTime: 0,
    }

    // Get pending actions count (items that need editor attention)
    const pendingActionsResult = await db
      .select({
        pendingActions: sql<number>`COUNT(*)`
      })
      .from(articles)
      .where(
        and(
          eq(articles.category, section),
          sql`status IN ('technical_check', 'revision_requested')`
        )
      )

    const pendingActions = pendingActionsResult[0]?.pendingActions || 0

    // Get recent activity counts (last 30 days)
    const recentActivityResult = await db
      .select({
        recentSubmissions: sql<number>`COUNT(CASE WHEN submitted_date >= NOW() - INTERVAL '30 days' THEN 1 END)`,
        recentDecisions: sql<number>`COUNT(CASE WHEN updated_at >= NOW() - INTERVAL '30 days' AND status IN ('accepted', 'rejected', 'published') THEN 1 END)`,
      })
      .from(articles)
      .where(eq(articles.category, section))

    const recentActivity = recentActivityResult[0] || {
      recentSubmissions: 0,
      recentDecisions: 0,
    }

    // Calculate acceptance rate
    const totalDecisions = stats.accepted + stats.rejected
    const acceptanceRate = totalDecisions > 0 ? (stats.accepted / totalDecisions) * 100 : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmissions: stats.totalSubmissions,
        technicalCheck: stats.technicalCheck,
        underReview: stats.underReview,
        revisionRequested: stats.revisionRequested,
        accepted: stats.accepted,
        published: stats.published,
        rejected: stats.rejected,
        pendingActions,
        averageReviewTime: Math.round(stats.avgReviewTime || 0),
        acceptanceRate: Math.round(acceptanceRate * 10) / 10,
        recentSubmissions: recentActivity.recentSubmissions,
        recentDecisions: recentActivity.recentDecisions,
      },
      section,
    })
  } catch (error) {
    const params = await Promise.resolve(context.params);
    const section = params.section;
    logError(error as Error, { endpoint: `/api/sections/${section}/stats` })
    return NextResponse.json({ success: false, error: "Failed to fetch section stats" }, { status: 500 })
  }
}
