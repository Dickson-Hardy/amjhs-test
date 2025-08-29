import { NextRequest } from "next/server"
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
import { submissions, articles } from "@/lib/db/schema"
import { eq, and, sql, desc } from "drizzle-orm"
import { workflowManager } from "@/lib/workflow"

// Validation schemas
const querySchema = z.object({
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

// Validation schema for submission
const submissionSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  abstract: z.string().min(100, "Abstract must be at least 100 characters").max(2000, "Abstract too long"),
  keywords: z.array(z.string().min(1)).min(3, "At least 3 keywords required").max(10, "Maximum 10 keywords"),
  category: z.string().min(1, "Category is required"),
  authors: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    affiliation: z.string().optional(),
    orcid: z.string().optional(),
    isCorrespondingAuthor: z.boolean().default(false)
  })).min(1, "At least one author required"),
  files: z.array(z.object({
    url: z.string().url(),
    type: z.string(),
    name: z.string(),
    fileId: z.string()
  })).min(1, "At least one file required"),
  recommendedReviewers: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    affiliation: z.string(),
    expertise: z.string()
  })).optional(),
  coverLetter: z.string().optional(),
  ethicalApproval: z.boolean().default(false),
  conflictOfInterest: z.boolean().default(false),
  funding: z.string().optional()
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Require authentication for submission creation
    const session = await requireAuth(request, [ROLES.AUTHOR, ROLES.ASSOCIATE_EDITOR, ROLES.ADMIN])
    
    logger.api("Creating new submission", { 
      requestId, 
      userId: session.user.id, 
      userRole: session.user.role 
    })

    const body = await request.json()
    const validatedData = validateRequest(submissionSchema, body)
    const authorId = session.user.id

    // Check if user has active draft submissions limit
    const activeDrafts = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(
        eq(submissions.authorId, authorId),
        eq(submissions.status, "draft")
      ))

    if (activeDrafts.length >= 5) {
      logger.api("Draft submission limit exceeded", { 
        requestId, 
        userId: authorId, 
        activeDrafts: activeDrafts.length 
      })
      throw new Error("Maximum 5 active drafts allowed")
    }

    // Submit article through workflow manager
    const result = await workflowManager.submitArticle(validatedData, authorId)

    if (!result.success) {
      logger.error("Workflow submission failed", { 
        requestId, 
        userId: authorId, 
        message: result.message 
      })
      throw new Error(result.message || "Submission failed")
    }

    logger.api("Submission created successfully", { 
      requestId, 
      submissionId: result.submissionId, 
      articleId: result.article?.id 
    })

    return createApiResponse(
      {
        submissionId: result.submissionId,
        articleId: result.article?.id
      },
      "Submission created successfully",
      requestId
    )
  } catch (error) {
    logger.error("Failed to create submission", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Require authentication for viewing submissions
    const session = await requireAuth(request)
    
    logger.api("Fetching submissions", { 
      requestId, 
      userId: session.user.id, 
      userRole: session.user.role 
    })

    const { searchParams } = new URL(request.url)
    const queryData = validateRequest(querySchema, Object.fromEntries(searchParams))
    
    const status = queryData.status
    const page = parseInt(queryData.page || "1")
    const limit = parseInt(queryData.limit || "20")
    const offset = (page - 1) * limit

    let query = db
      .select({
        id: submissions.id,
        articleId: submissions.articleId,
        authorId: submissions.authorId,
        status: submissions.status,
        submittedAt: submissions.submittedAt,
        createdAt: submissions.createdAt,
        updatedAt: submissions.updatedAt,
        // Include article information
        articleTitle: articles.title,
        articleAbstract: articles.abstract,
        articleCategory: articles.category,
        articleKeywords: articles.keywords,
        articleStatus: articles.status
      })
      .from(submissions)
      .leftJoin(articles, eq(submissions.articleId, articles.id))

    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)

    // Filter by user role
    if (session.user.role === ROLES.AUTHOR) {
      query = query.where(eq(submissions.authorId, session.user.id))
      countQuery = countQuery.where(eq(submissions.authorId, session.user.id))
    }

    // Apply filters
    if (status) {
      const statusCondition = eq(submissions.status, status)
      query = query.where(statusCondition)
      countQuery = countQuery.where(statusCondition)
    }

    // Get total count for pagination
    const [{ count }] = await countQuery

    // Get paginated results
    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(submissions.createdAt))

    logger.api("Submissions fetched successfully", { 
      requestId, 
      count: results.length, 
      total: count 
    })

    return createPaginatedResponse(
      results,
      page,
      limit,
      count,
      "Submissions fetched successfully",
      requestId
    )
  } catch (error) {
    logger.error("Failed to fetch submissions", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
}) 