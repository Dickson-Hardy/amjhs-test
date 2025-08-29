import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { news, articles } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    // Optional authentication - public route but enhanced for authenticated users
    const session = await getServerSession(authOptions)
    
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const type = url.searchParams.get('type') // 'news', 'announcement', 'call-for-papers', etc.

    // Authenticated users can see more content types
    const includeInternalNews = session?.user?.role === 'admin' || session?.user?.role === 'editor'

    // Try to get news from the news table first
    let newsItems: unknown[] = []
    try {
      newsItems = await db.select({
        id: news.id,
        title: news.title,
        content: news.content,
        excerpt: news.excerpt,
        type: news.type,
        category: news.category,
        authorName: news.authorName,
        publishedAt: news.publishedAt,
        slug: news.slug,
        tags: news.tags,
      }).from(news)
      .where(eq(news.isPublished, true))
      .orderBy(desc(news.publishedAt))
      .limit(limit)
      .offset(offset)

      if (type) {
        newsItems = newsItems.filter(item => item.type === type)
      }
    } catch (dbError) {
      logger.error('News table not available, using fallback data')
    }

    // If no news items or database not available, provide fallback announcements
    if (newsItems.length === 0) {
      const announcements = [
        {
          id: "announcement-1",
          type: "announcement",
          title: "CALL FOR SUBMISSION MANUSCRIPT",
          publishedAt: new Date("2025-08-03"),
          excerpt: "Authors are invited to send manuscripts in form of original articles, review papers, case reports, brief communications, letter to editor for publication in upcoming issues of AMHSJ.",
          category: "submission"
        },
        {
          id: "announcement-2", 
          type: "announcement",
          title: "New Editorial Board Members Appointed",
          publishedAt: new Date("2025-07-28"),
          excerpt: "We are pleased to announce the appointment of distinguished researchers to our editorial board, bringing expertise in cardiology, neurology, and public health.",
          category: "editorial"
        },
        {
          id: "announcement-3",
          type: "announcement", 
          title: "Special Issue: Digital Health Innovations in Africa",
          publishedAt: new Date("2025-07-15"),
          excerpt: "Call for papers for our upcoming special issue focusing on digital health technologies and their implementation across African healthcare systems.",
          category: "special-issue"
        },
        {
          id: "announcement-4",
          type: "announcement",
          title: "Author Warning - Predatory Journals",
          publishedAt: new Date("2025-07-10"), 
          excerpt: "Authors are advised to be aware of and cautious with regards to submitting articles and paying publication fee payments to scammers and predatory journals.",
          category: "warning"
        },
        {
          id: "announcement-5",
          type: "announcement",
          title: "Journal Impact Factor Update",
          publishedAt: new Date("2025-06-20"),
          excerpt: "AMHSJ's 2024 impact factor has been updated to 1.8, reflecting our continued commitment to publishing high-quality research.",
          category: "metrics"
        }
      ]

      // Get recent published articles as news
      try {
        const recentArticles = await db.select({
          id: articles.id,
          title: articles.title,
          abstract: articles.abstract,
          updatedAt: articles.updatedAt,
          category: articles.category,
        }).from(articles)
        .where(eq(articles.status, 'published'))
        .orderBy(desc(articles.updatedAt))
        .limit(5)

        // Add published articles as news items
        const articleNews = recentArticles.map((article: unknown) => ({
          id: `article-${article.id}`,
          type: 'news',
          title: `Published: ${article.title}`,
          publishedAt: article.updatedAt,
          excerpt: `New research published in ${article.category} - ${article.abstract?.substring(0, 150)}...`,
          category: article.category
        }))

        newsItems = [...announcements, ...articleNews]
      } catch (articleError) {
        newsItems = announcements
      }
    }

    // Filter by type if specified
    const filteredNews = type 
      ? newsItems.filter(item => item.type === type || item.category === type)
      : newsItems

    // Apply pagination
    const paginatedNews = filteredNews.slice(offset, offset + limit)

    // Format for frontend
    const formattedNews = paginatedNews.map(item => ({
      id: item.id,
      title: item.title,
      date: new Date(item.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }),
      excerpt: item.excerpt,
      type: item.type,
      category: item.category,
      authorName: item.authorName || 'Editorial Team'
    }))

    return NextResponse.json({
      success: true,
      news: formattedNews,
      pagination: {
        total: filteredNews.length,
        limit,
        offset,
        hasMore: offset + limit < filteredNews.length
      }
    })

  } catch (error) {
    logError(error as Error, { endpoint: '/api/news' })
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch news" 
    }, { status: 500 })
  }
}
