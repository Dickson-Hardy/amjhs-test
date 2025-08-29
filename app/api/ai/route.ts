import { NextRequest } from "next/server"
import { z } from "zod"
import * as crypto from "crypto"
import {
  requireAuth,
  createApiResponse,
  createErrorResponse,
  validateRequest,
  withErrorHandler,
  ROLES
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { aiAssessmentService } from "@/lib/ai-assessment"
import { externalIntegrationsService } from "@/lib/external-integrations"
import { apiRateLimit } from "@/lib/rate-limit"

// Request validation schemas
const AssessManuscriptSchema = z.object({
  manuscriptId: z.string(),
  content: z.object({
    title: z.string(),
    abstract: z.string(),
    content: z.string(),
    keywords: z.array(z.string()),
    references: z.array(z.string()),
    methodology: z.string().optional(),
    dataAvailability: z.string().optional(),
    ethicsStatement: z.string().optional()
  })
})

const PlagiarismCheckSchema = z.object({
  manuscriptId: z.string(),
  content: z.string()
})

const ReviewerMatchSchema = z.object({
  manuscriptId: z.string(),
  keywords: z.array(z.string()),
  category: z.string(),
  excludeIds: z.array(z.string()).optional()
})

const ImpactPredictionSchema = z.object({
  content: z.object({
    title: z.string(),
    abstract: z.string(),
    content: z.string(),
    keywords: z.array(z.string()),
    references: z.array(z.string())
  }),
  authorMetrics: z.object({
    hIndex: z.number().optional(),
    totalCitations: z.number().optional(),
    recentPublications: z.number().optional(),
    averageCitations: z.number().optional()
  }).optional()
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit.isAllowed(request)
    if (!rateLimitResult.allowed) {
      logger.security("AI API rate limit exceeded", { 
        requestId, 
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime 
      })
      throw new Error("Rate limit exceeded")
    }

    // Require authentication with elevated permissions
    const { user } = await requireAuth(request, [ROLES.ADMIN, ROLES.ASSOCIATE_EDITOR, ROLES.REVIEWER])
    
    logger.api("AI API request", { 
      requestId, 
      userId: user.id, 
      userRole: user.role 
    })

    const body = await request.json()
    const action = body.action

    let result
    switch (action) {
      case "assess-manuscript":
        result = await handleManuscriptAssessment(body, user.id)
        break
      case "check-plagiarism":
        result = await handlePlagiarismCheck(body, user.id)
        break
      case "find-reviewers":
        result = await handleReviewerMatching(body, user.id)
        break
      case "predict-impact":
        result = await handleImpactPrediction(body, user.id)
        break
      case "get-assessment":
        result = await handleGetAssessment(body, user.id)
        break
      default:
        logger.api("Invalid AI action requested", { requestId, action })
        throw new Error("Invalid action")
    }

    logger.api("AI API request completed", { requestId, action })
    return result
  } catch (error) {
    logger.error("AI API error", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Require authentication
    const { user } = await requireAuth(request, [ROLES.ADMIN, ROLES.ASSOCIATE_EDITOR, ROLES.REVIEWER])
    
    logger.api("AI API GET request", { 
      requestId, 
      userId: user.id, 
      userRole: user.role 
    })

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")
    const manuscriptId = searchParams.get("manuscriptId")

    let result
    switch (action) {
      case "get-assessment":
        if (!manuscriptId) {
          throw new Error("Manuscript ID required")
        }
        result = await handleGetAssessment({ manuscriptId }, user.id)
        break
      
      case "get-assessments":
        result = await handleGetAssessments(user.id, user.role)
        break
      
      default:
        logger.api("Invalid AI GET action requested", { requestId, action })
        throw new Error("Invalid action")
    }

    logger.api("AI API GET request completed", { requestId, action })
    return result
  } catch (error) {
    logger.error("AI API GET error", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})

async function handleManuscriptAssessment(body: any, userId: string) {
  try {
    const validatedData = AssessManuscriptSchema.parse(body)
    
    // Check if user has permission to assess this manuscript
    const hasPermission = await checkManuscriptPermission(
      validatedData.manuscriptId, 
      userId
    )
    
    if (!hasPermission) {
      throw new Error("No permission to assess this manuscript")
    }

    logger.api("Starting AI manuscript assessment", { 
      manuscriptId: validatedData.manuscriptId,
      userId 
    })

    // Mock assessment - replace with actual service call
    const assessment = {
      manuscriptId: validatedData.manuscriptId,
      qualityScore: 85,
      recommendations: ["Improve methodology section", "Add more references"],
      assessedAt: new Date().toISOString()
    }

    return createApiResponse(
      assessment,
      "Manuscript assessment completed",
      crypto.randomUUID()
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid request data: ${error.errors.map(e => e.message).join(', ')}`)
    }
    logger.error("Manuscript assessment failed", { error, userId })
    throw error
  }
}

async function handlePlagiarismCheck(body: any, userId: string) {
  try {
    const validatedData = PlagiarismCheckSchema.parse(body)
    
    const hasPermission = await checkManuscriptPermission(
      validatedData.manuscriptId, 
      userId
    )
    
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to check plagiarism for this manuscript"
      }, { status: 403 })
    }

    logger.info("Starting plagiarism check", { 
      manuscriptId: validatedData.manuscriptId,
      userId 
    })

    const result = await aiAssessmentService.checkPlagiarism(
      validatedData.manuscriptId,
      validatedData.content
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error("Plagiarism check failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Plagiarism check failed"
    }, { status: 500 })
  }
}

async function handleReviewerMatching(body: any, userId: string) {
  try {
    const validatedData = ReviewerMatchSchema.parse(body)
    
    const hasPermission = await checkManuscriptPermission(
      validatedData.manuscriptId, 
      userId
    )
    
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to find reviewers for this manuscript"
      }, { status: 403 })
    }

    logger.info("Finding optimal reviewers", { 
      manuscriptId: validatedData.manuscriptId,
      userId,
      keywordCount: validatedData.keywords.length
    })

    const reviewers = await aiAssessmentService.findOptimalReviewers(
      validatedData.manuscriptId,
      validatedData.keywords,
      validatedData.category,
      validatedData.excludeIds
    )

    return NextResponse.json({
      success: true,
      data: {
        reviewers,
        totalFound: reviewers.length,
        searchCriteria: {
          keywords: validatedData.keywords,
          category: validatedData.category
        }
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error("Reviewer matching failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Reviewer matching failed"
    }, { status: 500 })
  }
}

async function handleImpactPrediction(body: any, userId: string) {
  try {
    const validatedData = ImpactPredictionSchema.parse(body)

    logger.info("Predicting research impact", { userId })

    const prediction = await aiAssessmentService.predictResearchImpact(
      validatedData.content,
      validatedData.authorMetrics
    )

    return NextResponse.json({
      success: true,
      data: prediction
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    logger.error("Impact prediction failed", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Impact prediction failed"
    }, { status: 500 })
  }
}

async function handleGetAssessment(body: any, userId: string) {
  try {
    const { manuscriptId } = body

    if (!manuscriptId) {
      return NextResponse.json({
        success: false,
        error: "Manuscript ID required"
      }, { status: 400 })
    }

    const hasPermission = await checkManuscriptPermission(manuscriptId, userId)
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: "No permission to view assessment for this manuscript"
      }, { status: 403 })
    }

    // Get the most recent assessment
    const assessment = await aiAssessmentService.getAssessment(manuscriptId)

    if (!assessment) {
      return NextResponse.json({
        success: false,
        error: "No assessment found for this manuscript"
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: assessment
    })
  } catch (error) {
    logger.error("Failed to get assessment", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Failed to retrieve assessment"
    }, { status: 500 })
  }
}

async function handleGetAssessments(userId: string, userRole: string) {
  try {
    // Only admins and editors can view all assessments
    if (!["admin", "editor"].includes(userRole)) {
      return NextResponse.json({
        success: false,
        error: "Insufficient permissions"
      }, { status: 403 })
    }

    // Get recent assessments with manuscript info
    const assessments = await aiAssessmentService.getRecentAssessments(50)

    return NextResponse.json({
      success: true,
      data: {
        assessments,
        total: assessments.length
      }
    })
  } catch (error) {
    logger.error("Failed to get assessments", { error, userId })
    return NextResponse.json({
      success: false,
      error: "Failed to retrieve assessments"
    }, { status: 500 })
  }
}

async function checkManuscriptPermission(manuscriptId: string, userId: string): Promise<boolean> {
  try {
    // Implementation would check if user has permission to access the manuscript
    // This could be based on:
    // - User is the author
    // - User is assigned as reviewer
    // - User is editor/admin
    // - Manuscript is in user's area of expertise
    
    // For now, return true for demo purposes
    // In production, implement proper permission checking
    return true
  } catch (error) {
    logger.error("Permission check failed", { error, manuscriptId, userId })
    return false
  }
}
