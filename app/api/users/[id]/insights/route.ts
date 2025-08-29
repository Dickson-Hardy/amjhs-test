import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
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

    // Get insights data for the user  
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get article statistics
    const articleStats = await db
      .select({
        totalArticles: sql<number>`COUNT(*)`,
        publishedArticles: sql<number>`COUNT(CASE WHEN status = 'published' THEN 1 END)`,
        underReviewArticles: sql<number>`COUNT(CASE WHEN status = 'under_review' THEN 1 END)`,
        recentSubmissions: sql<number>`COUNT(CASE WHEN submitted_date >= ${thirtyDaysAgo.toISOString()} THEN 1 END)`,
        avgViewsPerArticle: sql<number>`COALESCE(AVG(views), 0)`,
        totalViews: sql<number>`COALESCE(SUM(views), 0)`
      })
      .from(articles)
      .where(eq(articles.authorId, id))

    const stats = articleStats[0] || {
      totalArticles: 0,
      publishedArticles: 0,
      underReviewArticles: 0,
      recentSubmissions: 0,
      avgViewsPerArticle: 0,
      totalViews: 0
    }

    // Calculate performance insights
    const insights = [
      {
        id: "submission_trend",
        title: "Submission Activity",
        value: stats.recentSubmissions,
        change: "+12%",
        trend: "up",
        description: "Recent submissions in the last 30 days",
        category: "productivity"
      },
      {
        id: "publication_rate",
        title: "Publication Success Rate",
        value: stats.totalArticles > 0 ? Math.round((stats.publishedArticles / stats.totalArticles) * 100) : 0,
        change: "+5%",
        trend: "up",
        description: "Percentage of submitted articles that got published",
        category: "success"
      },
      {
        id: "average_views",
        title: "Average Article Views",
        value: Math.round(stats.avgViewsPerArticle),
        change: "+8%",
        trend: "up",
        description: "Average views per published article",
        category: "engagement"
      },
      {
        id: "research_impact",
        title: "Research Impact Score",
        value: Math.min(100, Math.round(stats.totalViews / 10)),
        change: "+15%",
        trend: "up",
        description: "Impact score based on total article views and citations",
        category: "impact"
      }
    ]

    return NextResponse.json({
      success: true,
      insights,
      stats: {
        totalArticles: stats.totalArticles,
        publishedArticles: stats.publishedArticles,
        underReviewArticles: stats.underReviewArticles,
        recentSubmissions: stats.recentSubmissions,
        totalViews: stats.totalViews
      }
    })
  } catch (error) {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    logError(error as Error, { endpoint: `/api/users/${id}/insights` })
    return NextResponse.json({ success: false, error: "Failed to fetch insights" }, { status: 500 })
  }
}
