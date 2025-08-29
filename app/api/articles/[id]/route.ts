import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, users, reviews } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { CacheManager } from "@/lib/cache"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: articleId } = await params
  try {

    // Try to get from cache first
    const cached = await CacheManager.getCachedArticle(articleId)
    if (cached) {
      return NextResponse.json({ success: true, article: cached })
    }

    const [article] = await db
      .select({
        id: articles.id,
        title: articles.title,
        abstract: articles.abstract,
        content: articles.content,
        keywords: articles.keywords,
        category: articles.category,
        status: articles.status,
        doi: articles.doi,
        volume: articles.volume,
        issue: articles.issue,
        pages: articles.pages,
        publishedDate: articles.publishedDate,
        submittedDate: articles.submittedDate,
        views: articles.views,
        downloads: articles.downloads,
        authorName: users.name,
        authorEmail: users.email,
        authorAffiliation: users.affiliation,
        authorOrcid: users.orcid,
        reviewCount: sql<number>`(
          SELECT COUNT(*) FROM ${reviews} 
          WHERE ${reviews.articleId} = ${articles.id}
        )`,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.id, articleId))

    if (!article) {
      return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 })
    }

    // Increment view count
    await db
      .update(articles)
      .set({ views: sql`${articles.views} + 1` })
      .where(eq(articles.id, articleId))

    // Cache the article
    await CacheManager.cacheArticle(articleId, article)

    return NextResponse.json({ success: true, article })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/articles/${articleId}` })
    return NextResponse.json({ success: false, error: "Failed to fetch article" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: articleId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Check if user owns the article or is admin/editor
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId))

    if (!article) {
      return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 })
    }

    if (article.authorId !== session.user.id && !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [updatedArticle] = await db
      .update(articles)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, articleId))
      .returning()

    // Invalidate cache
    await CacheManager.del(`article:${articleId}`)

    return NextResponse.json({ success: true, article: updatedArticle })
  } catch (error) {
    logError(error as Error, { endpoint: `/api/articles/${articleId} PUT` })
    return NextResponse.json({ success: false, error: "Failed to update article" }, { status: 500 })
  }
}
