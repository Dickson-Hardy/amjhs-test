import { NextRequest, NextResponse } from "next/server"
import * as crypto from "crypto"
import { requireAuth, ROLES } from "@/lib/api-utils"
import { 
  createApiResponse, 
  createErrorResponse, 
  validateRequest,
  withErrorHandler,
  handleDatabaseError
} from "@/lib/api-utils"
import { db } from "@/lib/db"
import { news } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { logger } from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"

// Validation schemas
const CreateNewsSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().min(1, "Excerpt is required").max(500, "Excerpt too long"),
  type: z.enum(["announcement", "update", "news", "alert"]).default("announcement"),
  category: z.string().optional().default(""),
  authorName: z.string().optional().default("Editorial Team"),
  isPublished: z.boolean().default(false),
  tags: z.array(z.string()).optional().default([])
})

// GET - Fetch all news items (admin only)
async function getNews(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  const session = await requireAuth(request, [ROLES.ADMIN])
  
  logger.api("Admin news fetch requested", {
    userId: session.user.id,
    requestId,
    endpoint: "/api/admin/news"
  })

  try {
    // Fetch all news items (including unpublished)
    const newsItems = await db.select({
      id: news.id,
      title: news.title,
      content: news.content,
      excerpt: news.excerpt,
      type: news.type,
      category: news.category,
      authorName: news.authorName,
      publishedAt: news.publishedAt,
      isPublished: news.isPublished,
      slug: news.slug,
      tags: news.tags,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt
    }).from(news)
    .orderBy(desc(news.createdAt))

    logger.api("Admin news fetch completed", {
      userId: session.user.id,
      newsCount: newsItems.length,
      requestId
    })

    return createApiResponse(
      { news: newsItems },
      "News items retrieved successfully",
      requestId
    )

  } catch (error) {
    return handleDatabaseError(error)
  }
}

// POST - Create new news item
async function createNews(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  const session = await requireAuth(request, [ROLES.ADMIN])
  
  logger.api("Admin news creation requested", {
    userId: session.user.id,
    requestId,
    endpoint: "/api/admin/news"
  })

  try {
    const body = await request.json()
    const validatedData = validateRequest(CreateNewsSchema, body)

    // Generate slug from title
    const slug = validatedData.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)

    // Create news item
    const [newNewsItem] = await db.insert(news).values({
      id: uuidv4(),
      title: validatedData.title,
      content: validatedData.content,
      excerpt: validatedData.excerpt,
      type: validatedData.type,
      category: validatedData.category,
      authorName: validatedData.authorName,
      publishedAt: validatedData.isPublished ? new Date() : null,
      isPublished: validatedData.isPublished,
      slug,
      tags: validatedData.tags,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()

    logger.api("News item created successfully", {
      userId: session.user.id,
      newsId: newNewsItem.id,
      title: validatedData.title,
      type: validatedData.type,
      isPublished: validatedData.isPublished,
      requestId
    })

    return createApiResponse(
      { news: newNewsItem },
      "News item created successfully",
      requestId
    )

  } catch (error) {
    return handleDatabaseError(error)
  }
}

export const GET = withErrorHandler(getNews)
export const POST = withErrorHandler(createNews)
