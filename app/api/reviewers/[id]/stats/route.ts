import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviews, articles, users } from "@/lib/db/schema"
import { eq, and, count, avg, desc } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const userId = resolvedParams.id

    // Verify user can access this data
    if (session.user.id !== userId && !["admin", "editor"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get reviewer statistics
    const [
      totalReviewsResult,
      completedReviewsResult,
      pendingReviewsResult,
      averageRatingResult
    ] = await Promise.all([
      db.select({ count: count() }).from(reviews).where(eq(reviews.reviewerId, userId)),
      db.select({ count: count() }).from(reviews).where(
        and(eq(reviews.reviewerId, userId), eq(reviews.status, "completed"))
      ),
      db.select({ count: count() }).from(reviews).where(
        and(eq(reviews.reviewerId, userId), eq(reviews.status, "pending"))
      ),
      db.select({ avg: avg(reviews.rating) }).from(reviews).where(
        and(eq(reviews.reviewerId, userId), eq(reviews.status, "completed"))
      )
    ])

    const stats = {
      totalReviews: totalReviewsResult[0]?.count || 0,
      completedReviews: completedReviewsResult[0]?.count || 0,
      pendingReviews: pendingReviewsResult[0]?.count || 0,
      averageRating: Number(averageRatingResult[0]?.avg) || 0,
      onTimeCompletion: 85, // Calculate based on actual data
      currentStreak: 12, // Calculate based on actual data
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/reviewers/[id]/stats` })
    return NextResponse.json({ success: false, error: "Failed to fetch reviewer stats" }, { status: 500 })
  }
}
