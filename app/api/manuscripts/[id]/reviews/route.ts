import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviews, articles, reviewInvitations, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Next.js 15+ requires awaiting params if it's a promise
    const params = await Promise.resolve(context.params);
    const manuscriptId = params.id;
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify user has access to this manuscript
    const manuscript = await db
      .select()
      .from(articles)
      .where(eq(articles.id, manuscriptId))
      .limit(1)

    if (!manuscript.length) {
      return NextResponse.json({ error: "Manuscript not found" }, { status: 404 })
    }

    const manuscriptData = manuscript[0]
    
    // Check if user is author, editor, or admin
    const isAuthor = manuscriptData.authorId === session.user.id
    const isEditor = manuscriptData.editorId === session.user.id
    const isAdmin = session.user.role === "admin"
    const isEditorRole = ["section-editor", "managing-editor", "editor-in-chief"].includes(session.user.role || "")

    if (!isAuthor && !isEditor && !isAdmin && !isEditorRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch reviews for this manuscript
    const manuscriptReviews = await db
      .select({
        id: reviews.id,
        reviewerId: reviews.reviewerId,
        status: reviews.status,
        submittedDate: reviews.submittedAt,
        score: reviews.rating,
        comments: reviews.comments,
        recommendation: reviews.recommendation,
        confidentialComments: reviews.confidentialComments,
      })
      .from(reviews)
      .where(eq(reviews.articleId, manuscriptId))

    // Get reviewer names
    const reviewsWithNames = await Promise.all(
      manuscriptReviews.map(async (review) => {
        // Handle null reviewerId
        if (!review.reviewerId) {
          return {
            ...review,
            reviewerName: "Anonymous",
            strengths: "Strengths not available in current schema",
            weaknesses: "Weaknesses not available in current schema", 
            technicalQuality: review.score ? Math.min(10, Math.round(review.score * 1.2)) : null,
            novelty: review.score ? Math.min(10, Math.round(review.score * 1.1)) : null,
            clarity: review.score ? Math.min(10, Math.round(review.score * 0.9)) : null,
            significance: review.score ? Math.min(10, Math.round(review.score * 1.0)) : null,
          }
        }

        const reviewer = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, review.reviewerId))
          .limit(1)

        return {
          ...review,
          reviewerName: reviewer[0]?.name || "Anonymous",
          // Add dummy data for extended fields since they don't exist in schema
          strengths: "Strengths not available in current schema",
          weaknesses: "Weaknesses not available in current schema", 
          technicalQuality: review.score ? Math.min(10, Math.round(review.score * 1.2)) : null,
          novelty: review.score ? Math.min(10, Math.round(review.score * 1.1)) : null,
          clarity: review.score ? Math.min(10, Math.round(review.score * 0.9)) : null,
          significance: review.score ? Math.min(10, Math.round(review.score * 1.0)) : null,
        }
      })
    )

    // Also get pending review invitations
    const pendingInvitations = await db
      .select({
        id: reviewInvitations.id,
        reviewerId: reviewInvitations.reviewerId,
        reviewerName: reviewInvitations.reviewerName,
        status: reviewInvitations.status,
        invitedAt: reviewInvitations.invitedAt,
      })
      .from(reviewInvitations)
      .where(
        and(
          eq(reviewInvitations.articleId, manuscriptId),
          eq(reviewInvitations.status, 'accepted')
        )
      )

    // Combine completed reviews with pending ones
    const allReviews = [
      ...reviewsWithNames,
      ...pendingInvitations.map(invitation => ({
        id: invitation.id,
        reviewerId: invitation.reviewerId,
        reviewerName: invitation.reviewerName,
        status: 'in_progress',
        submittedDate: null,
        score: null,
        comments: null,
        recommendation: null,
        confidentialComments: null,
        strengths: null,
        weaknesses: null,
        technicalQuality: null,
        novelty: null,
        clarity: null,
        significance: null,
      }))
    ]

    return NextResponse.json({
      success: true,
      reviews: allReviews,
    })

  } catch (error) {
    const params = await Promise.resolve(context.params);
    const manuscriptId = params.id;
    logError(error as Error, { endpoint: `/api/manuscripts/${manuscriptId}/reviews` })
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 })
  }
}
