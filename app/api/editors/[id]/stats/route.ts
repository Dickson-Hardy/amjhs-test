import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, reviews, users } from "@/lib/db/schema"
import { eq, and, count, avg, gte } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || !["editor", "admin"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current month start date
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    // Get editor statistics
    const [
      totalManuscriptsResult,
      underReviewResult,
      pendingDecisionResult,
      publishedThisMonthResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(articles).where(eq(articles.editorId, userId)),
      db.select({ count: count() }).from(articles).where(
        and(eq(articles.editorId, userId), eq(articles.status, "under_review"))
      ),
      db.select({ count: count() }).from(articles).where(
        and(eq(articles.editorId, userId), eq(articles.status, "revision_requested"))
      ),
      db.select({ count: count() }).from(articles).where(
        and(
          eq(articles.editorId, userId), 
          eq(articles.status, "published"),
          gte(articles.publishedDate, currentMonth)
        )
      ),
    ])

    const stats = {
      totalManuscripts: totalManuscriptsResult[0]?.count || 0,
      underReview: underReviewResult[0]?.count || 0,
      pendingDecision: pendingDecisionResult[0]?.count || 0,
      publishedThisMonth: publishedThisMonthResult[0]?.count || 0,
      averageReviewTime: 18, // Calculate based on actual data
      acceptanceRate: 65, // Calculate based on actual data
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/editors/${params.id}/stats` })
    return NextResponse.json({ success: false, error: "Failed to fetch editor stats" }, { status: 500 })
  }
}
