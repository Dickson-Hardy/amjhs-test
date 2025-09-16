import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, review_assignments, reviewerProfiles } from "@/lib/db/schema"
import { eq, count, sql, avg, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has editor permissions
    if (!["editor", "section-editor", "managing-editor", "editor-in-chief", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get total reviewers count
    const totalReviewers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "reviewer"))
      .then(result => result[0]?.count || 0)

    // Get active reviewers count
    const activeReviewers = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.role, "reviewer"),
          eq(users.isActive, true),
          eq(users.applicationStatus, "approved")
        )
      )
      .then(result => result[0]?.count || 0)

    // Get available reviewers count (active reviewers with current load less than max)
    const availableReviewersResult = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .leftJoin(reviewerProfiles, eq(reviewerProfiles.userId, users.id))
      .where(
        and(
          eq(users.role, "reviewer"),
          eq(users.isActive, true),
          eq(users.applicationStatus, "approved"),
          sql`COALESCE((
            SELECT COUNT(*)
            FROM ${review_assignments}
            WHERE ${review_assignments.reviewerId} = ${users.id}
            AND ${review_assignments.status} IN ('assigned', 'accepted', 'in_progress')
          ), 0) < COALESCE(${reviewerProfiles.maxReviewsPerMonth}, 3)`
        )
      )
      .then(result => result[0]?.count || 0)

    // Get overloaded reviewers count (at or above capacity)
    const overloadedReviewersResult = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .leftJoin(reviewerProfiles, eq(reviewerProfiles.userId, users.id))
      .where(
        and(
          eq(users.role, "reviewer"),
          eq(users.isActive, true),
          sql`COALESCE((
            SELECT COUNT(*)
            FROM ${review_assignments}
            WHERE ${review_assignments.reviewerId} = ${users.id}
            AND ${review_assignments.status} IN ('assigned', 'accepted', 'in_progress')
          ), 0) >= COALESCE(${reviewerProfiles.maxReviewsPerMonth}, 3)`
        )
      )
      .then(result => result[0]?.count || 0)

    // Calculate average response time across all reviewers
    const avgResponseTime = await db
      .select({
        avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${review_assignments.completedAt} - ${review_assignments.assignedAt}))/86400)`
      })
      .from(review_assignments)
      .innerJoin(users, eq(review_assignments.reviewerId, users.id))
      .where(
        and(
          eq(users.role, "reviewer"),
          eq(review_assignments.status, "completed")
        )
      )
      .then(result => Math.round(result[0]?.avgTime || 14))

    // Calculate average quality score across all reviewers
    const avgQualityScore = await db
      .select({
        avgScore: sql<number>`AVG(${review_assignments.reviewScore})`
      })
      .from(review_assignments)
      .innerJoin(users, eq(review_assignments.reviewerId, users.id))
      .where(
        and(
          eq(users.role, "reviewer"),
          eq(review_assignments.status, "completed")
        )
      )
      .then(result => Math.round((result[0]?.avgScore || 4.0) * 10) / 10)

    const stats = {
      totalReviewers,
      activeReviewers,
      availableReviewers: availableReviewersResult,
      overloadedReviewers: overloadedReviewersResult,
      averageResponseTime: avgResponseTime,
      averageQualityScore: avgQualityScore
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error("Error fetching reviewer stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviewer statistics" },
      { status: 500 }
    )
  }
}