import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, articles, reviews, userApplications } from "@/lib/db/schema"
import { count, eq, and, gte, lt } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current date for calculations
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Get total users
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users)

    // Get user growth this month
    const newUsersThisMonth = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thisMonth))

    // Get total articles
    const totalArticlesResult = await db
      .select({ count: count() })
      .from(articles)

    // Get published articles this month
    const publishedThisMonth = await db
      .select({ count: count() })
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          gte(articles.updatedAt, thisMonth)
        )
      )

    // Get pending reviews
    const pendingReviewsResult = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.status, "pending"))

    // Get active reviewers (reviewers with at least one review in the last 3 months)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const activeReviewersResult = await db
      .select({ 
        reviewerId: reviews.reviewerId 
      })
      .from(reviews)
      .where(gte(reviews.submittedAt, threeMonthsAgo))
      .groupBy(reviews.reviewerId)

    // Get pending applications
    let pendingApplicationsResult = [{ count: 0 }]
    try {
      pendingApplicationsResult = await db
        .select({ count: count() })
        .from(userApplications)
        .where(eq(userApplications.status, "pending"))
    } catch (error) {
      // Table might not exist
    }

    // Calculate monthly growth
    const lastMonthUsers = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          gte(users.createdAt, lastMonth),
          lt(users.createdAt, thisMonth)
        )
      )

    const monthlyGrowth = lastMonthUsers[0]?.count > 0 
      ? ((newUsersThisMonth[0]?.count || 0) / lastMonthUsers[0].count) * 100
      : 0

    // Calculate system health (mock calculation)
    const systemHealth = Math.min(100, Math.max(90, 100 - (pendingReviewsResult[0]?.count || 0)))

    const stats = {
      totalUsers: totalUsersResult[0]?.count || 0,
      totalArticles: totalArticlesResult[0]?.count || 0,
      pendingReviews: pendingReviewsResult[0]?.count || 0,
      publishedThisMonth: publishedThisMonth[0]?.count || 0,
      systemHealth,
      activeReviewers: activeReviewersResult.length,
      pendingApplications: pendingApplicationsResult[0]?.count || 0,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      newUsersThisMonth: newUsersThisMonth[0]?.count || 0,
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    logError(error as Error, { endpoint: '/api/admin/dashboard-stats' })
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
