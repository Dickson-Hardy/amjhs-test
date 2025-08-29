import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, reviews, reviewerProfiles } from "@/lib/db/schema"
import { eq, count, avg, and, desc } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["editor", "admin"].includes((session.user as unknown).role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all reviewers with their profiles and statistics
    const reviewerResults = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        expertise: users.expertise,
        lastActiveAt: users.lastActiveAt,
        // Reviewer profile data
        profileId: reviewerProfiles.id,
        availabilityStatus: reviewerProfiles.availabilityStatus,
        maxReviewsPerMonth: reviewerProfiles.maxReviewsPerMonth,
        currentReviewLoad: reviewerProfiles.currentReviewLoad,
        averageReviewTime: reviewerProfiles.averageReviewTime,
        completedReviews: reviewerProfiles.completedReviews,
        lateReviews: reviewerProfiles.lateReviews,
        qualityScore: reviewerProfiles.qualityScore,
        lastReviewDate: reviewerProfiles.lastReviewDate,
        isActive: reviewerProfiles.isActive,
      })
      .from(users)
      .leftJoin(reviewerProfiles, eq(users.id, reviewerProfiles.userId))
      .where(eq(users.role, "reviewer"))

    // Get additional statistics for each reviewer
    const reviewers = await Promise.all(
      reviewerResults.map(async (reviewer) => {
        // Get pending reviews count
        const [pendingReviewsResult] = await db.select({ count: count() })
          .from(reviews)
          .where(and(
            eq(reviews.reviewerId, reviewer.id),
            eq(reviews.status, "pending")
          ))

        // Get average rating from submitted reviews
        const [averageRatingResult] = await db.select({ avg: avg(reviews.rating) })
          .from(reviews)
          .where(and(
            eq(reviews.reviewerId, reviewer.id),
            eq(reviews.status, "completed")
          ))

        // Calculate on-time rate
        const totalCompleted = reviewer.completedReviews || 0
        const lateReviews = reviewer.lateReviews || 0
        const onTimeRate = totalCompleted > 0 
          ? Math.round(((totalCompleted - lateReviews) / totalCompleted) * 100)
          : 100

        return {
          id: reviewer.id,
          name: reviewer.name,
          email: reviewer.email,
          expertise: reviewer.expertise || [],
          availabilityStatus: reviewer.availabilityStatus || 'available',
          currentLoad: pendingReviewsResult.count || reviewer.currentReviewLoad || 0,
          maxReviewsPerMonth: reviewer.maxReviewsPerMonth || 3,
          averageRating: Number(averageRatingResult.avg) || reviewer.qualityScore || 0,
          averageReviewTime: reviewer.averageReviewTime || null,
          completedReviews: reviewer.completedReviews || 0,
          onTimeRate,
          lastActive: reviewer.lastActiveAt || reviewer.lastReviewDate,
          isActive: reviewer.isActive !== false, // Default to true if null
        }
      })
    )

    // Sort by availability and quality
    const sortedReviewers = reviewers.sort((a, b) => {
      // First sort by availability status
      if (a.availabilityStatus !== b.availabilityStatus) {
        const statusOrder = { 'available': 0, 'limited': 1, 'unavailable': 2 }
        return (statusOrder[a.availabilityStatus as keyof typeof statusOrder] || 3) - 
               (statusOrder[b.availabilityStatus as keyof typeof statusOrder] || 3)
      }
      
      // Then by current load (ascending)
      if (a.currentLoad !== b.currentLoad) {
        return a.currentLoad - b.currentLoad
      }
      
      // Finally by quality score (descending)
      return b.averageRating - a.averageRating
    })

    return NextResponse.json({
      success: true,
      reviewers: sortedReviewers,
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/editors/reviewers" })
    return NextResponse.json({ success: false, error: "Failed to fetch reviewers" }, { status: 500 })
  }
}
