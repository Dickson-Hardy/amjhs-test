import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { submissions, articles } from "@/lib/db/schema"
import { eq, inArray, gte, lte, sql, and, count, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editor role
    if (!["editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const section = searchParams.get("section")

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Build section filter
    let sectionFilter = undefined
    if (section && section !== "All Sections") {
      sectionFilter = eq(articles.category, section)
    }

    // Get total submissions
    const totalSubmissionsQuery = sectionFilter
      ? db.select({ count: count() }).from(submissions).innerJoin(articles, eq(submissions.articleId, articles.id)).where(sectionFilter)
      : db.select({ count: count() }).from(submissions)
    
    const totalSubmissionsResult = await totalSubmissionsQuery
    const totalSubmissions = totalSubmissionsResult[0]?.count || 0

    // Get submissions by status
    const statusCounts = await Promise.all([
      // Technical check (editorial_assistant_review)
      db.select({ count: count() })
        .from(submissions)
        .innerJoin(articles, eq(submissions.articleId, articles.id))
        .where(sectionFilter ? and(eq(submissions.status, "editorial_assistant_review"), sectionFilter) : eq(submissions.status, "editorial_assistant_review")),

      // Under review (under_review)
      db.select({ count: count() })
        .from(submissions)
        .innerJoin(articles, eq(submissions.articleId, articles.id))
        .where(sectionFilter ? and(eq(submissions.status, "under_review"), sectionFilter) : eq(submissions.status, "under_review")),

      // Pending decision (associate_editor_review, revision_requested)
      db.select({ count: count() })
        .from(submissions)
        .innerJoin(articles, eq(submissions.articleId, articles.id))
        .where(sectionFilter ? and(inArray(submissions.status, ["associate_editor_review", "revision_requested"]), sectionFilter) : inArray(submissions.status, ["associate_editor_review", "revision_requested"])),

      // Published (accepted)
      db.select({ count: count() })
        .from(submissions)
        .innerJoin(articles, eq(submissions.articleId, articles.id))
        .where(sectionFilter ? and(eq(submissions.status, "accepted"), sectionFilter) : eq(submissions.status, "accepted")),

      // Rejected
      db.select({ count: count() })
        .from(submissions)
        .innerJoin(articles, eq(submissions.articleId, articles.id))
        .where(sectionFilter ? and(eq(submissions.status, "rejected"), sectionFilter) : eq(submissions.status, "rejected"))
    ])

    const technicalCheck = statusCounts[0][0]?.count || 0
    const underReview = statusCounts[1][0]?.count || 0
    const pendingDecision = statusCounts[2][0]?.count || 0
    const published = statusCounts[3][0]?.count || 0
    const rejected = statusCounts[4][0]?.count || 0

    // Calculate average review time for completed reviews in last 90 days
    const completedReviewsQuery = sectionFilter
      ? db.select({
          createdAt: submissions.createdAt,
          updatedAt: submissions.updatedAt
        })
        .from(submissions)
        .innerJoin(articles, eq(submissions.articleId, articles.id))
        .where(
          and(
            inArray(submissions.status, ["accepted", "rejected"]),
            gte(submissions.updatedAt, ninetyDaysAgo),
            sectionFilter
          )
        )
      : db.select({
          createdAt: submissions.createdAt,
          updatedAt: submissions.updatedAt
        })
        .from(submissions)
        .where(
          and(
            inArray(submissions.status, ["accepted", "rejected"]),
            gte(submissions.updatedAt, ninetyDaysAgo)
          )
        )

    const completedReviews = await completedReviewsQuery

    let totalReviewTime = 0
    let validReviews = 0

    completedReviews.forEach(review => {
      if (review.createdAt && review.updatedAt) {
        const reviewTime = review.updatedAt.getTime() - review.createdAt.getTime()
        const reviewDays = reviewTime / (1000 * 60 * 60 * 24)
        if (reviewDays > 0 && reviewDays < 365) { // Between 0 and 1 year
          totalReviewTime += reviewDays
          validReviews++
        }
      }
    })

    const averageReviewTime = validReviews > 0 ? Math.round(totalReviewTime / validReviews) : 0

    // Get pending review count (submitted but not yet assigned)
    const pendingReviewQuery = sectionFilter
      ? db.select({ count: count() })
        .from(submissions)
        .innerJoin(articles, eq(submissions.articleId, articles.id))
        .where(
          and(
            eq(submissions.status, "submitted"),
            sectionFilter
          )
        )
      : db.select({ count: count() })
        .from(submissions)
        .where(eq(submissions.status, "submitted"))

    const pendingReviewResult = await pendingReviewQuery
    const pendingReview = pendingReviewResult[0]?.count || 0

    const stats = {
      totalSubmissions,
      pendingReview,
      underReview,
      technicalCheck,
      pendingDecision,
      published,
      averageReviewTime
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    logError(error as Error, { endpoint: "/api/editor/stats" })
    return NextResponse.json({ success: false, error: "Failed to fetch editor stats" }, { status: 500 })
  }
}

