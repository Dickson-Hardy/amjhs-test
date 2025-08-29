import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviews, articles, users } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { reviewSchema } from "@/lib/validations"
import { reviewSubmissionSchema } from "@/lib/enhanced-validations"
import { EditorialWorkflow } from "@/lib/workflow"
import { logError, logInfo } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"

    let query = db
      .select({
        id: reviews.id,
        articleId: reviews.articleId,
        status: reviews.status,
        recommendation: reviews.recommendation,
        submittedAt: reviews.submittedAt,
        createdAt: reviews.createdAt,
        articleTitle: articles.title,
        articleCategory: articles.category,
        authorName: users.name,
      })
      .from(reviews)
      .leftJoin(articles, eq(reviews.articleId, articles.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(reviews.reviewerId, session.user.id))

    if (status !== "all") {
      query = query.where(and(eq(reviews.reviewerId, session.user.id), eq(reviews.status, status)))
    }

    const userReviews = await query.orderBy(desc(reviews.createdAt))

    return NextResponse.json({
      success: true,
      reviews: userReviews,
    })
  } catch (error) {
    logError(error as Error, { endpoint: "/api/reviews" })
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Enhanced validation using new schema
    const validatedData = reviewSubmissionSchema.parse(body)

    // Check if user has permission to review this article
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.articleId, validatedData.articleId),
        eq(reviews.reviewerId, session.user.id)
      ))
      .limit(1)

    if (!existingReview.length) {
      return NextResponse.json({ error: "Review assignment not found" }, { status: 404 })
    }

    // Submit review using workflow
    const result = await EditorialWorkflow.submitReview(
      existingReview[0].id, 
      {
        recommendation: validatedData.recommendation,
        comments: validatedData.comments,
        confidentialComments: validatedData.confidentialComments,
        rating: validatedData.rating
      }
    )

    if (result.success) {
      logInfo("Review submitted successfully", {
        reviewId: existingReview[0].id,
        articleId: validatedData.articleId,
        reviewerId: session.user.id,
        recommendation: validatedData.recommendation,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 })
    }
    
    logError(error as Error, { endpoint: "/api/reviews POST" })
    return NextResponse.json({ success: false, error: "Review submission failed" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = reviewSubmissionSchema.parse(body)
    
    const { reviewId } = validatedData

    if (!reviewId) {
      return NextResponse.json({ 
        success: false, 
        error: "Review ID is required for updates" 
      }, { status: 400 })
    }

    // Check if user has permission to update this review
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.id, reviewId),
        eq(reviews.reviewerId, session.user.id)
      ))
      .limit(1)

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 })
    }

    // Only allow updates if review is still in progress
    if (existingReview.status === 'completed') {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot update completed review" 
      }, { status: 400 })
    }

    // Update the review
    const [updatedReview] = await db
      .update(reviews)
      .set({
        recommendation: validatedData.recommendation,
        comments: validatedData.comments,
        confidentialComments: validatedData.confidentialComments,
        rating: validatedData.rating,
        updatedAt: new Date()
      })
      .where(eq(reviews.id, reviewId))
      .returning()

    logInfo("Review updated successfully", {
      reviewId: updatedReview.id,
      articleId: validatedData.articleId,
      reviewerId: session.user.id,
      recommendation: validatedData.recommendation,
    })

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: "Review updated successfully"
    })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 })
    }
    
    logError(error as Error, { endpoint: "/api/reviews PUT" })
    return NextResponse.json({ success: false, error: "Review update failed" }, { status: 500 })
  }
}
