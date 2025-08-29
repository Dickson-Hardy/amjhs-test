import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, review_assignments } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { sendReviewInvitation } from "@/lib/email-hybrid"
import { logError } from "@/lib/logger"

const assignmentSchema = z.object({
  submissionId: z.string(),
  reviewerId: z.string(),
  assignedBy: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has section editor role or higher
    const allowedRoles = ["section-editor", "managing-editor", "editor-in-chief", "admin"]
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { submissionId, reviewerId, assignedBy } = assignmentSchema.parse(body)

    // Verify the submission exists and is assigned to this editor
    const submission = await db
      .select()
      .from(articles)
      .where(eq(articles.id, submissionId))
      .limit(1)

    if (!submission.length) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    if (submission[0].editorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized for this submission" }, { status: 403 })
    }

    // Check if reviewer is already assigned to this submission
    const existingAssignment = await db
      .select()
      .from(review_assignments)
      .where(and(
        eq(review_assignments.articleId, submissionId),
        eq(review_assignments.reviewerId, reviewerId)
      ))
      .limit(1)

    if (existingAssignment.length > 0) {
      return NextResponse.json({ error: "Reviewer already assigned to this submission" }, { status: 400 })
    }

    // Create new review assignment
    await db.insert(review_assignments).values({
      articleId: submissionId,
      reviewerId: reviewerId,
      assignedBy: session.user.id,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      status: "assigned"
    })

    // Update article status to under_review if not already
    if (submission[0].status === "technical_check" || submission[0].status === "submitted") {
      await db
        .update(articles)
        .set({ 
          status: "under_review",
          updatedAt: new Date()
        })
        .where(eq(articles.id, submissionId))
    }

    // Update reviewer_ids array in articles table
    const currentReviewerIds = submission[0].reviewerIds || []
    if (!currentReviewerIds.includes(reviewerId)) {
      await db
        .update(articles)
        .set({
          reviewerIds: [...currentReviewerIds, reviewerId],
          updatedAt: new Date()
        })
        .where(eq(articles.id, submissionId))
    }    // Send notification email to reviewer (simplified implementation)
    try {
      // This would be implemented with proper email service
      // For now, we'll just log the assignment
      logger.error(`Review assignment created for submission ${submissionId} to reviewer ${reviewerId}`)
    } catch (emailError) {
      logError(emailError as Error, {
        operation: "assign_reviewer_email",
        reviewerId: reviewerId,
        articleId: submissionId
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Reviewer assigned successfully" 
    })

  } catch (error) {
    logger.error("Error assigning reviewer:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
