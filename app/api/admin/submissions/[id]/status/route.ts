import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { articles, notifications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function POST(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params);
    const submissionId = params.id;
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status, notes, notifyAuthor = true } = await request.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Update the article status
    const updateResult = await db
      .update(articles)
      .set({ 
        status: status,
        updatedAt: new Date().toISOString()
      })
      .where(eq(articles.id, submissionId))
      .returning({
        id: articles.id,
        title: articles.title,
        authorId: articles.authorId
      })

    if (updateResult.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const submission = updateResult[0]

    // Create notification for author if requested
    if (notifyAuthor) {
      const statusMessages = {
        'submitted': 'Your submission has been received and is being processed.',
        'under_review': 'Your submission is now under peer review.',
        'revision_requested': 'Revisions have been requested for your submission. Please check your email for details.',
        'accepted': 'Congratulations! Your submission has been accepted for publication.',
        'rejected': 'Unfortunately, your submission has not been accepted for publication.',
        'published': 'Your article has been published successfully!'
      }

      const message = statusMessages[status as keyof typeof statusMessages] || `Your submission status has been updated to: ${status}`
      
      try {
        await db.insert(notifications).values({
          userId: submission.authorId,
          type: 'submission_status',
          title: `Submission Status Update: ${submission.title}`,
          message: notes ? `${message}\n\nNotes: ${notes}` : message,
          relatedId: submissionId,
          isRead: false,
          createdAt: new Date().toISOString()
        })
      } catch (notificationError) {
        logger.error("Failed to create notification:", notificationError)
        // Don't fail the whole request if notification fails
      }
    }

    // Log the status change (you might want to add an audit log table)
    logger.info(`Submission ${submissionId} status changed to ${status} by admin ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      submission: {
        id: submission.id,
        status: status,
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    const { params } = context;
    const submissionId = params.id;
    logError(error as Error, { endpoint: `/api/admin/submissions/${submissionId}/status` })
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 })
  }
}
