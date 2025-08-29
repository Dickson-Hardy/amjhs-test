import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { reviews, articles, users, notifications } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { sendEmail } from "@/lib/email-hybrid"
import { emailTemplates } from "@/lib/email-templates"
import { v4 as uuidv4 } from "uuid"

// Validation schema for review invitation
const reviewInvitationSchema = z.object({
  reviewerId: z.string(),
  articleId: z.string(),
  deadline: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = reviewInvitationSchema.safeParse(body)
    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { reviewerId, articleId, deadline } = validationResult.data

    // Get reviewer details
    const reviewer = await db.query.users.findFirst({
      where: eq(users.id, reviewerId)
    })

    if (!reviewer) {
      return Response.json(
        { error: "Reviewer not found" },
        { status: 404 }
      )
    }

    if (!["reviewer", "editor", "associate_editor"].includes(reviewer.role)) {
      return Response.json(
        { error: "User is not authorized to review" },
        { status: 400 }
      )
    }

    // Get article details
    const article = await db.query.articles.findFirst({
      where: eq(articles.id, articleId)
    })

    if (!article) {
      return Response.json(
        { error: "Article not found" },
        { status: 404 }
      )
    }

    // Check if review invitation already exists
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.articleId, articleId),
        eq(reviews.reviewerId, reviewerId)
      )
    })

    if (existingReview) {
      return Response.json(
        { error: "Review invitation already exists for this reviewer" },
        { status: 400 }
      )
    }

    // Generate manuscript number (using article ID for now)
    const manuscriptNumber = `AMHSJ-${new Date().getFullYear()}-${article.id.slice(-8).toUpperCase()}`

    // Create review record
    const reviewId = uuidv4()
    const reviewDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days from now

    await db.insert(reviews).values({
      id: reviewId,
      articleId,
      reviewerId,
      status: "pending",
      createdAt: new Date(),
    })

    // Generate invitation URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL'
    const acceptUrl = `${baseUrl}/reviewer/invitation/${reviewId}/accept`
    const declineUrl = `${baseUrl}/reviewer/invitation/${reviewId}/decline`

    // Send review invitation email
    try {
      // Calculate deadlines
      const responseDeadline = new Date()
      responseDeadline.setDate(responseDeadline.getDate() + 7)
      
      const reviewDeadlineFormatted = new Date(reviewDeadline).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      const responseDeadlineFormatted = responseDeadline.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      const emailContent = emailTemplates.reviewInvitation(
        reviewer.name,
        article.title,
        manuscriptNumber,
        article.abstract,
        acceptUrl,
        declineUrl,
        responseDeadlineFormatted,
        reviewDeadlineFormatted
      )

      await sendEmail({
        to: reviewer.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })
    } catch (emailError) {
      logger.error("Failed to send review invitation email:", emailError)
      // Don't fail the invitation creation for email errors
    }

    // Create notification
    await db.insert(notifications).values({
      id: uuidv4(),
      userId: reviewerId,
      title: "New Review Invitation",
      message: `You have been invited to review "${article.title}"`,
      type: "review",
      relatedId: reviewId,
      createdAt: new Date(),
    })

    return Response.json({
      success: true,
      message: "Review invitation sent successfully",
      review: {
        id: reviewId,
        manuscriptNumber,
        deadline: reviewDeadline,
        status: "pending",
      },
    })

  } catch (error) {
    logger.error("Error sending review invitation:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve review invitations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')
    const reviewerId = searchParams.get('reviewerId')

    let whereClause = undefined
    
    if (articleId && reviewerId) {
      whereClause = and(
        eq(reviews.articleId, articleId),
        eq(reviews.reviewerId, reviewerId)
      )
    } else if (articleId) {
      whereClause = eq(reviews.articleId, articleId)
    } else if (reviewerId) {
      whereClause = eq(reviews.reviewerId, reviewerId)
    }

    const reviewInvitations = await db
      .select({
        id: reviews.id,
        articleId: reviews.articleId,
        reviewerId: reviews.reviewerId,
        status: reviews.status,
        createdAt: reviews.createdAt,
        submittedAt: reviews.submittedAt,
        articleTitle: articles.title,
        reviewerName: users.name,
        reviewerEmail: users.email,
      })
      .from(reviews)
      .innerJoin(articles, eq(reviews.articleId, articles.id))
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(whereClause)

    return Response.json({
      invitations: reviewInvitations,
    })

  } catch (error) {
    logger.error("Error retrieving review invitations:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
