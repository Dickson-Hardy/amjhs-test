import { db } from "./db"
import { pageViews, articles } from "./db/schema"
import { eq, sql, and, gte, lte } from "drizzle-orm"

export interface ArticleMetrics {
  views: number
  uniqueViews: number
  averageTimeOnPage: number
  bounceRate: number
  referrers: { source: string; count: number }[]
  dailyViews: { date: string; views: number }[]
}

export async function calculateArticleMetrics(
  articleId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ArticleMetrics> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  const end = endDate || new Date()

  try {
    // Get total views
    const totalViews = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.articleId, articleId),
          gte(pageViews.timestamp, start),
          lte(pageViews.timestamp, end)
        )
      )

    // Get unique views (distinct IP addresses)
    const uniqueViews = await db
      .select({ count: sql<number>`count(distinct ${pageViews.ipAddress})` })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.articleId, articleId),
          gte(pageViews.timestamp, start),
          lte(pageViews.timestamp, end)
        )
      )

    // Get average time on page (mock calculation)
    const avgTimeQuery = await db
      .select({ 
        avgTime: sql<number>`avg(coalesce(${pageViews.timeOnPage}, 0))` 
      })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.articleId, articleId),
          gte(pageViews.timestamp, start),
          lte(pageViews.timestamp, end)
        )
      )

    // Get referrers
    const referrersQuery = await db
      .select({
        source: pageViews.referrer,
        count: sql<number>`count(*)`
      })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.articleId, articleId),
          gte(pageViews.timestamp, start),
          lte(pageViews.timestamp, end)
        )
      )
      .groupBy(pageViews.referrer)
      .orderBy(sql`count(*) desc`)
      .limit(10)

    // Get daily views
    const dailyViewsQuery = await db
      .select({
        date: sql<string>`date(${pageViews.timestamp})`,
        views: sql<number>`count(*)`
      })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.articleId, articleId),
          gte(pageViews.timestamp, start),
          lte(pageViews.timestamp, end)
        )
      )
      .groupBy(sql`date(${pageViews.timestamp})`)
      .orderBy(sql`date(${pageViews.timestamp})`)

    // Calculate bounce rate (simplified - pages with time on page < 10 seconds)
    const bounces = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.articleId, articleId),
          gte(pageViews.timestamp, start),
          lte(pageViews.timestamp, end),
          sql`coalesce(${pageViews.timeOnPage}, 0) < 10`
        )
      )

    const views = totalViews[0]?.count || 0
    const unique = uniqueViews[0]?.count || 0
    const avgTime = avgTimeQuery[0]?.avgTime || 0
    const bounceCount = bounces[0]?.count || 0
    const bounceRate = views > 0 ? (bounceCount / views) * 100 : 0

    return {
      views,
      uniqueViews: unique,
      averageTimeOnPage: avgTime,
      bounceRate,
      referrers: referrersQuery.map(r => ({
        source: r.source || 'Direct',
        count: r.count
      })),
      dailyViews: dailyViewsQuery.map(d => ({
        date: d.date,
        views: d.views
      }))
    }
  } catch (error) {
    logger.error('Error calculating article metrics:', error)
    return {
      views: 0,
      uniqueViews: 0,
      averageTimeOnPage: 0,
      bounceRate: 0,
      referrers: [],
      dailyViews: []
    }
  }
}

export async function getTopArticles(limit: number = 10): Promise<Array<{
  id: string
  title: string
  views: number
  uniqueViews: number
}>> {
  try {
    const topArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        views: sql<number>`count(${pageViews.id})`,
        uniqueViews: sql<number>`count(distinct ${pageViews.ipAddress})`
      })
      .from(articles)
      .leftJoin(pageViews, eq(articles.id, pageViews.articleId))
      .groupBy(articles.id, articles.title)
      .orderBy(sql`count(${pageViews.id}) desc`)
      .limit(limit)

    return topArticles
  } catch (error) {
    logger.error('Error getting top articles:', error)
    return []
  }
}

export async function getTotalSiteMetrics(): Promise<{
  totalViews: number
  uniqueVisitors: number
  totalArticles: number
  avgViewsPerArticle: number
}> {
  try {
    const [totalViews, uniqueVisitors, totalArticles] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(pageViews),
      db.select({ count: sql<number>`count(distinct ${pageViews.ipAddress})` }).from(pageViews),
      db.select({ count: sql<number>`count(*)` }).from(articles)
    ])

    const views = totalViews[0]?.count || 0
    const visitors = uniqueVisitors[0]?.count || 0
    const articlesCount = totalArticles[0]?.count || 0
    const avgViews = articlesCount > 0 ? views / articlesCount : 0

    return {
      totalViews: views,
      uniqueVisitors: visitors,
      totalArticles: articlesCount,
      avgViewsPerArticle: avgViews
    }
  } catch (error) {
    logger.error('Error getting site metrics:', error)
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      totalArticles: 0,
      avgViewsPerArticle: 0
    }
  }
}
