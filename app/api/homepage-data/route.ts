
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { eq, desc, and } from "drizzle-orm"
import { articles, issues, users, news, journal_settings } from "@/lib/db/schema"

export async function GET() {
  try {
    // Execute all queries in parallel for better performance
    const [
      featuredArticlesData,
      currentIssueData,
      newsData,
      journalInfoData,
      statsData
    ] = await Promise.all([
      // Featured articles
      db
        .select({
          id: articles.id,
          title: articles.title,
          abstract: articles.abstract,
          category: articles.category,
          authorId: articles.authorId,
          coAuthors: articles.coAuthors,
          publishedDate: articles.publishedDate,
          views: articles.views,
          downloads: articles.downloads,
          citations: articles.citations,
          doi: articles.doi,
        })
        .from(articles)
        .where(eq(articles.status, "published"))
        .orderBy(desc(articles.views), desc(articles.citations))
        .limit(6),

      // Current issue (latest published issue with its articles)
      db
        .select()
        .from(issues)
        .where(eq(issues.status, "published"))
        .orderBy(desc(issues.publishedDate))
        .limit(1),

      // Latest news
      db
        .select({
          id: news.id,
          title: news.title,
          excerpt: news.excerpt,
          publishedAt: news.publishedAt,
          category: news.category,
          type: news.type,
          authorName: news.authorName
        })
        .from(news)
        .where(eq(news.isPublished, true))
        .orderBy(desc(news.publishedAt))
        .limit(5),

      // Journal info
      db
        .select()
        .from(journal_settings)
        .limit(1),

      // Basic stats (lightweight queries)
      Promise.all([
        db.select({ count: articles.id }).from(articles).where(eq(articles.status, "published")),
        db.select({ count: users.id }).from(users),
        db.select({ count: issues.id }).from(issues).where(eq(issues.status, "published")),
        // Get aggregate stats for published articles
        db
          .select({
            downloads: articles.downloads,
            citations: articles.citations,
            views: articles.views,
          })
          .from(articles)
          .where(eq(articles.status, "published"))
      ])
    ])

    // Process current issue
    let currentIssue = null
    let currentIssueArticles = []
    
    if (currentIssueData.length > 0) {
      currentIssue = currentIssueData[0]
      
      // Get articles for current issue
      const issueArticles = await db
        .select({
          id: articles.id,
          title: articles.title,
          abstract: articles.abstract,
          category: articles.category,
          authorId: articles.authorId,
          coAuthors: articles.coAuthors,
          publishedDate: articles.publishedDate,
          pages: articles.pages,
          doi: articles.doi,
        })
        .from(articles)
        .where(
          and(
            eq(articles.status, "published"),
            eq(articles.volume, currentIssue.number?.toString() || "1"),
            eq(articles.issue, currentIssue.number?.toString() || "1")
          )
        )
        .orderBy(desc(articles.publishedDate))
        .limit(3) // Only get first 3 for homepage display

      currentIssueArticles = issueArticles
    }

    // Calculate stats
    const [articlesCount, usersCount, issuesCount, articlesMetrics] = statsData
    const calculatedStats = {
      totalArticles: articlesCount.length,
      totalUsers: usersCount.length,
      totalIssues: issuesCount.length,
      totalDownloads: articlesMetrics.reduce((sum, article) => sum + (article.downloads || 0), 0),
      totalCitations: articlesMetrics.reduce((sum, article) => sum + (article.citations || 0), 0),
      totalViews: articlesMetrics.reduce((sum, article) => sum + (article.views || 0), 0),
    }

    // Format news data for frontend consumption
    const formattedNews = newsData.map(item => ({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'No date',
      category: item.category,
      type: item.type,
      authorName: item.authorName || 'Editorial Team'
    }))

    // Get journal info with stats
    const journalData = journalInfoData.length > 0 ? journalInfoData[0] : null
    
    return NextResponse.json({
      success: true,
      data: {
        featuredArticles: featuredArticlesData,
        currentIssue: currentIssue ? {
          id: currentIssue.id,
          title: currentIssue.title,
          number: currentIssue.number,
          description: currentIssue.description,
          publishedDate: currentIssue.publishedDate,
          coverImage: currentIssue.coverImage,
          status: currentIssue.status,
          specialIssue: currentIssue.specialIssue,
          guestEditors: currentIssue.guestEditors,
        } : null,
        currentIssueArticles,
        news: formattedNews,
        journalInfo: journalData,
        stats: calculatedStats,
      }
    })

  } catch (error) {
    console.error("Error fetching homepage data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homepage data",
      },
      { status: 500 }
    )
  }
}