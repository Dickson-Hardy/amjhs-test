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
      logError(dbError as Error, { endpoint: '/api/news', message: 'News table not available, using fallback data' })
    }

    // Return only database news items - no fallbacks
    if (newsItems.length === 0) {
      return NextResponse.json({
        success: true,
        news: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      })
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
