import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { editorAssignments, articles, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { sendEmail } from "@/lib/email-hybrid"
import { emailTemplates } from "@/lib/email-templates"

// Validation schema for editor response
const editorResponseSchema = z.object({
  action: z.enum(["accept", "decline"]),
  conflictDeclared: z.boolean(),
  conflictDetails: z.string().optional(),
  declineReason: z.string().optional(),
  editorComments: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id
    const body = await request.json()
    
    // Validate request body
    const validationResult = editorResponseSchema.safeParse(body)
    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { action, conflictDeclared, conflictDetails, declineReason, editorComments } = validationResult.data

    // Validate conflict logic
    if (conflictDeclared && action === "accept") {
      return Response.json(
        { error: "Cannot accept assignment when conflict of interest is declared" },
        { status: 400 }
      )
    }

    if (conflictDeclared && !conflictDetails) {
      return Response.json(
        { error: "Conflict details are required when declaring a conflict of interest" },
        { status: 400 }
      )
    }

    if (action === "decline" && !declineReason && !conflictDeclared) {
      return Response.json(
        { error: "Decline reason is required when declining without conflict declaration" },
        { status: 400 }
      )
    }

    // Get the assignment details
    const assignment = await db
      .select({
        id: editorAssignments.id,
        articleId: editorAssignments.articleId,
        editorId: editorAssignments.editorId,
        status: editorAssignments.status,
        deadline: editorAssignments.deadline,
        articleTitle: articles.title,
        editorName: users.name,
        editorEmail: users.email,
      })
      .from(editorAssignments)
      .innerJoin(articles, eq(editorAssignments.articleId, articles.id))
      .innerJoin(users, eq(editorAssignments.editorId, users.id))
      .where(eq(editorAssignments.id, assignmentId))
      .limit(1)

    if (assignment.length === 0) {
      return Response.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    const assignmentData = assignment[0]

    // Check if assignment is still pending
    if (assignmentData.status !== "pending") {
      return Response.json(
        { error: "Assignment has already been responded to" },
        { status: 400 }
      )
    }

    // Check if deadline has passed
    if (new Date() > new Date(assignmentData.deadline)) {
      // Mark as expired
      await db
        .update(editorAssignments)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(editorAssignments.id, assignmentId))

      return Response.json(
        { error: "Assignment deadline has passed" },
        { status: 400 }
      )
    }

    // Update the assignment with editor response
    const updateData: unknown = {
      status: action === "accept" ? "accepted" : "declined",
      responseAt: new Date(),
      conflictDeclared,
      updatedAt: new Date(),
    }

    if (conflictDetails) {
      updateData.conflictDetails = conflictDetails
    }

    if (declineReason) {
      updateData.declineReason = declineReason
    }

    if (editorComments) {
      updateData.editorComments = editorComments
    }

    // Update the assignment
    await db
      .update(editorAssignments)
      .set(updateData)
      .where(eq(editorAssignments.id, assignmentId))

    // If accepted, update article editor assignment
    if (action === "accept") {
      await db
        .update(articles)
        .set({
          editorId: assignmentData.editorId,
          status: "under_review",
          updatedAt: new Date(),
        })
        .where(eq(articles.id, assignmentData.articleId))
    }

    // Send notification email to administrative team
    try {
      const emailContent = emailTemplates.assignmentResponse(
        assignmentData.editorName,
        assignmentData.articleTitle,
        action,
        conflictDeclared,
        conflictDetails,
        declineReason,
        editorComments,
        assignmentId
      )

      await sendEmail({
        to: process.env.ADMIN_EMAIL || "process.env.EMAIL_FROMamjhs.org",
        subject: emailContent.subject,
        html: emailContent.html,
      })
    } catch (emailError) {
      logger.error("Failed to send notification email:", emailError)
      // Don't fail the response for email errors
    }

    return Response.json({
      success: true,
      message: `Assignment ${action}ed successfully`,
      assignment: {
        id: assignmentId,
        status: updateData.status,
        conflictDeclared,
        responseAt: updateData.responseAt,
      },
    })

  } catch (error) {
    logger.error("Error processing editor response:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve assignment details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id

    const assignment = await db
      .select({
        id: editorAssignments.id,
        articleId: editorAssignments.articleId,
        editorId: editorAssignments.editorId,
        assignedAt: editorAssignments.assignedAt,
        deadline: editorAssignments.deadline,
        status: editorAssignments.status,
        assignmentReason: editorAssignments.assignmentReason,
        articleTitle: articles.title,
        articleAbstract: articles.abstract,
        articleKeywords: articles.keywords,
        articleCategory: articles.category,
        editorName: users.name,
        editorEmail: users.email,
      })
      .from(editorAssignments)
      .innerJoin(articles, eq(editorAssignments.articleId, articles.id))
      .innerJoin(users, eq(editorAssignments.editorId, users.id))
      .where(eq(editorAssignments.id, assignmentId))
      .limit(1)

    if (assignment.length === 0) {
      return Response.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    const assignmentData = assignment[0]

    // Check if deadline has passed and update status if needed
    if (assignmentData.status === "pending" && new Date() > new Date(assignmentData.deadline)) {
      await db
        .update(editorAssignments)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(editorAssignments.id, assignmentId))

      assignmentData.status = "expired"
    }

    return Response.json({
      assignment: assignmentData,
    })

  } catch (error) {
    logger.error("Error retrieving assignment:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
