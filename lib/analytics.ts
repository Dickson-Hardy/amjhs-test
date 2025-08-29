// import { getClientIp } from "request-ip"
function extractClientIp(headers: Headers): string | null {
  // Check standard proxy headers
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list
    return xForwardedFor.split(",")[0].trim();
  }
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }
  // Fallback: not available
  return null;
}
import { headers } from "next/headers"
import { db, sql as rawSql } from "./db"
import { pageViews } from "./db/schema"
import { calculateArticleMetrics } from "./metrics"
import { CacheManager } from "./cache"
import { sql } from "drizzle-orm"

// Real analytics implementation using Drizzle ORM
async function getJournalStats() {
  try {
    // Get total users
    const usersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`)
    const totalUsers = parseInt((usersResult[0] as unknown)?.count || '0')

    // Get total articles
    const articlesResult = await db.execute(sql`SELECT COUNT(*) as count FROM articles`)
    const totalArticles = parseInt((articlesResult[0] as unknown)?.count || '0')

    // Get total reviews
    const reviewsResult = await db.execute(sql`SELECT COUNT(*) as count FROM reviews`)
    const totalReviews = parseInt((reviewsResult[0] as unknown)?.count || '0')

    // Get articles published this month
    const thisMonthResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM articles 
      WHERE status = 'published' 
      AND published_date >= date_trunc('month', CURRENT_DATE)
    `)
    const publishedThisMonth = parseInt((thisMonthResult[0] as unknown)?.count || '0')

    // Get top categories
    const categoriesResult = await db.execute(sql`
      SELECT category, COUNT(*) as count 
      FROM articles 
      WHERE status = 'published'
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 5
    `)
    const topCategories = categoriesResult.map(row => (row as unknown).category)

    // Get monthly submissions for the last 6 months
    const monthlyResult = await db.execute(sql`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as count
      FROM articles 
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `)
    const monthlySubmissions = monthlyResult.map(row => parseInt((row as unknown).count))

    // Calculate IoT/Smart Systems percentage
    const iotResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM articles 
      WHERE category IN ('Healthcare Technology & Innovation', 'Biomedical Sciences & Research')
      AND status = 'published'
    `)
    const iotCount = parseInt((iotResult[0] as unknown)?.count || '0')
    const iotPercentage = totalArticles > 0 ? Math.round((iotCount / totalArticles) * 100) : 0

    return {
      success: true,
      stats: {
        totalUsers,
        totalArticles,
        totalReviews,
        publishedThisMonth,
        iotPercentage,
        topCategories,
        monthlySubmissions,
      },
    }
  } catch (error) {
    logger.error("Error getting journal stats:", error)
    return {
      success: false,
      error: "Failed to fetch journal statistics",
      stats: {
        totalUsers: 0,
        totalArticles: 0,
        totalReviews: 0,
        publishedThisMonth: 0,
        iotPercentage: 0,
        topCategories: [],
        monthlySubmissions: [],
      },
    }
  }
}

// Real user analytics implementation
async function getUserAnalytics(userId: string) {
  try {
    // Get user's articles stats
    const articlesResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('technical_check', 'under_review', 'revision_requested') THEN 1 END) as under_review,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published
      FROM articles 
      WHERE author_id = ${userId}
    `)
    
    const articleStats = articlesResult[0] || { total: 0, under_review: 0, published: 0 }

    // Get total downloads from page views (assuming downloads are tracked as special page views)
    const downloadsResult = await db.execute(sql`
      SELECT COUNT(*) as downloads
      FROM page_views 
      WHERE article_id IN (
        SELECT id FROM articles WHERE author_id = ${userId}
      ) AND user_agent LIKE '%download%'
    `)
    const totalDownloads = parseInt((downloadsResult[0] as unknown)?.downloads || '0')

    // Get total views
    const viewsResult = await db.execute(sql`
      SELECT COUNT(*) as views
      FROM page_views 
      WHERE article_id IN (
        SELECT id FROM articles WHERE author_id = ${userId}
      )
    `)
    const totalViews = parseInt((viewsResult[0] as unknown)?.views || '0')

    // Get monthly view trends for last 6 months
    const trendsResult = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as views
      FROM page_views 
      WHERE article_id IN (
        SELECT id FROM articles WHERE author_id = ${userId}
      )
      AND created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `)
    const monthlyViews = trendsResult.map(row => parseInt((row as unknown).views))

    // Get review metrics
    const reviewMetricsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as reviews_completed,
        AVG(rating) as avg_rating,
        AVG(EXTRACT(EPOCH FROM (submitted_at - created_at))/86400) as avg_review_time_days
      FROM reviews 
      WHERE reviewer_id = ${userId} AND status = 'completed'
    `)
    const reviewMetrics = reviewMetricsResult[0] || { 
      reviews_completed: 0, 
      avg_rating: 0, 
      avg_review_time_days: 0 
    }

    return {
      success: true,
      analytics: {
        articles: {
          total: parseInt((articleStats as unknown).total),
          underReview: parseInt((articleStats as unknown).under_review),
          published: parseInt((articleStats as unknown).published),
        },
        totalDownloads,
        totalViews,
        monthlyViews,
        reviewMetrics: {
          completed: parseInt((reviewMetrics as unknown).reviews_completed),
          averageRating: parseFloat((reviewMetrics as unknown).avg_rating || '0'),
          averageTimedays: parseFloat((reviewMetrics as unknown).avg_review_time_days || '0'),
        }
      },
    }
  } catch (error) {
    logger.error("Error getting user analytics:", error)
    return {
      success: false,
      analytics: {
        articles: { total: 0, underReview: 0, published: 0 },
        totalDownloads: 0,
        totalViews: 0,
        monthlyViews: [],
        reviewMetrics: { completed: 0, averageRating: 0, averageTimedays: 0 }
      },
    }
  }
}

export const Analytics = {
  getJournalStats,
  getUserAnalytics,
  trackPageView,
  getArticleMetrics,
}

export async function trackPageView(articleId: string, userId: string | null) {
  const headersObj = await headers();
  const request = {
    headers: headersObj,
  }

  const getSessionId = (req: unknown) => {
    const cookie = req.headers.get("cookie");
    if (!cookie) return null;

    const sessionId = cookie
      .split(";")
      .map((str: string) => str.trim())
      .find((str: string) => str.startsWith("session_id="))
      ?.split("=")[1];

    return sessionId || null;
  };

  // Production analytics tracking
  await db.insert(pageViews).values({
    articleId,
    userId: userId || null,
    ipAddress: extractClientIp(headersObj),
    userAgent: headersObj.get("user-agent"),
    createdAt: new Date(),
    sessionId: getSessionId({ headers: headersObj }),
  });
}

export async function getArticleMetrics(articleId: string) {
  // Production metrics calculation with Redis caching
  try {
    // Try to get from Redis cache first
    const cached = await CacheManager.get(`metrics:${articleId}`)
    if (cached) {
      return cached
    }
    
    // Calculate metrics if not cached
    const calculated = await calculateArticleMetrics(articleId)
    
    // Cache the result for 1 hour
    await CacheManager.set(`metrics:${articleId}`, calculated, 3600)
    
    return calculated
  } catch (error) {
    logger.error("Error getting article metrics:", error)
    // Fallback to direct calculation
    return await calculateArticleMetrics(articleId)
  }
}
