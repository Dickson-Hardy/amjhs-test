import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, articles, reviews, submissions, userApplications } from "@/lib/db/schema"
import { count, eq, and, gte, lt, desc, sql } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "30d"

    // Calculate date ranges
    const now = new Date()
    let startDate: Date
    
    switch (timeframe) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get user analytics
    const totalUsers = await db
      .select({ count: count() })
        .from(users)

    const newUsers = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, startDate))

    const activeUsers = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        eq(users.isActive, true),
        gte(users.lastActiveAt || users.createdAt, startDate)
      ))

    // Get submission analytics
    const totalSubmissions = await db
      .select({ count: count() })
      .from(submissions)

    const newSubmissions = await db
      .select({ count: count() })
      .from(submissions)
      .where(gte(submissions.submittedAt, startDate))

    const submissionsByStatus = await db
      .select({
        status: submissions.status,
        count: count()
      })
      .from(submissions)
      .groupBy(submissions.status)

    // Get review analytics
    const totalReviews = await db
      .select({ count: count() })
      .from(reviews)

    const pendingReviews = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.status, "pending"))

    const completedReviews = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.status, "completed"))

    const averageReviewTime = await db
      .select({
        avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${reviews.submittedAt} - ${reviews.assignedAt})) / 86400`
      })
      .from(reviews)
      .where(and(
        eq(reviews.status, "completed"),
        gte(reviews.submittedAt, startDate)
      ))

    // Get application analytics
    const pendingApplications = await db
      .select({ count: count() })
      .from(userApplications)
      .where(eq(userApplications.status, "pending"))

    const approvedApplications = await db
      .select({ count: count() })
      .from(userApplications)
      .where(and(
        eq(userApplications.status, "approved"),
        gte(userApplications.reviewedAt || userApplications.submittedAt, startDate)
      ))

    // Get system health metrics
    const systemHealth = {
      database: {
        connections: Math.floor(Math.random() * 50) + 20, // Mock data
        queryTime: Math.floor(Math.random() * 100) + 50,
        activeQueries: Math.floor(Math.random() * 10) + 5
      },
      cache: {
        hitRate: Math.floor(Math.random() * 20) + 80,
        memoryUsage: Math.floor(Math.random() * 30) + 40,
        keys: Math.floor(Math.random() * 10000) + 50000
      },
      performance: {
        responseTime: Math.floor(Math.random() * 200) + 100,
        throughput: Math.floor(Math.random() * 1000) + 500,
        errorRate: Math.floor(Math.random() * 5) + 1
      }
    }

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    
    const previousPeriodUsers = await db
      .select({ count: count() })
        .from(users)
      .where(and(
        gte(users.createdAt, previousPeriodStart),
        lt(users.createdAt, startDate)
      ))
      
    const previousPeriodSubmissions = await db
      .select({ count: count() })
        .from(submissions)
      .where(and(
        gte(submissions.submittedAt, previousPeriodStart),
        lt(submissions.submittedAt, startDate)
      ))

    const userGrowthRate = previousPeriodUsers[0]?.count > 0 
      ? ((newUsers[0]?.count || 0) / previousPeriodUsers[0].count) * 100
      : 0

    const submissionGrowthRate = previousPeriodSubmissions[0]?.count > 0
      ? ((newSubmissions[0]?.count || 0) / previousPeriodSubmissions[0].count) * 100
      : 0

    // Get top performing categories
    const topCategories = await db
      .select({
        category: articles.category,
        count: count()
      })
      .from(articles)
      .where(gte(articles.createdAt, startDate))
      .groupBy(articles.category)
      .orderBy(desc(count()))
      .limit(5)

    // Get reviewer performance
    const topReviewers = await db
      .select({
        reviewerId: reviews.reviewerId,
        completedReviews: count(),
        averageTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${reviews.submittedAt} - ${reviews.assignedAt})) / 86400`
      })
      .from(reviews)
      .where(and(
        eq(reviews.status, "completed"),
        gte(reviews.submittedAt, startDate)
      ))
      .groupBy(reviews.reviewerId)
      .orderBy(desc(count()))
      .limit(10)

    const analytics = {
      users: {
        total: totalUsers[0]?.count || 0,
        new: newUsers[0]?.count || 0,
        active: activeUsers[0]?.count || 0,
        growthRate: userGrowthRate
      },
      submissions: {
        total: totalSubmissions[0]?.count || 0,
        new: newSubmissions[0]?.count || 0,
        byStatus: submissionsByStatus,
        growthRate: submissionGrowthRate
      },
      reviews: {
        total: totalReviews[0]?.count || 0,
        pending: pendingReviews[0]?.count || 0,
        completed: completedReviews[0]?.count || 0,
        averageTime: averageReviewTime[0]?.avgTime || 0
      },
      applications: {
        pending: pendingApplications[0]?.count || 0,
        approved: approvedApplications[0]?.count || 0
      },
      systemHealth,
      topCategories,
      topReviewers,
      timeframe
    }

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/admin/analytics/dashboard" })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch analytics data" 
    }, { status: 500 })
  }
}
