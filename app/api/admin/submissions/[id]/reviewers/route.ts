import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviews, users, notifications, articles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logError } from "@/lib/logger"
import { sendReviewInvitation } from "@/lib/email-hybrid"

export async function POST(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params);
    const submissionId = params.id;
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !["admin", "editor-in-chief"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reviewerId } = await request.json()

    if (!reviewerId) {
      return NextResponse.json({ error: "Reviewer ID is required" }, { status: 400 })
    }

    // Check if reviewer is already assigned to this submission
    const existingAssignment = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.articleId, submissionId),
        eq(reviews.reviewerId, reviewerId)
      ))
      .limit(1)

    if (existingAssignment.length > 0) {
      return NextResponse.json({ error: "Reviewer is already assigned to this submission" }, { status: 400 })
    }

    // Get reviewer information
    const reviewer = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, reviewerId))
      .limit(1)

    if (reviewer.length === 0) {
      return NextResponse.json({ error: "Reviewer not found" }, { status: 404 })
    }

    // Create review assignment
    const newReview = await db.insert(reviews).values({
      articleId: submissionId,
      reviewerId: reviewerId,
      status: 'pending', // Use valid status from schema
      createdAt: new Date()
    }).returning({
      id: reviews.id,
      status: reviews.status,
      createdAt: reviews.createdAt
    })

    // Create notification for reviewer
    try {
      await db.insert(notifications).values({
        userId: reviewerId,
        type: 'review_assignment',
        title: 'New Review Assignment',
        message: `You have been assigned to review a new submission. Please log in to your reviewer dashboard to access the manuscript.`,
        relatedId: submissionId,
        isRead: false,
        createdAt: new Date()
      })
    } catch (notificationError) {
      logger.error("Failed to create reviewer notification:", notificationError)
    }

    // Send email notification to reviewer using hybrid email service
    try {
      const { sendTemplateEmail } = await import('@/lib/email-hybrid')
      
      await sendTemplateEmail({
        to: reviewer[0].email,
        templateId: 'reviewerAssignment',
        variables: {
          reviewerName: reviewer[0].name || 'Dear Reviewer',
          articleTitle: 'Submission ' + submissionId, // Simplified since we don't have submission data loaded
          authorName: 'Author', // Simplified since we don't have author data loaded
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/review/${newReview[0].id}`
        },
        priority: true
      })
      
      logger.error(`Review assignment email sent to ${reviewer[0].email}`)
    } catch (emailError) {
      logger.error("Failed to send reviewer assignment email:", emailError)
      // Don't fail the API call if email fails - reviewer is still assigned
    }

    return NextResponse.json({
      success: true,
      message: "Reviewer assigned successfully",
      review: {
        id: newReview[0].id,
        reviewerId: reviewerId,
        reviewerName: reviewer[0].name,
        reviewerEmail: reviewer[0].email,
        status: newReview[0].status,
        assignedDate: newReview[0].createdAt
      }
    })
  } catch (error) {
    const params = await Promise.resolve(context.params);
    const submissionId = params.id;
    logError(error as Error, { endpoint: `/api/admin/submissions/${submissionId}/reviewers` })
    return NextResponse.json({ success: false, error: "Failed to assign reviewer" }, { status: 500 })
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params);
    const submissionId = params.id;
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get assigned reviewers for this submission
    const assignedReviewers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        affiliation: users.affiliation,
        reviewId: reviews.id,
        status: reviews.status,
        assignedDate: reviews.createdAt, // Use createdAt as assignedDate
        recommendation: reviews.recommendation,
        comments: reviews.comments,
        submittedAt: reviews.submittedAt
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.articleId, submissionId))

    return NextResponse.json({
      success: true,
      reviewers: assignedReviewers
    })
  } catch (error) {
    const params = await Promise.resolve(context.params);
    const submissionId = params.id;
    logError(error as Error, { endpoint: `/api/admin/submissions/${submissionId}/reviewers` })
    return NextResponse.json({ success: false, error: "Failed to fetch reviewers" }, { status: 500 })
  }
}
