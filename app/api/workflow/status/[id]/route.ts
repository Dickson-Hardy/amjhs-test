import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { workflowManager } from "@/lib/workflow"
import { logError } from "@/lib/logger"
import { z } from "zod"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Status update schema
const statusUpdateSchema = z.object({
  newStatus: z.enum([
    "draft", "submitted", "technical_check", "under_review", 
    "revision_requested", "revision_submitted", "accepted", 
    "rejected", "published", "withdrawn"
  ]),
  notes: z.string().optional(),
  assigneeId: z.string().optional(),
  deadline: z.string().optional(),
  metadata: z.record(z.string()).optional()
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await Promise.resolve(context.params)
    const submissionId = params.id

    const body = await request.json()
    const validation = statusUpdateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { newStatus, notes, assigneeId, deadline, metadata } = validation.data

    // Check if user has permission to update this submission
    const canUpdate = await checkUpdatePermission(session.user, submissionId, newStatus)
    if (!canUpdate) {
      return NextResponse.json({ 
        error: "Insufficient permissions to update this submission" 
      }, { status: 403 })
    }

    // Update submission status through workflow manager
    const result = await workflowManager.updateSubmissionStatus(
      submissionId,
      newStatus,
      session.user.id,
      notes
    )

    if (!result.success) {
      return NextResponse.json({ 
        error: result.message || "Status update failed" 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      submissionId,
      newStatus,
      updatedAt: new Date().toISOString(),
      message: result.message,
      nextSteps: getNextSteps(newStatus)
    })

  } catch (error) {
    logError(error as Error, { endpoint: `/api/workflow/status/${context.params}`, operation: "PUT" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await Promise.resolve(context.params)
    const submissionId = params.id

    // Get workflow status and history from database
    try {
      const [submission] = await db
        .select()
        .from(submissions)
        .where(eq(submissions.id, submissionId))
        .limit(1)

      if (!submission) {
        return NextResponse.json({
          error: "Submission not found"
        }, { status: 404 })
      }

      // Check permissions
      if (session.user.role !== "admin" && 
          session.user.role !== "editor" && 
          submission.authorId !== session.user.id) {
        return NextResponse.json({
          error: "Access denied"
        }, { status: 403 })
      }

      return NextResponse.json({
        success: true,
        submissionId,
        currentStatus: submission.status,
        statusHistory: submission.statusHistory || [],
        submittedAt: submission.submittedAt,
        lastUpdated: submission.updatedAt,
        estimatedCompletion: getEstimatedCompletion(submission.status),
        nextSteps: getNextSteps(submission.status)
      })
    } catch (error) {
      logError(error as Error, { endpoint: `/api/workflow/status/${submissionId}`, operation: "GET" })
      return NextResponse.json({
        error: "Failed to retrieve workflow status"
      }, { status: 500 })
    }

  } catch (error) {
    logError(error as Error, { endpoint: `/api/workflow/status/${context.params}`, operation: "GET" })
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

// Helper function to check update permissions
async function checkUpdatePermission(user: { id: string; role: string }, submissionId: string, newStatus: string): Promise<boolean> {
  try {
    // Get submission details
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1)

    if (!submission) {
      return false
    }

    // Admin can update anything
    if (user.role === "admin") {
      return true
    }

    // Authors can only withdraw their own submissions or submit revisions
    if (user.role === "author") {
      if (submission.authorId !== user.id) {
        return false
      }
      return ["withdrawn", "revision_submitted"].includes(newStatus)
    }

    // Editors can update most statuses except final publication
    if (user.role === "editor" || 
        user.role === "editor-in-chief" || 
        user.role === "section-editor") {
      const allowedStatuses = [
        "technical_check", "under_review", "revision_requested", 
        "accepted", "rejected"
      ]
      return allowedStatuses.includes(newStatus)
    }

    // Reviewers cannot update submission status directly
    return false
  } catch (error) {
    logError(error as Error, { operation: "checkUpdatePermission", submissionId, userId: user.id })
    return false
  }
}

// Helper function to get next steps based on status
function getNextSteps(status: string): string[] {
  const nextStepsMap: Record<string, string[]> = {
    draft: ["Submit for review"],
    submitted: ["Technical check", "Editor assignment"],
    technical_check: ["Editor assignment", "Reviewer selection"],
    under_review: ["Review completion", "Editorial decision"],
    revision_requested: ["Author revision", "Resubmission"],
    revision_submitted: ["Review of revision", "Final decision"],
    accepted: ["Production", "Publication"],
    rejected: ["Archive", "Author notification"],
    published: ["Archive", "Citation tracking"],
    withdrawn: ["Archive", "Author notification"]
  }
  
  return nextStepsMap[status] || []
}

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