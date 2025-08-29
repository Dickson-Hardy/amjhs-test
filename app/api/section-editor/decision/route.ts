import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, editorial_decisions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { logError } from "@/lib/logger"

const decisionSchema = z.object({
  submissionId: z.string(),
  decision: z.enum(['accept', 'reject', 'revision']),
  comments: z.string().optional(),
  editorId: z.string()
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
    const { submissionId, decision, comments, editorId } = decisionSchema.parse(body)

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

    // Update article status based on decision
    let newStatus = ""
    switch (decision) {
      case 'accept':
        newStatus = "accepted"
        break
      case 'reject':
        newStatus = "rejected"
        break
      case 'revision':
        newStatus = "revision_requested"
        break
    }

    // Update the article status
    await db
      .update(articles)
      .set({ 
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(articles.id, submissionId))

    // Record the editorial decision
    await db.insert(editorial_decisions).values({
      articleId: submissionId,
      editorId: session.user.id,
      decision: decision,
      comments: comments || ""
    })

    // Send notification emails to authors
    try {
      // This would send appropriate decision emails based on the decision type
      logger.error(`Decision "${decision}" made for submission ${submissionId} - email notifications would be sent to authors`)
    } catch (emailError) {
      logError(emailError as Error, {
        operation: "decision_notification_email",
        submissionId: submissionId,
        decision: decision
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Editorial decision '${decision}' recorded successfully` 
    })

  } catch (error) {
    logger.error("Error making editorial decision:", error)
    
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
