import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, reviews } from "@/lib/db/schema"
import { eq, desc, sql, and, gte } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params);
    const id = params.id;
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.id !== id && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get recent activities for the user
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get recent article submissions and updates
    const recentArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        status: articles.status,
        submittedDate: articles.submittedDate,
        createdAt: articles.createdAt,
        category: articles.category
      })
      .from(articles)
      .where(
        and(
          eq(articles.authorId, id),
          gte(articles.updatedAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(articles.updatedAt))
      .limit(10)

    // Get recent reviews received
    const recentReviews = await db
      .select({
        id: reviews.id,
        articleId: reviews.articleId,
        articleTitle: articles.title,
        submittedAt: reviews.submittedAt,
        status: reviews.status,
        createdAt: reviews.createdAt
      })
      .from(reviews)
      .innerJoin(articles, eq(reviews.articleId, articles.id))
      .where(
        and(
          eq(articles.authorId, id),
          gte(reviews.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(reviews.createdAt))
      .limit(10)

    // Generate activity feed
    const activities = []

    // Add article activities
    for (const article of recentArticles) {
      let activityType = "submission"
      let description = "submitted"
      let icon = "FileText"
      let color = "text-blue-600"

      switch (article.status) {
        case "under_review":
          activityType = "review_started"
          description = "is now under review"
          icon = "Eye"
          color = "text-orange-600"
          break
        case "published":
          activityType = "published"
          description = "has been published"
          icon = "CheckCircle"
          color = "text-green-600"
          break
        case "revision_requested":
          activityType = "revision_requested"
          description = "requires revision"
          icon = "AlertCircle"
          color = "text-red-600"
          break
      }

      activities.push({
        id: `article-${article.id}`,
        type: activityType,
        title: `Article "${article.title}"`,
        description: description,
        timestamp: article.createdAt || article.submittedDate,
        icon: icon,
        color: color,
        metadata: {
          articleId: article.id,
          category: article.category,
          status: article.status
        }
      })
    }

    // Add review activities
    for (const review of recentReviews) {
      activities.push({
        id: `review-${review.id}`,
        type: "review_received",
        title: `Review received for "${review.articleTitle}"`,
        description: "received new peer review feedback",
        timestamp: review.submittedAt || review.createdAt,
        icon: "MessageSquare",
        color: "text-purple-600",
        metadata: {
          articleId: review.articleId,
          reviewId: review.id,
          reviewStatus: review.status
        }
      })
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return timeB - timeA
    })

    // Add some general system activities if there are few activities
    if (activities.length < 3) {
      activities.push(
        {
          id: "welcome",
          type: "system",
          title: "Welcome to AMHSJ Research Portal",
          description: "Your dashboard is ready for manuscript submissions",
          timestamp: new Date().toISOString(),
          icon: "Star",
          color: "text-indigo-600",
          metadata: {}
        },
        {
          id: "tip",
          type: "tip",
          title: "Submission Guidelines Updated",
          description: "Review the latest author guidelines for better submission success",
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          icon: "BookOpen",
          color: "text-blue-600",
          metadata: {}
        }
      )
    }

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, 15) // Limit to 15 most recent activities
    })
  } catch (error) {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    logError(error as Error, { endpoint: `/api/users/${id}/activities` })
    return NextResponse.json({ success: false, error: "Failed to fetch activities" }, { status: 500 })
  }
}
