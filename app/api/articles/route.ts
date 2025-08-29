import { type NextRequest } from "next/server"
import { z } from "zod"
import * as crypto from "crypto"
import { requireAuth, ROLES } from "@/lib/api-utils"
import { 
  createApiResponse, 
  createErrorResponse, 
  createPaginatedResponse,
  validateRequest,
  withErrorHandler
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq, desc, ilike, and } from "drizzle-orm"

// Validation schemas
const createArticleSchema = z.object({
  title: z.string().min(10),
  abstract: z.string().min(100),
  keywords: z.array(z.string()).min(3),
  category: z.string(),
  authorId: z.string().uuid(),
})

const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  year: z.string().optional(),
  featured: z.string().optional(),
  current: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData = validateRequest(querySchema, Object.fromEntries(searchParams))
    
    const search = queryData.search
    const category = queryData.category
    const year = queryData.year
    const featured = queryData.featured === "true"
    const current = queryData.current === "true"
    const page = Number.parseInt(queryData.page || "1")
    const limit = Number.parseInt(queryData.limit || "10")
    const offset = (page - 1) * limit

    logger.api("Fetching articles", { 
      requestId, 
      search, 
      category, 
      year, 
      featured, 
      current, 
      page, 
      limit 
    })

    let query = db.select().from(articles)
    const conditions = []

    // Only show published articles
    conditions.push(eq(articles.status, "published"))

    if (search) {
      conditions.push(ilike(articles.title, `%${search}%`))
    }
    if (category && category !== "all") {
      conditions.push(eq(articles.category, category))
    }
    if (year && year !== "all") {
      // Add year filtering logic
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    let orderBy = desc(articles.publishedDate)
    
    // Handle featured articles (high impact/views)
    if (featured) {
      orderBy = desc(articles.views)
    }
    
    // Handle current issue (most recent)
    if (current) {
      orderBy = desc(articles.publishedDate)
    }

    const result = await query.orderBy(orderBy).limit(limit).offset(offset) as any[]

    // Get total count for pagination
    const totalQuery = db.select().from(articles)
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions))
    }
    const totalResults = await totalQuery

    logger.api("Articles fetched successfully", { 
      requestId, 
      count: result.length, 
      total: totalResults.length 
    })

    return createPaginatedResponse(
      result,
      page,
      limit,
      totalResults.length,
      "Articles fetched successfully",
      requestId
    )
  } catch (error) {
    logger.error("Failed to fetch articles", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Require authentication for article creation
    const session = await requireAuth(request, [ROLES.ADMIN])
    
    logger.api("Creating new article", { 
      requestId, 
      userId: session.user.id, 
      userRole: session.user.role 
    })

    const body = await request.json()
    const validatedData = validateRequest(createArticleSchema, body)

    // Check if user can edit this article
    if (article.author_id !== session.user.id && 
        ![ROLES.ADMIN, ROLES.ASSOCIATE_EDITOR].includes(session.user.role as any)) {
      logger.security("Unauthorized article creation attempt", {
        requestId,
        userId: session.user.id,
        userRole: session.user.role,
        attemptedAuthorId: validatedData.authorId
      })
      throw new Error("Can only submit articles for yourself")
    }

    const [newArticle] = await db
      .insert(articles)
      .values({
        ...validatedData,
        status: "submitted",
        submittedDate: new Date(),
      })
      .returning()

    logger.api("Article created successfully", { 
      requestId, 
      articleId: newArticle.id, 
      authorId: validatedData.authorId 
    })

    return createApiResponse(
      { article: newArticle },
      "Article created successfully",
      requestId
    )
  } catch (error) {
    logger.error("Failed to create article", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    const session = await requireAuth(request, [ROLES.ADMIN, ROLES.ASSOCIATE_EDITOR])
    
    logger.api("Article deletion request", { 
      requestId, 
      userId: session.user.id, 
      userRole: session.user.role 
    })

    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get("id")

    if (!articleId) {
      return createErrorResponse(
        "Article ID is required",
        400,
        requestId
      )
    }

    // Check if article exists and user has permission
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1)

    if (!article) {
      return createErrorResponse(
        "Article not found",
        404,
        requestId
      )
    }

    // Only allow deletion if article is in draft or rejected status
    if (!['draft', 'rejected', 'withdrawn'].includes(article.status)) {
      return createErrorResponse(
        "Can only delete articles in draft, rejected, or withdrawn status",
        400,
        requestId
      )
    }

    // Soft delete the article
    const [deletedArticle] = await db
      .update(articles)
      .set({ 
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(articles.id, articleId))
      .returning({ id: articles.id, title: articles.title })

    logger.api("Article deleted successfully", { 
      requestId, 
      articleId: deletedArticle.id, 
      title: deletedArticle.title,
      deletedBy: session.user.id
    })

    return createApiResponse(
      { articleId: deletedArticle.id },
      "Article deleted successfully",
      requestId
    )
  } catch (error) {
    logger.error("Failed to delete article", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})
