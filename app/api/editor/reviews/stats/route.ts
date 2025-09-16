import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { review_assignments } from "@/lib/db/schema"
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

    // Get total reviews count
    const totalReviews = await db
      .select({ count: count() })
      .from(review_assignments)
      .then(result => result[0]?.count || 0)

    // Get completed reviews count
    const completedReviews = await db
      .select({ count: count() })
      .from(review_assignments)
      .where(eq(review_assignments.status, "completed"))
      .then(result => result[0]?.count || 0)

    // Get pending reviews count
    const pendingReviews = await db
      .select({ count: count() })
      .from(review_assignments)
      .where(eq(review_assignments.status, "assigned"))
      .then(result => result[0]?.count || 0)

    // Get overdue reviews count (due date passed but not completed)
    const overdueReviews = await db
      .select({ count: count() })
      .from(review_assignments)
      .where(
        and(
          sql`${review_assignments.dueDate} < NOW()`,
          eq(review_assignments.status, "assigned")
        )
      )
      .then(result => result[0]?.count || 0)

    // Calculate average completion time (in days)
    const avgCompletionTime = await db
      .select({
        avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${review_assignments.completedAt} - ${review_assignments.assignedAt}))/86400)`
      })
      .from(review_assignments)
      .where(eq(review_assignments.status, "completed"))
      .then(result => Math.round(result[0]?.avgTime || 0))

    // Calculate average review score
    const avgScore = await db
      .select({
        avgScore: sql<number>`AVG(${review_assignments.reviewScore})`
      })
      .from(review_assignments)
      .where(eq(review_assignments.status, "completed"))
      .then(result => Math.round((result[0]?.avgScore || 0) * 10) / 10)

    // Calculate on-time completion rate
    const onTimeRate = totalReviews > 0 
      ? Math.round(((completedReviews - overdueReviews) / totalReviews) * 100)
      : 0

    const metrics = {
      totalReviews,
      completedReviews,
      pendingReviews,
      overdueReviews,
      averageCompletionTime: avgCompletionTime,
      averageScore: avgScore,
      onTimeRate
    }

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    console.error("Error fetching review stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch review statistics" },
      { status: 500 }
    )
  }
}