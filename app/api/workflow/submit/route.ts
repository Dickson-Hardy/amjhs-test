import { NextRequest } from "next/server"
import { z } from "zod"
import * as crypto from "crypto"
import { requireAuth, ROLES } from "@/lib/api-utils"
import {
  createApiResponse,
  createErrorResponse,
  validateRequest,
  withErrorHandler
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { workflowManager } from "@/lib/workflow"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

// Validation schemas
const querySchema = z.object({
  submissionId: z.string().optional(),
})

// Workflow submission schema
const workflowSubmissionSchema = z.object({
  articleData: z.object({
    title: z.string().min(1),
    abstract: z.string().min(100),
    keywords: z.array(z.string()).min(3),
    category: z.string(),
    authors: z.array(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      affiliation: z.string().optional(),
      orcid: z.string().optional(),
      isCorrespondingAuthor: z.boolean().default(false)
    })),
    files: z.array(z.object({
      url: z.string(),
      type: z.string(),
      name: z.string(),
      fileId: z.string()
    })).optional(),
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
  }),
  submissionType: z.enum(["new", "revision", "resubmission"]).default("new"),
  previousSubmissionId: z.string().optional(),
  revisionNotes: z.string().optional()
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Require authentication for workflow submission
    const session = await requireAuth(request, [ROLES.AUTHOR, ROLES.ASSOCIATE_EDITOR, ROLES.ADMIN])
    
    logger.api("Submitting article to workflow", { 
      requestId, 
      userId: session.user.id, 
      userRole: session.user.role 
    })

    const body = await request.json()
    const validatedData = validateRequest(workflowSubmissionSchema, body)
    
    const { articleData, submissionType, previousSubmissionId, revisionNotes } = validatedData
    const authorId = session.user.id

    // Submit article through workflow manager
    const result = await workflowManager.submitArticle(articleData, authorId)

    if (!result.success) {
      logger.error("Workflow submission failed", { 
        requestId, 
        userId: authorId, 
        message: result.message 
      })
      throw new Error(result.message || "Workflow submission failed")
    }

    // If this is a revision, update the previous submission
    if (submissionType === "revision" && previousSubmissionId) {
      try {
        // Append superseded note to previous submission history
        await db
          .update(submissions)
          .set({
            statusHistory: sql`${submissions.statusHistory} || ${JSON.stringify([{ 
              status: "revision_superseded",
              timestamp: new Date(),
              userId: authorId,
              notes: `Superseded by submission ${result.submissionId}`,
              systemGenerated: true
            }])}::jsonb`,
            updatedAt: new Date()
          })
          .where(eq(submissions.id, previousSubmissionId))

        // Add revision notes to the new submission's history if provided
        if (revisionNotes && result.submissionId) {
          await db
            .update(submissions)
            .set({
              statusHistory: sql`${submissions.statusHistory} || ${JSON.stringify([{ 
                status: "revision_submitted",
                timestamp: new Date(),
                userId: authorId,
                notes: revisionNotes,
                systemGenerated: false
              }])}::jsonb`
            })
            .where(eq(submissions.id, result.submissionId))
        }
      } catch (revisionError) {
        logger.error("Failed to update revision history", { 
          requestId, 
          error: revisionError instanceof Error ? revisionError.message : String(revisionError) 
        })
      }
    }

    logger.api("Article submitted to workflow successfully", { 
      requestId, 
      submissionId: result.submissionId, 
      articleId: result.article?.id 
    })

    return createApiResponse(
      {
        submissionId: result.submissionId,
        articleId: result.article?.id,
        workflowStatus: "submitted",
        nextSteps: [
          "Technical check in progress",
          "Editor assignment pending",
          "Reviewer selection pending"
        ]
      },
      "Article submitted to workflow successfully",
      requestId
    )
  } catch (error) {
    logger.error("Failed to submit article to workflow", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = crypto.randomUUID()
  
  try {
    // Require authentication for workflow status check
    const { user } = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const queryData = validateRequest(querySchema, Object.fromEntries(searchParams))
    
    const submissionId = queryData.submissionId

    if (!submissionId) {
      throw new Error("Submission ID required")
    }

    logger.api("Checking workflow status", { 
      requestId, 
      userId: user.id, 
      submissionId 
    })

    // Get workflow status from database
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1)

    if (!submission) {
      throw new Error("Submission not found")
    }

    // Check permissions - user can only see their own submissions unless they're admin/editor
    if (![ROLES.ADMIN, ROLES.ASSOCIATE_EDITOR].includes(user.role) && 
        submission.authorId !== user.id) {
      logger.security("Unauthorized workflow status access attempt", {
        requestId,
        userId: user.id,
        userRole: user.role,
        submissionId,
        submissionAuthorId: submission.authorId
      })
      throw new Error("Access denied")
    }

    logger.api("Workflow status retrieved successfully", { 
      requestId, 
      submissionId, 
      status: submission.status 
    })

    return createApiResponse(
      {
        submissionId,
        workflowStatus: submission.status,
        statusHistory: submission.statusHistory || [],
        submittedAt: submission.submittedAt,
        lastUpdated: submission.updatedAt,
        estimatedCompletion: getEstimatedCompletion(submission.status),
        nextSteps: getNextSteps(submission.status)
      },
      "Workflow status retrieved successfully",
      requestId
    )
  } catch (error) {
    logger.error("Failed to retrieve workflow status", { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw error
  }
})

// Helper function to get estimated completion time
function getEstimatedCompletion(status: string): string {
  const estimations: Record<string, string> = {
    "submitted": "3-5 business days",
    "technical_check": "1-2 business days", 
    "under_review": "4-6 weeks",
    "revision_requested": "Author dependent",
    "revision_submitted": "2-3 weeks",
    "accepted": "2-4 weeks",
    "rejected": "Completed",
    "published": "Completed"
  }
  return estimations[status] || "Unknown"
}

// Helper function to get next steps
function getNextSteps(status: string): string[] {
  const nextStepsMap: Record<string, string[]> = {
    "submitted": ["Technical check", "Editor assignment"],
    "technical_check": ["Editor assignment", "Reviewer selection"],
    "under_review": ["Review completion", "Editorial decision"],
    "revision_requested": ["Author revision", "Resubmission"],
    "revision_submitted": ["Review of revision", "Final decision"],
    "accepted": ["Production", "Publication"],
    "rejected": ["Process completed"],
    "published": ["Archive", "Citation tracking"]
  }
  return nextStepsMap[status] || []
}
